import os
from dotenv import load_dotenv
from openai import OpenAI
import numpy as np

# Load environment variables from .env file
load_dotenv(dotenv_path=".env")
api_key = os.getenv("OPENAI_API_KEY")
organizational_id = os.getenv("OPENAI_ORG_ID")
# Debugging: Print API key and org ID to confirm they are loaded
print("API Key:", api_key)
print("Organization ID:", organizational_id)
# Initialize OpenAI client
client = OpenAI(api_key=api_key, organization=organizational_id)

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


