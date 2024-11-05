import os
from dotenv import load_dotenv
from openai import OpenAI
import re
import requests
from bs4 import BeautifulSoup

# Load environment variables from .env file
load_dotenv(dotenv_path=".env")
api_key = os.getenv("OPENAI_API_KEY")
organizational_id = os.getenv("OPENAI_ORG_ID")
# Debugging: Print API key and org ID to confirm they are loaded
print("API Key:", api_key)
print("Organization ID:", organizational_id)
# Initialize OpenAI client
client = OpenAI(api_key=api_key, organization=organizational_id)


def remove_html_tags(text):
    clean_text = re.sub(r'<.*?>', '', text)
    return clean_text

def fetch_full_page_content(url):
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()  # Check for request errors
        soup = BeautifulSoup(response.content, 'html.parser')
        page_text = soup.get_text(separator='\n')  # Extract text with line breaks
        return page_text[:2000]  # Limit to first 2000 characters for initial testing
    except Exception as e:
        print(f"Error fetching content from {url}: {e}")
        return None


# Function to create an embedding for a given text
def create_embedding(text):
    try:
        response = client.embeddings.create(
            model="text-embedding-ada-002",
            input=text
        )
        embedding = response.data[0].embedding
        return embedding
    except Exception as e:
        print(f"Error creating embedding: {e}")
        return None


def generate_OAI_message(instruction_type, user_prompt, context_list=None, bing_result_snippet = None):
    # Define different instruction sets for the system role
    instruction_sets = {
        "default": "You are a helpful assistant that provides detailed and structured responses to user queries.",
        "embedding": """You are an assistant that both converses with the user and formats key points of the conversation into structured JSON at the end of each response. This JSON is used to create embeddings for future interactions.

At the end of each response, include a JSON structure like this:
{
  "followup": "A short question you suggest the user asks next based on the conversation",
  "ai_tags": "A list of suggested single word tags for this content",
  "embeddings": [
    { "question": "question", "response": "response" },
    { "question": "question", "response": "response" }
  ]
}
Your response should first address the user’s question naturally, then append this JSON structure.

Roles:
- Embeddings Section: Format key points from the conversation as question/response pairs under "embeddings." Use these pairs to provide context for future user queries. Be sure to incorporate the question into each answer for clarity.
- AI Tags Section: Always returns a list of tags that summarize the data.
- Follow-up Section: Always add a concise follow-up question to encourage further discussion.
"""
    }

    # If instruction_type is None, return only the user prompt and context list
    i = 0
    if instruction_type is None:
        messages = [{"role": "user", "content": user_prompt}]
        if bing_result_snippet:
            for i, search_result in enumerate(bing_result_snippet, start=1):
                messages.append({
                    "role": "assistant",
                    "content": f"Context {i}{fetch_full_page_content(search_result['url'])}"

                })

        if context_list:
            for j, context in enumerate(context_list, start=1 + i):
                messages.append({
                    "role": "assistant",
                    "content": f"Context {j}: {remove_html_tags(context)}"
                })
        return messages

    # Retrieve and validate the instruction set
    instructions = instruction_sets.get(instruction_type)
    if not instructions:
        raise ValueError("Invalid instruction type provided.")

    # Create the initial messages list with the user prompt including the instruction as context
    user_prompt_with_instructions = f"{user_prompt}\n\n[INSTRUCTIONS: {instructions}]"
    messages = [{
        "role": "user",
        "content": user_prompt_with_instructions
    }]

    # If internet search context is available
    i = 0
    if bing_result_snippet:
        for i, search_result in enumerate(bing_result_snippet, start=1):
            messages.append({
                "role": "assistant",
                # "content": f"Title {i}: {search_result['title']}.\n Search Result {i}: {search_result['snippet']}"
                "content": f"Context {i}: {fetch_full_page_content(search_result['url'])}"

            })
    # If a context list is provided, add each context item as an assistant role message
    if context_list:
        for j, context in enumerate(context_list, start=1 + i):
            messages.append({
                "role": "assistant",
                "content": f"Context {j}: {remove_html_tags(context)}"
            })


    return messages
