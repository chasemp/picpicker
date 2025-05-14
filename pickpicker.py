import requests
import random
import os
import json
import time
import logging
import hashlib
from urllib.parse import urlparse
from googleapiclient.discovery import build
from google.oauth2 import credentials
from google_auth_httplib2 import AuthorizedHttp  # Needed for authenticated requests
from google.oauth2 import service_account  # If using service account
import google.auth

# Configuration (replace with your actual values)
ALBUM_ID = "AF1QipOJkD9j_te4qXY7db0N-2HDGeMbZnt-WuDT-uQsiSdSjuAnFCgkoDLQGehMDOUtZg?key=UVNOM2dDZVVLcnE4LVdnb2tHWnhTN3ZuOHF6VEVn"  # Replace with your Google Photos Album ID
# Option 1: API Key (Less Secure, for Publicly Shared Albums Only)
API_KEY = "AIzaSyDiG6USaFztzO34De4bEodhK1vyp8x-EE4"  # Replace with your Google Photos API key if required.

# Option 2: OAuth 2.0 Credentials (Recommended) - see below for details
# CREDENTIALS_FILE = "path/to/your/credentials.json"  # Path to your downloaded credentials JSON file. Set to None if using API key
CREDENTIALS_FILE = None # Change to a valid path to a service account or user cred file if you are authenticating that way.

PHOTOS_FILE = "fetched_photos.json"
OUTPUT_DIR = "downloaded_photos"
MAX_RETRIES = 3
INITIAL_BACKOFF = 1
HASH_ALGORITHM = "sha256"
PAGE_SIZE = 50 # Number of results per page. Google Photos API allows a maximum of 100.

# Google Photos API endpoint (V1 is the current stable version as of my knowledge cut-off)
API_ENDPOINT = "https://photoslibrary.googleapis.com/v1"

# Google Photos API scopes (ensure these are enabled in your Google Cloud Console project)
SCOPES = ['https://www.googleapis.com/auth/photoslibrary.readonly']  # Read-only access to the Photos Library

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def load_fetched_photo_ids():
    """Loads previously fetched photo IDs and hashes from the local file."""
    try:
        with open(PHOTOS_FILE, "r") as f:
            return json.load(f)  # Load as a dictionary (ID: hash)
    except FileNotFoundError:
        return {}  # Return an empty dictionary
    except json.JSONDecodeError:
        logging.warning("Corrupted photos file. Starting with an empty dictionary.")
        return {}


def save_fetched_photo_id(photo_id, file_hash, fetched_data):
    """Saves a new fetched photo ID and its hash to the local file."""
    fetched_data[photo_id] = file_hash  # Store ID and hash
    with open(PHOTOS_FILE, "w") as f:
        json.dump(fetched_data, f)  # Save the dictionary


def authenticate():
    """Authenticates with the Google Photos API.

    Returns:
        An authorized HTTP object for making API requests.

    Raises:
        Exception: If authentication fails.
    """

    if CREDENTIALS_FILE:
        # Option 1: Using a Service Account Key File (for server-side applications)
        try:
            creds = service_account.Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
            # Option 2: Using a User Account Key File (for desktop applications, will require browser-based authentication)
            # creds = google.oauth2.credentials.Credentials.from_authorized_user_file(CREDENTIALS_FILE, SCOPES)
            # refresh_token = creds.token
            logging.info("Authenticated using credentials file.")
        except Exception as e:
            logging.error(f"Failed to authenticate with credentials file: {e}")
            raise

    else:  # Using an API Key (Less Secure)
        creds = None # No credentials needed for API Key authentication

    return creds # Return the credentials to be used.

def get_photos_from_album(album_id, api_key, creds):
    """Retrieves a list of photo IDs and URLs from a Google Photos album using API calls.

    Args:
        album_id: The ID of the Google Photos album.
        api_key: Your Google Photos API key (if using).
        creds: Authenticated credentials (if using OAuth).
    Returns:
        A list of dictionaries, where each dictionary contains 'id' and 'baseUrl' keys
        representing a photo in the album. Returns an empty list if no photos
        are found.
    """
    photos = []
    nextPageToken = None

    if creds:
        # Option 1: OAuth 2.0 Authentication
        try:
            service = build('photoslibrary', 'v1', credentials=creds, static_discovery=False) # Static Discovery =False is needed for certain credentials such as API Keys

            while True:
                try:
                    results = service.mediaItems().search(
                        body={'albumId': album_id, 'pageSize': PAGE_SIZE, 'pageToken': nextPageToken}).execute() # Max PAGE_SIZE is 100 for mediaItems().search
                    items = results.get('mediaItems', [])

                    for item in items:
                        photo = {
                            "id": item['id'],
                            "baseUrl": item['baseUrl'],
                            "filename": item.get('filename', 'unknown_file') # Attempt to get filename
                        }
                        photos.append(photo)
                    nextPageToken = results.get('nextPageToken')
                    if not nextPageToken:
                        break # No more pages

                except Exception as e:
                    logging.error(f"Error fetching photos from album: {e}")
                    return []  # Return empty list on error

        except Exception as e:
            logging.error(f"Error building Photos Library service: {e}")
            return [] # Return empty list on error

    else:
        # Option 2: API Key Authentication
        # WARNING: This is less secure and may not work for all albums. Only use with public albums.
        headers = {'X-API-Key': api_key} # Add API Key to request headers.
        while True:
            url = f"{API_ENDPOINT}/mediaItems:search" # Google Photo API requires a POST request for this operation
            data = {'albumId': album_id, 'pageSize': PAGE_SIZE, 'pageToken': nextPageToken}

            try:
                response = requests.post(url, headers=headers, json=data)
                response.raise_for_status()  # Check for HTTP errors
                results = response.json()
                items = results.get('mediaItems', [])
                for item in items:
                    photo = {
                        "id": item['id'],
                        "baseUrl": item['baseUrl'],
                        "filename": item.get('filename', 'unknown_file')
                    }
                    photos.append(photo)
                nextPageToken = results.get('nextPageToken')
                if not nextPageToken:
                    break  # No more pages
            except requests.exceptions.RequestException as e:
                logging.error(f"Error fetching photos from album: {e}")
                return []  # Return empty list on error

    return photos


