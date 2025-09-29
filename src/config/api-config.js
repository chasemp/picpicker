// API Configuration for Google Photos PWA
class APIConfig {
  constructor() {
    // Google Photos API Configuration
    this.googlePhotos = {
      // These values should be set in your environment or through a config file
      clientId: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE',
      apiKey: process.env.GOOGLE_API_KEY || 'YOUR_GOOGLE_API_KEY_HERE',
      discoveryUrl: 'https://photoslibrary.googleapis.com/$discovery/rest?version=v1',
      scopes: [
        'https://www.googleapis.com/auth/photoslibrary.readonly'
      ]
    };

    // API Endpoints
    this.endpoints = {
      googlePhotos: 'https://photoslibrary.googleapis.com/v1',
      oauth: 'https://accounts.google.com/o/oauth2/v2/auth',
      token: 'https://oauth2.googleapis.com/token'
    };

    // App Configuration
    this.app = {
      name: 'Photo Share PWA',
      version: '1.0.0',
      redirectUri: window.location.origin + '/oauth2callback',
      maxImageSize: 2048,
      thumbnailSize: 200,
      maxAlbumsPerPage: 50,
      maxMediaPerPage: 100
    };

    // Error Messages
    this.errorMessages = {
      notAuthenticated: 'Please sign in to access your Google Photos',
      noAlbums: 'No albums found in your Google Photos',
      noMedia: 'No photos found in the selected album',
      apiError: 'Error connecting to Google Photos API',
      networkError: 'Network error. Please check your connection',
      tokenExpired: 'Your session has expired. Please sign in again',
      permissionDenied: 'Permission denied. Please check your Google Photos access',
      quotaExceeded: 'API quota exceeded. Please try again later'
    };

    // Success Messages
    this.successMessages = {
      signedIn: 'Successfully signed in to Google Photos',
      signedOut: 'Successfully signed out',
      albumLoaded: 'Albums loaded successfully',
      imageLoaded: 'Image loaded successfully',
      shared: 'Content shared successfully'
    };
  }

  // Get Google Photos client configuration
  getGooglePhotosConfig() {
    return {
      clientId: this.googlePhotos.clientId,
      apiKey: this.googlePhotos.apiKey,
      discoveryUrl: this.googlePhotos.discoveryUrl,
      scopes: this.googlePhotos.scopes
    };
  }

  // Get OAuth configuration
  getOAuthConfig() {
    return {
      clientId: this.googlePhotos.clientId,
      redirectUri: this.app.redirectUri,
      scopes: this.googlePhotos.scopes.join(' '),
      responseType: 'code',
      accessType: 'offline',
      prompt: 'consent'
    };
  }

  // Validate configuration
  validateConfig() {
    const errors = [];

    if (!this.googlePhotos.clientId || this.googlePhotos.clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      errors.push('Google Client ID is not configured');
    }

    if (!this.googlePhotos.apiKey || this.googlePhotos.apiKey === 'YOUR_GOOGLE_API_KEY_HERE') {
      errors.push('Google API Key is not configured');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Get error message by key
  getErrorMessage(key) {
    return this.errorMessages[key] || 'An unknown error occurred';
  }

  // Get success message by key
  getSuccessMessage(key) {
    return this.successMessages[key] || 'Operation completed successfully';
  }

  // Get app configuration
  getAppConfig() {
    return this.app;
  }

  // Update configuration (for runtime updates)
  updateConfig(newConfig) {
    if (newConfig.googlePhotos) {
      this.googlePhotos = { ...this.googlePhotos, ...newConfig.googlePhotos };
    }
    if (newConfig.app) {
      this.app = { ...this.app, ...newConfig.app };
    }
  }
}

// Create global instance
window.APIConfig = new APIConfig();

// Export for use in other modules
window.APIConfig = APIConfig;