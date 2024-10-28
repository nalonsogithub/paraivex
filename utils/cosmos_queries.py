# cosmos_queries.py
from azure.cosmos import CosmosClient, exceptions
import os
from dotenv import load_dotenv
from uuid import uuid4
from datetime import datetime
import pytz


# Load environment variables from .env file
load_dotenv(dotenv_path="../.env")

# Cosmos DB configuration
COSMOS_DB_URI = os.getenv("COSMOS_DB_URI")
COSMOS_DB_KEY = os.getenv("COSMOS_DB_KEY")
DATABASE_NAME = os.getenv("DATABASE_NAME")
CONTAINER_NAME = "Users"

# Print to verify environment variables
print(f"COSMOS_DB_URI: {COSMOS_DB_URI}")
print(f"DATABASE_NAME: {DATABASE_NAME}")
print(f"CONTAINER_NAME: {CONTAINER_NAME}")

# Initialize the Cosmos DB client
print("Attempting to connect to Cosmos DB...")
try:
    client = CosmosClient(COSMOS_DB_URI, COSMOS_DB_KEY)
    print("Client created successfully:", client)

    # Get database and container
    database = client.get_database_client(DATABASE_NAME)
    user_container = database.get_container_client(CONTAINER_NAME)
    print(f"Connected to container '{CONTAINER_NAME}' in database '{DATABASE_NAME}'")
except exceptions.CosmosResourceNotFoundError as e:
    print(f"Database or container not found: {e}")
except Exception as e:
    print(f"Error initializing Cosmos DB client: {e}")


def get_user_by_username(username):
    query = "SELECT * FROM c WHERE c.username = @username"
    parameters = [{"name": "@username", "value": username}]
    print('QUERY', query, parameters)
    try:
        results = user_container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True,  # Required if you're querying across partitions
            partition_key=username
        )

        results_list = list(results)  # Convert to list to view results
        print("Query results:", results_list)
        return results_list
    except exceptions.CosmosHttpResponseError as e:
        print(f"Query failed with Cosmos HTTP error: {e}")
        return []
def add_user(username, hashed_password, nda = None):
    # Generate UUID for userId and current timestamp for created_at
    user_id = str(uuid4())  # Generate a unique user ID as a UUID string
    created_at = datetime.now(pytz.utc).isoformat()  # ISO 8601 format in UTC

    new_user = {
        "id": user_id,
        "username": username,
        "password": hashed_password,
        "created_at": created_at,
        "type": "user"  # Specify the document type
    }

    if nda:
        new_user['nda'] = nda

    print('NEW USER', new_user)  # Debug print to confirm data structure
    user_container.create_item(new_user)  # Add to Cosmos DB
    return new_user


def save_user_documents(username, brains, configurations):
    # Filter, set defaults, and prepare brain documents
    brain_documents = []
    for brain in brains:
        if brain.get("name"):  # Only include brains with a name
            brain_doc = {
                "id": str(uuid4()),
                "username": username,
                "brainName": brain["name"],
                "description": brain.get("description", ""),
                "tags": [f"brain_{brain['name'].lower().replace(' ', '_')}"],  # Initial tag list with formatted name
                "type": "brain",
                "created_at": datetime.now(pytz.utc).isoformat()
            }
            brain_documents.append(brain_doc)

    # Filter, set defaults, and prepare configuration documents
    config_documents = []
    for config in configurations:
        if config.get("name"):  # Only include configurations with a name
            config_doc = {
                "id": str(uuid4()),
                "username": username,
                "configName": config["name"],
                "minResults": config.get("minResults", 1),
                "maxResults": config.get("maxResults", 3),
                "similarityThreshold": config.get("similarityThreshold", 0.5),
                "searchDepth": config.get("searchDepth", "shallow"),
                "tags": [f"config_{config['name'].lower().replace(' ', '_')}"],  # Initial tag list with formatted name
                "type": "configuration",
                "created_at": datetime.now(pytz.utc).isoformat()
            }
            config_documents.append(config_doc)

    # Insert documents into Cosmos DB
    try:
        for brain_doc in brain_documents:
            print("Saving Brain Document:", brain_doc)
            user_container.create_item(brain_doc)
            print("Saved Brain Document:", brain_doc)

        for config_doc in config_documents:
            user_container.create_item(config_doc)
            print("Saved Configuration Document:", config_doc)

        print("All documents saved successfully.")
        return {"success": True, "message": "Documents saved successfully"}

    except exceptions.CosmosHttpResponseError as e:
        print(f"Error saving documents to Cosmos DB: {e}")
        return {"success": False, "message": "Failed to save documents to Cosmos DB"}


def get_user_documents(username):
    try:
        # Query brains for the user
        brains_query = "SELECT * FROM c WHERE c.username = @username AND c.type = 'brain'"
        brains = list(user_container.query_items(
            query=brains_query,
            parameters=[{"name": "@username", "value": username}],
            enable_cross_partition_query=True
        ))

        print("Brains Query Result:", brains)  # Debugging print statement

        # Query configurations for the user
        configs_query = "SELECT * FROM c WHERE c.username = @username AND c.type = 'configuration'"
        configurations = list(user_container.query_items(
            query=configs_query,
            parameters=[{"name": "@username", "value": username}],
            enable_cross_partition_query=True
        ))

        print("Configurations Query Result:", configurations)  # Debugging print statement

        # Convert documents to JSON serializable format if needed
        brains_serializable = [dict(item) for item in brains]
        configurations_serializable = [dict(item) for item in configurations]

        # Return documents in JSON structure
        return {
            "success": True,
            "brains": brains_serializable,
            "configurations": configurations_serializable
        }

    except exceptions.CosmosHttpResponseError as e:
        print(f"Error querying user documents: {e}")
        return {"success": False, "message": "Failed to retrieve user documents"}


def delete_user_documents(username):
    try:
        # Delete all brains for the user
        brains_query = "SELECT c.id FROM c WHERE c.username = @username AND c.type = 'brain'"
        brains_to_delete = list(user_container.query_items(
            query=brains_query,
            parameters=[{"name": "@username", "value": username}],
            enable_cross_partition_query=True
        ))

        for brain in brains_to_delete:
            user_container.delete_item(brain['id'], partition_key=username)
            print(f"Deleted Brain Document ID: {brain['id']}")

        # Delete all configurations for the user
        configs_query = "SELECT c.id FROM c WHERE c.username = @username AND c.type = 'configuration'"
        configs_to_delete = list(user_container.query_items(
            query=configs_query,
            parameters=[{"name": "@username", "value": username}],
            enable_cross_partition_query=True
        ))

        for config in configs_to_delete:
            user_container.delete_item(config['id'], partition_key=username)
            print(f"Deleted Configuration Document ID: {config['id']}")

        print("All user documents deleted successfully.")
        return {"success": True, "message": "All user documents deleted successfully"}

    except exceptions.CosmosHttpResponseError as e:
        print(f"Error deleting user documents: {e}")
        return {"success": False, "message": "Failed to delete user documents"}
