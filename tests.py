import re
import requests
import json

BING_SEARCH_API_KEY = 'e925a9c052c94e628afca0290b51fbd7'
BING_SEARCH_ENDPOINT = 'https://api.bing.microsoft.com/v7.0/search'

def perform_search_and_prepare_context(query, results = 5):
    headers = {
        'Ocp-Apim-Subscription-Key': BING_SEARCH_API_KEY,
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
        response = requests.get(BING_SEARCH_ENDPOINT, headers=headers, params=params)
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


# Example usage
query = "latest AI advancements in finance"
full_results_json, snippet_context_json = perform_search_and_prepare_context(query)

# Print the results
print("Full Results JSON:")
print(full_results_json)
print("\nSnippet Context JSON:")
print(snippet_context_json)

len(snippet_context_json)
def remove_html_tags(text):
    clean_text = re.sub(r'<.*?>', '', text)
    return clean_text

for i in snippet_context_json:
    print(remove_html_tags(i['snippet']))





from bs4 import BeautifulSoup

# Test
soup = BeautifulSoup("<p>Hello, world!</p>", "html.parser")
print(soup.get_text())

import requests
from bs4 import BeautifulSoup

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

tmp = fetch_full_page_content(snippet_context_json[1]['url'])
