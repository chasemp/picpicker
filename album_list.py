import requests
import json
import os
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

# --- Configuration ---
CLIENT_SECRET_FILE = './token.json'  # Replace with the actual path to your credentials file
SCOPES = ['https://www.googleapis.com/auth/photoslibrary.readonly']

def get_access_token():
    """Gets a valid access token using OAuth 2.0."""
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                CLIENT_SECRET_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return creds.token

def list_album_ids_with_names(access_token):
    """Lists the IDs and names of albums for the authenticated user."""
    base_url = "https://photoslibrary.googleapis.com/v1/albums"
    headers = {'Authorization': f'Bearer {access_token}'}

    try:
        response = requests.get(base_url, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes

        data = response.json()
        albums = data.get("albums", [])

        if albums:
            print("Album IDs and Names:")
            for album in albums:
                print(f"- ID: {album.get('id')}, Name: {album.get('title', 'No Title')}")
        else:
            print("No albums found.")

        next_page_token = data.get("nextPageToken")
        while next_page_token:
            params = {'pageToken': next_page_token}
            response = requests.get(base_url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            albums = data.get("albums", [])
            if albums:
                for album in albums:
                    print(f"- ID: {album.get('id')}, Name: {album.get('title', 'No Title')}")
            next_page_token = data.get("nextPageToken")

    except requests.exceptions.RequestException as e:
        print(f"Error communicating with the Google Photos API: {e}")
    except json.JSONDecodeError:
        print("Error decoding the JSON response from the API.")

if __name__ == "__main__":
    access_token = get_access_token()
    print(access_token)
    if access_token:
        list_album_ids_with_names(access_token)
