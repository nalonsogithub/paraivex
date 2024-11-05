# app.py
from flask import Flask, request, jsonify, send_from_directory, session, stream_with_context, Response
from flask_cors import CORS
from utils.cosmos_queries import get_user_by_username, add_user, save_user_documents, get_user_documents, delete_user_documents
from utils.openai_client import create_embedding, generate_OAI_message
from utils.auth_utils import hash_password, verify_password
from utils.ai_search import upload_document, delete_document, search_by_embedding, get_documents_by_username_and_tags, get_tags_by_username
from utils.bing_search import return_bing_isearch_results
from openai import OpenAI, AssistantEventHandler
import os
import numpy as np
from datetime import datetime
import uuid
from dotenv import load_dotenv
import queue

# Load environment variables from .env file
load_dotenv(dotenv_path=".env")


app = Flask(__name__, static_folder="paraivexreact/build", static_url_path="/")
app.secret_key = os.environ.get('SECRET_FLASK_KEY')

# CORS(app, resources={r"/api/*": {"origins": [
#     "http://localhost:5000",     # Localhost for backend
#     "http://localhost:3000",     # Localhost for frontend
#     "https://paraivex-bmd3d3h2gmgda6cf.eastus2-01.azurewebsites.net",  # Azure default domain
#     "https://www.paraivex.com",  # Primary production domain
#     "https://*.paraivex.com"     # All subdomains of paraivex.com
# ]}})
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": [
    "http://localhost:5000",     # Localhost for backend
    "http://localhost:3000",     # Localhost for frontend
    "https://paraivex-bmd3d3h2gmgda6cf.eastus2-01.azurewebsites.net",  # Azure default domain
    "https://www.paraivex.com",  # Primary production domain
    "https://*.paraivex.com"     # All subdomains of paraivex.com
]}})

api_key = os.getenv('OPENAI_API_KEY')
organizational_id = os.getenv('ORGANIZATIONAL_ID')
client = OpenAI(api_key=api_key, organization=organizational_id)
message_queue = queue.Queue()

def initialize_session_variables():
    print('INITIALIZING SESSION VARIABLES')
    session.modified = True
    session['CHAT_ID'] = None
    session['OAI_THREAD_ID'] = None
    session['BING_URLS'] = [{"title": "Google",
                             "snippet": "Sample",
                             "url": "https://www.google.com"}]
    return 0

def retrieve_session_variable(variable_name):
    print('RETRIEVING VARIABLE', variable_name)
    return session[variable_name]


def set_session_variable(variable_name, value):
    print('SETTING VARIABLE', variable_name, value)
    session[variable_name] = value
    return 0

def override(method):
    return method


import re
import json

