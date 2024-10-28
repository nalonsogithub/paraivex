import os
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path="../.env")

# Set up environment variables
service_endpoint = os.getenv("AZURE_SEARCH_SERVICE_ENDPOINT")
index_name = os.getenv("AZURE_SEARCH_INDEX_NAME")
key = os.getenv("AZURE_SEARCH_API_KEY")

# Initialize SearchClient
search_client = SearchClient(service_endpoint, index_name, AzureKeyCredential(key))


def upload_document(doc_id, username, question, answer, embedding_vector, tags, created_at, last_updated):

    # Check if embedding_vector is a flat list of floats
    if not all(isinstance(x, (float, int)) for x in embedding_vector):
        print("Error: embedding_vector must be a flat list of floats or integers.")
        return

    """Upload a document to the search index."""
    document = {
        "id": doc_id,
        "username": username,
        "question": question,
        "answer": answer,
        "embedding_vector": embedding_vector,
        "tags": tags,
        "created_at": created_at,
        "last_updated": last_updated
    }

    result = search_client.upload_documents(documents=[document])
    print("Upload succeeded:", result[0].succeeded)


def view_document(doc_id):
    """View a document from the search index by its ID."""
    results = search_client.get_document(key=doc_id)
    print("Document:", results)
    return results


def delete_document(doc_id):
    """Delete a document from the search index by its ID."""
    result = search_client.delete_documents(documents=[{"id": doc_id}])
    print("Delete succeeded:", result[0].succeeded)


def get_documents_by_username(username):
    """Query documents in Azure Search associated with a specific username."""
    try:
        # Define the filter to search by username
        filter_expression = f"username eq '{username}'"

        # Define the fields to retrieve
        selected_fields = ["id", "question", "answer", "tags", "created_at", "last_updated", "embedding_vector", "username"]

        # Query the documents with specific fields
        results = search_client.search(search_text="", filter=filter_expression, select=selected_fields)

        # Collect and print the results
        documents = [doc for doc in results]
        # print(f"Found {len(documents)} documents for username '{username}':")
        # for doc in documents:
        #     print(doc)

        return documents

    except Exception as e:
        print(f"Error querying documents for username '{username}': {e}")
        return []

def search_by_embedding(embedding_vector, tag_filters=None, top_k=5, similarity_threshold=0.7):
    """
    Searches for documents similar to the provided embedding vector.

    Parameters:
        embedding_vector (list): The embedding vector to query with.
        tag_filters (list): Optional list of tags to filter results.
        top_k (int): Number of top results to retrieve.
        similarity_threshold (float): Minimum similarity score for filtering results.

    Returns:
        list: A list of search results with document details.
    """
    vector_query = VectorizedQuery(vector=embedding_vector, k_nearest_neighbors=top_k, fields="embedding_vector")

    # Construct filter expression for multiple tags
    filter_expression = " or ".join([f"tags/any(t: t eq '{tag}')" for tag in tag_filters]) if tag_filters else None

    results = search_client.search(
        search_text=None,
        vector_queries=[vector_query],
        filter=filter_expression,
        select=["id", "tags", "question", "answer"]
    )

    output_results = []
    for result in results:
        score = result.get("@search.score", 0)
        if score >= similarity_threshold:
            output_results.append({
                "ID": result["id"],
                "Score": score,
                "Tags": result.get("tags", []),
                "Question": result.get("question", "No question found"),
                "Answer": result.get("answer", "No answer found")
            })

    return output_results