def calculate_file_hash(filename, algorithm=HASH_ALGORITHM):
    """Calculates the hash of a file."""
    hasher = hashlib.new(algorithm)  # Use specified algorithm
    try:
        with open(filename, "rb") as file:
            while True:
                chunk = file.read(4096)
                if not chunk:
                    break
                hasher.update(chunk)
        return hasher.hexdigest()
    except FileNotFoundError:
        logging.error(f"File not found: {filename}")
        return None
    except Exception as e:  # Catch any other potential errors
        logging.error(f"Error calculating hash for {filename}: {e}")
        return None


def download_image(image_url, filename):
    """Downloads an image from a URL and saves it to a file, with progress."""
    try:
        response = requests.get(image_url, stream=True)
        response.raise_for_status()  # Check for HTTP errors

        total_length = response.headers.get('content-length')
        total_length = int(total_length) if total_length is not None else None  # Handle missing content length

        with open(filename, "wb") as outfile:
            downloaded = 0
            start_time = time.time()
            for chunk in response.iter_content(chunk_size=8192):
                outfile.write(chunk)
                downloaded += len(chunk)
                if total_length:
                    percent_done = (downloaded / total_length) * 100
                    elapsed_time = time.time() - start_time
                    if elapsed_time > 0:
                        download_rate = downloaded / elapsed_time  # bytes per second
                        eta = (total_length - downloaded) / download_rate if download_rate > 0 else "N/A"
                        eta_str = f"{int(eta // 60)}m {int(eta % 60)}s" if isinstance(eta, (int, float)) and eta > 0 else "N/A"
                    else:
                        eta_str = "N/A"  # Handle zero elapsed time

                    print(f"\rDownloading: {percent_done:.1f}%  ETA: {eta_str}", end="")  # Carriage return for updating on the same line
                else:
                   print(f"\rDownloading...", end="")  # Indication for unknown size

        print()  # Newline after download completes
        logging.info(f"Downloaded: {filename}")
        return True

    except requests.exceptions.ConnectionError as e:
        logging.error(f"Connection error downloading {image_url}: {e}")
        return False
    except requests.exceptions.HTTPError as e:
        logging.error(f"HTTP error downloading {image_url}: {e}")
        return False
    except requests.exceptions.RequestException as e:
        logging.error(f"Generic error downloading {image_url}: {e}")
        return False
    except Exception as e:  # Catch any other unexpected errors
        logging.error(f"Unexpected error downloading {image_url}: {e}")
        return False


def get_file_extension(url):
    """Extracts the file extension from a URL."""
    parsed_url = urlparse(url)
    path = parsed_url.path
    ext = os.path.splitext(path)[1]
    if ext:
        return ext
    else:
        try:
            response = requests.head(url)
            response.raise_for_status()
            content_type = response.headers.get('Content-Type')
            if content_type:
                if 'image/jpeg' in content_type:
                    return '.jpg'
                elif 'image/png' in content_type:
                    return '.png'
                elif 'image/gif' in content_type:
                    return '.gif'
        except requests.exceptions.RequestException as e:
            logging.warning(f"Could not determine file extension from URL: {e}")
            return '.jpg'
    return '.jpg'


def main():
    """Main function to fetch a random unique picture and download it."""

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    fetched_data = load_fetched_photo_ids()

    # Authenticate with Google Photos API
    try:
        creds = authenticate()
    except Exception as e:
        print(f"Authentication failed: {e}")
        logging.error(f"Authentication failed: {e}")
        return

    photos = get_photos_from_album(ALBUM_ID, API_KEY, creds)

    if not photos:
        logging.warning("No photos found in the album.")
        print("No photos found in the album.")
        return

    available_photos = []
    for photo in photos:
        photo_id = photo['id']
        image_url = photo['baseUrl']
        file_extension = get_file_extension(image_url)
        filename = os.path.join(OUTPUT_DIR, f"photo_{photo_id}{file_extension}")

        if photo_id in fetched_data: # ID exists in the data
            stored_hash = fetched_data[photo_id] # Get previously calculated file hash
            if os.path.exists(filename): # File actually exists
                current_hash = calculate_file_hash(filename) # Calculate current file hash
                if current_hash == stored_hash: # Hash matches - skip
                   logging.info(f"File already downloaded with matching hash. Skipping: {filename}")
                   continue
        available_photos.append(photo)


    if not available_photos:
        logging.info("All photos in the album have already been fetched (or have matching hashes).")
        print("All photos in the album have already been fetched (or have matching hashes).")
        return

    random_photo = random.choice(available_photos)
    photo_id = random_photo['id']
    image_url = random_photo['baseUrl']

    file_extension = get_file_extension(image_url)
    filename = os.path.join(OUTPUT_DIR, f"photo_{photo_id}{file_extension}")

    if download_image(image_url, filename):
        file_hash = calculate_file_hash(filename) # Generate a hash of the downloaded file
        if file_hash:
            save_fetched_photo_id(photo_id, file_hash, fetched_data)
        else:
            logging.warning(f"Could not calculate hash for {filename}.  Skipping hash saving.") # Indicate the hash generation failure
    else:
        logging.error(f"Failed to download photo with ID: {photo_id}")


if __name__ == "__main__":
    main()