def extract_and_parse_json(response):
    try:
        # Regex to match JSON within a Markdown block or at the end of the response
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```|\{[\s\S]*\}$', response)

        if json_match:
            # Extract JSON content from the match
            json_snippet = json_match.group(1) if json_match.group(1) else json_match.group(0)

            # Attempt to parse the JSON
            parsed_json = json.loads(json_snippet)
            print("Parsed JSON:", parsed_json)
            return parsed_json
        else:
            print("No JSON found in the response.")
            return None

    except json.JSONDecodeError as e:
        print("Error parsing JSON from response:", e)
        return None


def get_openai_response_instructions_2(prompt, assistant_id=None,
                                       thread_id=None):
    if (prompt == ''):
        # print('no prompt entered')
        return 'NO PROMPT'

    api_key = os.getenv('OPENAI_API_KEY')
    organizational_id = os.getenv('ORGANIZATIONAL_ID')

    if not api_key:
        raise ValueError("API key not found. Set the OPENAI_API_KEY environment variable.")

    # Initialize OpenAI client
    # if client is None:
    client = OpenAI(api_key=api_key, organization=organizational_id)
    # else:
    #     client = client

    # create assistant
    if assistant_id is None:
        assistant_id = os.getenv('OPENAI_ASSISTANT_ID')
    assistant = client.beta.assistants.retrieve(assistant_id=assistant_id)

    # Create a thread and attach the file to the message
    if thread_id is None:
        if retrieve_session_variable('OAI_THREAD_ID'):
            thread_id = retrieve_session_variable('OAI_THREAD_ID')
        else:
            thread = client.beta.threads.create()
            thread_id = thread.id

    # Create a new message in the thread
    client.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=prompt
    )

    run = client.beta.threads.runs.create_and_poll(
        thread_id=thread_id, assistant_id=assistant.id
    )

    messages = list(client.beta.threads.messages.list(thread_id=thread_id, run_id=run.id))

    message_content = messages[0].content[0].text
    annotations = message_content.annotations
    citations = []
    for index, annotation in enumerate(annotations):
        message_content.value = message_content.value.replace(annotation.text, f"[{index}]")
        if file_citation := getattr(annotation, "file_citation", None):
            cited_file = client.files.retrieve(file_citation.file_id)
            citations.append(f"[{index}] {cited_file.filename}")

    return message_content.value, thread_id, client


import json


def generate_prompt_for_internet_suggestions(user_prompt, context_list=None):
    # Define instructions for generating structured JSON for internet queries
    instructions = """
    You are an assistant that suggests well-structured internet queries based on the user's prompt and the context of the conversation so far. At the end of your response, provide a structured JSON like this:
    {
      "suggested_queries": [
        "Suggested internet query 1",
        "Suggested internet query 2",
        "Suggested internet query 3"
      ],
    }
    """

    # Construct the full prompt
    full_prompt = f"User Prompt: {user_prompt}\n\n[Instructions: {instructions}]\n"
    if context_list:
        context_section = "\n".join([f"Context {i}: {context}" for i, context in enumerate(context_list, start=1)])
        full_prompt += f"\n{context_section}\n"

    return full_prompt


def return_internet_query_suggestions(user_prompt, context_list=None, assistant_id=None, thread_id=None):
    # Generate the prompt string
    prompt = generate_prompt_for_internet_suggestions(user_prompt)

    # Call the function to get OpenAI response
    response, t1, t2 = get_openai_response_instructions_2(prompt, assistant_id=assistant_id, thread_id=thread_id)

    # Extract and parse JSON from the response text
    try:
        # Assuming response contains the structured JSON at the end
        parsed_json = extract_and_parse_json(response)
        return parsed_json
    except json.JSONDecodeError as e:
        print("Error parsing JSON from response:", e)
        return None

class EventHandler(AssistantEventHandler):
    def __init__(self, queue):
        super().__init__()
        self.queue = queue

    @override
    def on_text_created(self, text) -> None:
        print(f"\nassistant > ", end="", flush=True)

    @override
    def on_text_delta(self, delta, snapshot):
        message = delta.value
        if message:
            self.queue.put(message)

    @override
    def on_tool_call_created(self, tool_call):
        print(f"\nassistant > {tool_call.type}\n", flush=True)

    @override
    def on_message_done(self, message) -> None:
        message_content = message.content[0].text
        annotations = message_content.annotations
        citations = []
        for index, annotation in enumerate(annotations):
            message_content.value = message_content.value.replace(
                annotation.text, f"[{index}]"
            )
            if file_citation := getattr(annotation, "file_citation", None):
                cited_file = client.files.retrieve(file_citation.file_id)
                citations.append(f"[{index}] {cited_file.filename}")


# Serve the React app as the default route
@app.route("/")
@app.route("/<path:path>")
def serve_react_app(path=""):
    full_path = os.path.join(app.static_folder, path)

    # INITIALIZE VARIABLES
    if "CHAT_ID" not in session:
        initialize_session_variables()

    if path != "" and os.path.exists(full_path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    nda = data.get("nda", None)

    # Check if the user already exists
    existing_users = get_user_by_username(username)
    if existing_users:
        return jsonify({"success": False, "message": "Username already taken."}), 400

    # Hash the password and create user
    hashed_password = hash_password(password)
    add_user(username, hashed_password, nda)
    print(f"User {username} signed up successfully with hashed password.")
    return jsonify({"success": True, "message": "User signed up successfully!"})

@app.route('/api/login', methods=['POST'])
def login():
    print('LOGIN')
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    # INITIALIZE SESSIN VARS
    initialize_session_variables()

    # Find the user in Cosmos DB
    # print('USERNAME', username)
    users = get_user_by_username(username)
    # print('USERS', username, users)
    # Check if user exists and verify password
    if users and verify_password(password, users[0]["password"]):
        print(f"User {username} logged in successfully.")

        # Return success and user data, including tags
        return jsonify({
            "success": True,
            "message": "Logged in successfully!",
            "userId": users[0].get("userId"),  # or any unique ID if present
            "username": users[0].get("username"),
            "tags": users[0].get("tags", [])
        })
    else:
        return jsonify({"success": False, "message": "Invalid username or password."}), 401

@app.route('/api/update_user_config', methods=['POST'])
def update_user_config():
    data = request.get_json()  # Get the JSON payload from the request
    # print('RECEIVED DATA:', json.dumps(data, indent=4))  # For better readability in logs

    username = data.get("username")
    brains = data.get("brains", [])
    configurations = data.get("configurations", [])

    # Step 1: Delete existing documents
    delete_result = delete_user_documents(username)
    if not delete_result["success"]:
        return jsonify(delete_result), 500  # Return error if deletion fails

    # Step 2: Save new documents
    save_result = save_user_documents(username, brains, configurations)
    if not save_result["success"]:
        return jsonify(save_result), 500  # Return error if saving fails

    return jsonify({"success": True, "message": "User documents updated successfully"})
@app.route('/api/get_user_config', methods=['GET'])
def get_user_config():
    username = request.args.get("username")  # Assumes userId is passed as a query parameter

    # Fetch user documents
    print('GETTING DOCUMENTS FOR USERNAME', username)
    result = get_user_documents(username)

    # Return the JSON result to the frontend
    return jsonify(result)

@app.route('/api/add_embedding', methods=['POST'])
def add_embedding():
    data = request.get_json()
    username = data.get("username")
    question = data.get("question")
    answer = data.get("answer")
    tags = data.get("tags", [])

    # For debugging, print the received data
    # print("Received Embedding Data:")
    # print("Username:", username)
    # print("Question:", question)
    # print("Answer:", answer)
    # print("Tags:", tags)

    embedding = create_embedding(question)
    # print("Embedding:", embedding)


    # Generate a unique document ID
    doc_id = str(uuid.uuid4())

    # Create the embedding for the answer text
    embedding_vector = create_embedding(answer)
    if embedding_vector is None:
        return jsonify({"success": False, "message": "Failed to create embedding"}), 500

    # Set timestamps for created and last updated fields
    created_at = datetime.utcnow().isoformat() + "Z"
    last_updated = created_at

    # Upload document to Azure Search
    upload_document(
        doc_id=doc_id,
        username=username,
        question=question,
        answer=answer,
        embedding_vector=embedding_vector,
        tags=tags,
        created_at=created_at,
        last_updated=last_updated
    )    # Placeholder for success response


    return jsonify({"success": True, "message": "Embedding saved successfully"})

@app.route('/api/delete_embedding', methods=['POST'])
def delete_embedding():
    data = request.get_json()
    doc_id = data.get("doc_id")

    if not doc_id:
        return jsonify({"success": False, "message": "Document ID is required"}), 400

    try:
        delete_document(doc_id)  # Call your delete function
        return jsonify({"success": True, "message": "Embedding deleted successfully"})
    except Exception as e:
        print(f"Error deleting document: {e}")
        return jsonify({"success": False, "message": "Failed to delete embedding"}), 500


@app.route('/api/get_user_tags', methods=['GET'])
def get_user_tags():
    username = request.args.get("username")

    if not username:
        return jsonify({"success": False, "message": "Username is required"}), 400

    try:
        tags = get_tags_by_username(username)
        # print('DOCUMENTS', documents)
        return jsonify({"success": True, "tags": tags})
    except Exception as e:
        print(f"Error retrieving tags for username '{username}': {e}")
        return jsonify({"success": False, "message": "Failed to retrieve documents"}), 500

@app.route('/api/get_user_embeddings', methods=['GET'])
def get_user_embeddings():
    # Retrieve username and tags from query parameters
    username = request.args.get("username")
    tags = request.args.get("tags")  # Expecting comma-separated tags

    # Check if username is provided
    if not username:
        return jsonify({"success": False, "message": "Username is required"}), 400

    # Convert tags to a list if provided
    tag_list = tags.split(",") if tags else None

    try:
        # Call the updated function with username and optional tags
        documents = get_documents_by_username_and_tags(username, tags=tag_list)
        return jsonify({"success": True, "documents": documents})
    except Exception as e:
        print(f"Error retrieving documents for username '{username}' with tags '{tags}': {e}")
        return jsonify({"success": False, "message": "Failed to retrieve documents"}), 500




@app.route('/api/update_embedding', methods=['POST'])
def update_embedding():
    embedding_data = request.get_json()
    # print("Received Embedding Data:", json.dumps(embedding_data, indent=4))
    # print('RECEIVED EMBEDDING DATA')

    # Extract the document details from the JSON data
    old_doc_id = embedding_data.get("id")
    username = embedding_data.get("username")
    question = embedding_data.get("question")
    answer = embedding_data.get("answer")
    embedding_vector = embedding_data.get("embedding_vector", [])
    tags = embedding_data.get("tags", [])
    # print('RECEIVED EMBEDDING DATA tags', tags)


    # Use milliseconds precision and add "Z" to indicate UTC
    created_at = embedding_data.get("created_at", datetime.utcnow().isoformat(timespec='milliseconds') + "Z")
    last_updated = datetime.utcnow().isoformat(timespec='milliseconds') + "Z"

    # Generate a new doc_id for the updated document
    new_doc_id = str(uuid.uuid4())

    # Step 1: Upload the new document
    upload_document(
        doc_id=new_doc_id,
        username=username,
        question=question,
        answer=answer,
        embedding_vector=embedding_vector,
        tags=tags,
        created_at=created_at,
        last_updated=last_updated
    )

    # Step 2: Delete the old document
    delete_document(old_doc_id)

    return jsonify({"success": True, "message": "Embedding updated successfully"})


@app.route('/api/similarity_search', methods=['POST'])
def similarity_search():
    data = request.json
    user_prompt = data.get("userPrompt")
    tags = data.get("tags", [])
    top_k = data.get("top_k", 3)
    cosine_threshold = data.get("cosine_similarity_threshold", 0.7)

    # print(
    #     f"Received request with userPrompt: {user_prompt}, tags: {tags}, top_k: {top_k}, cosine_threshold: {cosine_threshold}")

    # Generate embedding
    try:
        embedding_vector = create_embedding(user_prompt)
        # print(f"Generated embedding vector: {embedding_vector[:5]}...")  # Show part of the vector for brevity
    except Exception as e:
        # print(f"Error generating embedding: {e}")
        return jsonify({"error": f"Error generating embedding: {e}"}), 500

    filter_expression = " or ".join([f"tags/any(t: t eq '{tag}')" for tag in tags]) if tags else None
    # print(f"Filter expression for tags: {filter_expression}")

    try:
        # Perform search with the generated embedding
        results = search_by_embedding(
            embedding_vector=embedding_vector,
            tag_filters=tags,
            top_k=top_k,
            similarity_threshold=cosine_threshold
        )

        # print("Raw search results:", results)  # Print raw results for debugging

        # Filter results based on cosine similarity threshold and extract details
        # filtered_results = [
        #     {
        #         "id": result["id"],
        #         "question": result["question"],
        #         "answer": result["answer"],
        #         "score": result.get("@search.score")
        #     }
        #     for result in results if result.get("@search.score", 0) >= cosine_threshold
        # ]
        filtered_results = [
            {
                "id": result["ID"],
                "question": result["Question"],
                "answer": result["Answer"],
                "score": result["Score"]  # Use 'Score' instead of '@search.score'
            }
            for result in results if result["Score"] >= cosine_threshold
        ]

        # print("Filtered results:", filtered_results)  # Print filtered results for debugging
        return jsonify({"results": filtered_results})
    except Exception as e:
        print(f"Error during search: {e}")
        return jsonify({"error": f"Error during search: {e}"}), 500

# @app.route('/api/ask_stream', methods=["GET", "POST"])
# def ask_stream():
#     print('IN ASK STREAM')
#     # Extract data from request
#     data = request.get_json()
#     prompt = data['system_prompt']
#     selected_options = data['selected_options']
#     context_list = data['context_list']
#     isearch_depth = data['isearch_depth']
#
#     assistant_id = os.getenv('OPENAI_ASSISTANT_ID')
#     formatted_date = None
#
#     print('IN ASK STREAM', prompt, assistant_id)
#     if not prompt:
#         return jsonify({'error': 'No question provided'}), 400
#
#     message_queue = queue.Queue()
#
#
#     # SAVE CHAT TO DATABASE
#     chat_id = None
#     if 'CHAT_ID' in session:
#         chat_id = retrieve_session_variable('CHAT_ID')
#     if not chat_id:
#         chat_id = uuid.uuid4()
#         set_session_variable('CHAT_ID', chat_id)
#
#     thread_id = None
#     if ('OAI_THREAD_ID' in session) & ('new_thread' not in selected_options):
#         thread_id = retrieve_session_variable('OAI_THREAD_ID')
#
#     if not thread_id:
#         # Create a thread (if none exists)
#         thread = client.beta.threads.create()
#         thread_id = thread.id
#         set_session_variable('OAI_THREAD_ID', thread_id)
#
#     # if user said internet
#     bing_result_snippet = None
#     if 'internet' in selected_options:
#         yield 'Asking ChatGPT for internet searches ...'
#         internet_queries = return_internet_query_suggestions(prompt,
#                                                              context_list=None,
#                                                              assistant_id=os.getenv('OPENAI_ASSISTANT_ID'),
#                                                              thread_id=retrieve_session_variable('OAI_THREAD_ID'))
#         recommended_queries = internet_queries['suggested_queries']
#         depth = min(len(recommended_queries), isearch_depth)
#         internet_context_list = []
#         for i in range(depth):
#             yield 'Performing Internet Searches ...'
#             bing_result, bing_result_snippet = return_bing_isearch_results(recommended_queries[i])
#
#
#     # BUILD PROMPT WITH CONTEXT
#     new_message = generate_OAI_message(instruction_type='embedding',
#                                        user_prompt=prompt,
#                                        context_list=context_list,
#                                        bing_result_snippet=bing_result_snippet)
#     print('NEW MESSAGE', new_message)
#
#
#     # Send each part of `new_message` to the assistant
#     for message in new_message:
#         client.beta.threads.messages.create(
#             thread_id=thread_id,
#             role=message['role'],
#             content=message['content'],
#         )
#
#     print('IN ASK', prompt, assistant_id, thread_id)
#     yield "Generating Response ..."
#
#
#     def generate():
#         if formatted_date:
#             buffer = formatted_date + ' '
#         else:
#             buffer = ""
#         entire_response = ""  # Collect the entire response
#
#         # If no canned response is used, proceed with the normal chatbot interaction
#         event_handler = EventHandler(message_queue)
#         # print('ASKING QUESTION WITH ASSISTANT ID', assistant_id)
#         with client.beta.threads.runs.stream(
#                 thread_id=thread_id,
#                 assistant_id=assistant_id,
#                 event_handler=event_handler,
#         ) as stream:
#             try:
#                 for st in stream:
#                     if not message_queue.empty():
#                         message = message_queue.get_nowait()
#                         buffer = message
#                         entire_response += message
#                         yield buffer
#
#             except Exception as e:
#                 print(f"Error occurred: {e}")
#                 raise
#             finally:
#                 stream.until_done()
#
#             # Yield any remaining buffer
#             if buffer:
#                 # print('BUFFER', buffer)
#                 yield buffer
#
#         # Check for SITE_LOCATION in the entire response after streaming is done
#         print('ENTIRE RESPONSE', entire_response)
#     return Response(stream_with_context(generate()), content_type='text/event-stream')
@app.route('/api/ask_stream', methods=["GET", "POST"])
def ask_stream():
    print('IN ASK STREAM')
    # Extract data from request
    data = request.get_json()
    prompt = data['system_prompt']
    selected_options = data['selected_options']
    context_list = data['context_list']
    isearch_depth = data['isearch_depth']

    assistant_id = os.getenv('OPENAI_ASSISTANT_ID')
    formatted_date = None

    print('IN ASK STREAM', prompt, assistant_id)
    if not prompt:
        return jsonify({'error': 'No question provided'}), 400

    message_queue = queue.Queue()

    # SAVE CHAT TO DATABASE
    chat_id = None
    if 'CHAT_ID' in session:
        chat_id = retrieve_session_variable('CHAT_ID')
    if not chat_id:
        chat_id = uuid.uuid4()
        set_session_variable('CHAT_ID', chat_id)

    thread_id = None
    if ('OAI_THREAD_ID' in session) & ('new_thread' not in selected_options):
        thread_id = retrieve_session_variable('OAI_THREAD_ID')

    if not thread_id:
        # Create a thread (if none exists)
        thread = client.beta.threads.create()
        thread_id = thread.id
        set_session_variable('OAI_THREAD_ID', thread_id)

    collected_bing_results = []
    def generate():
        nonlocal formatted_date
        if formatted_date:
            buffer = formatted_date + ' '
        else:
            buffer = ""
        entire_response = ""  # Collect the entire response

        # Indicate that the internet search is starting
        bing_result_snippet = None
        if 'internet' in selected_options:
            yield 'update: Asking ChatGPT for internet searches...\n\n'
            internet_queries = return_internet_query_suggestions(prompt,
                                                                 context_list=None,
                                                                 assistant_id=assistant_id,
                                                                 thread_id=thread_id)
            recommended_queries = internet_queries['suggested_queries']
            depth = min(len(recommended_queries), isearch_depth)
            internet_context_list = []
            for i in range(depth):
                yield 'update: Performing Internet Searches...\n\n'
                bing_result, bing_result_snippet = return_bing_isearch_results(recommended_queries[i], results=3)
                internet_context_list += bing_result_snippet
                collected_bing_results.extend(bing_result_snippet)

        # BUILD PROMPT WITH CONTEXT
        new_message = generate_OAI_message(instruction_type='embedding',
                                           user_prompt=prompt,
                                           context_list=context_list,
                                           bing_result_snippet=bing_result_snippet)
        print('NEW MESSAGE', new_message)

        # Indicate the message sending process
        yield 'update: Sending prompt to assistant...\n\n'

        for message in new_message:
            client.beta.threads.messages.create(
                thread_id=thread_id,
                role=message['role'],
                content=message['content'],
            )

        yield 'update: Generating response...\n\n'

        # If no canned response is used, proceed with the normal chatbot interaction
        event_handler = EventHandler(message_queue)
        with client.beta.threads.runs.stream(
                thread_id=thread_id,
                assistant_id=assistant_id,
                event_handler=event_handler,
        ) as stream:
            try:
                for st in stream:
                    if not message_queue.empty():
                        message = message_queue.get_nowait()
                        buffer = message
                        entire_response += message
                        yield message

            except Exception as e:
                print(f"Error occurred: {e}")
                yield f'data: Error occurred: {str(e)}\n\n'
                raise
            finally:
                stream.until_done()

            # Yield any remaining buffer
            if buffer:
                yield buffer

        # Check for SITE_LOCATION in the entire response after streaming is done
        print('ENTIRE RESPONSE', entire_response)

    if collected_bing_results:
        print('COLLECTED BING RESULTS', collected_bing_results)
        set_session_variable('BING_URLS', collected_bing_results)
    return Response(stream_with_context(generate()), content_type='text/event-stream')

@app.route('/api/get_bing_urls', methods=["GET"])
def get_bing_urls():
    bing_urls = None
    if 'BING_URLS' in session:
        print('BNG_URLS IN SESSION')
        bing_urls = retrieve_session_variable('BING_URLS')
    else:
        print('BNG_URLS NOT IN SESSION')
        initialize_session_variables()
        bing_urls = retrieve_session_variable('BING_URLS')

    if bing_urls:
        return jsonify(bing_urls)
    else:
        return jsonify({"error": "No BING URLs available"}), 404

@app.route('/api/logout', methods=['GET'])
def logout():
    print('USER SESSION LOGGEDUT')
    session.clear()  # Clears the session
    return jsonify({"success": True, "message": "Logged out successfully"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
