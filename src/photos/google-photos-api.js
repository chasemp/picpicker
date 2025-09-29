// Google Photos API Integration
class GooglePhotosAPI {
  constructor(googleAuth) {
    this.auth = googleAuth;
    this.baseUrl = 'https://photoslibrary.googleapis.com/v1';
  }

  // Make authenticated API request
  async makeRequest(endpoint, options = {}) {
    const authHeader = await this.auth.getAuthHeader();
    if (!authHeader) {
      throw new Error('Not authenticated');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          await this.auth.refreshAccessToken();
          // Retry with new token
          requestOptions.headers.Authorization = await this.auth.getAuthHeader();
          const retryResponse = await fetch(url, requestOptions);
          if (!retryResponse.ok) {
            throw new Error(`API request failed: ${retryResponse.status} ${retryResponse.statusText}`);
          }
          return await retryResponse.json();
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Google Photos API request failed:', error);
      throw error;
    }
  }

  // Get user's albums
  async getAlbums(pageSize = 50, pageToken = null) {
    try {
      const params = new URLSearchParams({
        pageSize: pageSize.toString()
      });
      
      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const response = await this.makeRequest(`/albums?${params}`);
      
      return {
        albums: response.albums || [],
        nextPageToken: response.nextPageToken || null
      };
    } catch (error) {
      console.error('Error fetching albums:', error);
      throw error;
    }
  }

  // Get media items from an album
  async getAlbumMedia(albumId, pageSize = 100, pageToken = null) {
    try {
      const requestBody = {
        albumId: albumId,
        pageSize: pageSize
      };

      if (pageToken) {
        requestBody.pageToken = pageToken;
      }

      const response = await this.makeRequest('/mediaItems:search', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      return {
        mediaItems: response.mediaItems || [],
        nextPageToken: response.nextPageToken || null
      };
    } catch (error) {
      console.error('Error fetching album media:', error);
      throw error;
    }
  }

  // Get all media items (not album-specific)
  async getAllMedia(pageSize = 100, pageToken = null) {
    try {
      const requestBody = {
        pageSize: pageSize
      };

      if (pageToken) {
        requestBody.pageToken = pageToken;
      }

      const response = await this.makeRequest('/mediaItems:search', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      return {
        mediaItems: response.mediaItems || [],
        nextPageToken: response.nextPageToken || null
      };
    } catch (error) {
      console.error('Error fetching all media:', error);
      throw error;
    }
  }

  // Get a specific media item
  async getMediaItem(mediaItemId) {
    try {
      const response = await this.makeRequest(`/mediaItems/${mediaItemId}`);
      return response;
    } catch (error) {
      console.error('Error fetching media item:', error);
      throw error;
    }
  }

  // Get random media item from an album
  async getRandomMediaFromAlbum(albumId) {
    try {
      // First, get the total count of items in the album
      const firstPage = await this.getAlbumMedia(albumId, 1);
      const totalItems = firstPage.mediaItems.length;
      
      if (totalItems === 0) {
        throw new Error('Album is empty');
      }

      // If we only have one page, return a random item from it
      if (!firstPage.nextPageToken) {
        const randomIndex = Math.floor(Math.random() * totalItems);
        return firstPage.mediaItems[randomIndex];
      }

      // For albums with multiple pages, we need to get a random page
      // This is a simplified approach - in production, you might want to
      // implement a more sophisticated random selection algorithm
      const randomPage = Math.floor(Math.random() * Math.ceil(totalItems / 100)) + 1;
      const randomPageToken = await this.getPageToken(albumId, randomPage);
      
      const randomPageData = await this.getAlbumMedia(albumId, 100, randomPageToken);
      const randomIndex = Math.floor(Math.random() * randomPageData.mediaItems.length);
      
      return randomPageData.mediaItems[randomIndex];
    } catch (error) {
      console.error('Error getting random media from album:', error);
      throw error;
    }
  }

  // Helper method to get page token for a specific page number
  async getPageToken(albumId, pageNumber) {
    let currentPage = 1;
    let pageToken = null;
    
    while (currentPage < pageNumber) {
      const response = await this.getAlbumMedia(albumId, 100, pageToken);
      pageToken = response.nextPageToken;
      currentPage++;
      
      if (!pageToken) {
        break;
      }
    }
    
    return pageToken;
  }

  // Get random media item from all photos
  async getRandomMedia() {
    try {
      // Get a random page of media items
      const response = await this.getAllMedia(100);
      const mediaItems = response.mediaItems;
      
      if (mediaItems.length === 0) {
        throw new Error('No media items found');
      }

      const randomIndex = Math.floor(Math.random() * mediaItems.length);
      return mediaItems[randomIndex];
    } catch (error) {
      console.error('Error getting random media:', error);
      throw error;
    }
  }

  // Get optimized image URL for display
  getImageUrl(mediaItem, maxWidth = 800, maxHeight = 600) {
    if (!mediaItem || !mediaItem.baseUrl) {
      return null;
    }

    // Google Photos API provides baseUrl that can be modified with parameters
    const params = new URLSearchParams({
      w: maxWidth.toString(),
      h: maxHeight.toString()
    });

    return `${mediaItem.baseUrl}=w${maxWidth}-h${maxHeight}`;
  }

  // Get thumbnail URL
  getThumbnailUrl(mediaItem, size = 200) {
    if (!mediaItem || !mediaItem.baseUrl) {
      return null;
    }

    return `${mediaItem.baseUrl}=w${size}-h${size}-c`;
  }

  // Get full resolution image URL
  getFullResolutionUrl(mediaItem) {
    if (!mediaItem || !mediaItem.baseUrl) {
      return null;
    }

    return mediaItem.baseUrl;
  }

  // Check if media item is a photo (not video)
  isPhoto(mediaItem) {
    return mediaItem && mediaItem.mimeType && mediaItem.mimeType.startsWith('image/');
  }

  // Check if media item is a video
  isVideo(mediaItem) {
    return mediaItem && mediaItem.mimeType && mediaItem.mimeType.startsWith('video/');
  }

  // Get media item metadata
  getMediaMetadata(mediaItem) {
    if (!mediaItem) return null;

    return {
      id: mediaItem.id,
      filename: mediaItem.filename,
      mimeType: mediaItem.mimeType,
      creationTime: mediaItem.mediaMetadata?.creationTime,
      width: mediaItem.mediaMetadata?.width,
      height: mediaItem.mediaMetadata?.height,
      camera: mediaItem.mediaMetadata?.photo?.cameraMake,
      lens: mediaItem.mediaMetadata?.photo?.cameraModel,
      isPhoto: this.isPhoto(mediaItem),
      isVideo: this.isVideo(mediaItem)
    };
  }
}

// Export for use in other modules
window.GooglePhotosAPI = GooglePhotosAPI;