import os
import json
from dotenv import load_dotenv
import requests



# Load environment variables from .env file
load_dotenv(dotenv_path="../.env")



def return_bing_isearch_results(query, results=5):
    headers = {
        'Ocp-Apim-Subscription-Key': os.getenv('BING_SEARCH_API_KEY'),
    }
    params = {
        'q': query,
        'count': results,  # Number of search results to return
        'responseFilter': 'Webpages',
        'textDecorations': True,
        'textFormat': 'HTML',
    }

    try:
        # Perform the search
        response = requests.get(os.getenv('BING_SEARCH_ENDPOINT'), headers=headers, params=params)
        response.raise_for_status()
        search_results = response.json()

        # Prepare the JSON for the search results
        result_json = json.dumps(search_results, indent=2)

        # Prepare a list of JSON snippets for prompt context
        if 'webPages' in search_results and 'value' in search_results['webPages']:
            snippet_list = [
                {
                    "title": result["name"],
                    "snippet": result["snippet"],
                    "url": result["url"]
                }
                for result in search_results['webPages']['value']
            ]

        else:
            snippet_list = []

        return search_results, snippet_list

    except requests.exceptions.RequestException as e:
        error_message = {"error": str(e)}
        return error_message

