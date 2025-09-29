// Google Photos API Authentication
class GoogleAuth {
  constructor() {
    this.clientId = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.isInitialized = false;
  }

  // Initialize Google Auth with client ID
  async init(clientId) {
    this.clientId = clientId;
    this.isInitialized = true;
    
    // Load Google API script
    await this.loadGoogleAPI();
    
    // Initialize Google API client
    await this.initializeGoogleAPI();
    
    console.log('Google Auth initialized successfully');
  }

  // Load Google API script dynamically
  loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', () => {
          resolve();
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Initialize Google API client
  async initializeGoogleAPI() {
    try {
      await window.gapi.client.init({
        apiKey: this.clientId, // Using client ID as API key for now
        clientId: this.clientId,
        discoveryDocs: ['https://photoslibrary.googleapis.com/$discovery/rest?version=v1'],
        scope: 'https://www.googleapis.com/auth/photoslibrary.readonly'
      });

      this.authInstance = window.gapi.auth2.getAuthInstance();
      console.log('Google API client initialized');
    } catch (error) {
      console.error('Error initializing Google API client:', error);
      throw error;
    }
  }

  // Check if user is already signed in
  isSignedIn() {
    if (!this.authInstance) return false;
    return this.authInstance.isSignedIn.get();
  }

  // Get current user
  getCurrentUser() {
    if (!this.isSignedIn()) return null;
    return this.authInstance.currentUser.get();
  }

  // Sign in with Google
  async signIn() {
    if (!this.isInitialized) {
      throw new Error('Google Auth not initialized');
    }

    try {
      const authResult = await this.authInstance.signIn();
      const user = authResult.getBasicProfile();
      
      // Get access token
      this.accessToken = authResult.getAuthResponse().access_token;
      this.tokenExpiry = Date.now() + (authResult.getAuthResponse().expires_in * 1000);
      
      // Store tokens securely
      await this.storeTokens({
        accessToken: this.accessToken,
        tokenExpiry: this.tokenExpiry
      });

      console.log('User signed in:', user.getName());
      return {
        user: {
          id: user.getId(),
          name: user.getName(),
          email: user.getEmail(),
          imageUrl: user.getImageUrl()
        },
        accessToken: this.accessToken
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    if (!this.authInstance) return;

    try {
      await this.authInstance.signOut();
      this.accessToken = null;
      this.tokenExpiry = null;
      
      // Clear stored tokens
      await this.clearTokens();
      
      console.log('User signed out');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get valid access token (refresh if needed)
  async getValidAccessToken() {
    if (!this.accessToken) {
      // Try to load from storage
      const storedTokens = await this.loadTokens();
      if (storedTokens) {
        this.accessToken = storedTokens.accessToken;
        this.tokenExpiry = storedTokens.tokenExpiry;
      }
    }

    // Check if token is expired
    if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
      console.log('Access token expired, refreshing...');
      await this.refreshAccessToken();
    }

    return this.accessToken;
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.authInstance) {
      throw new Error('Google Auth not initialized');
    }

    try {
      const user = this.authInstance.currentUser.get();
      const authResult = await user.reloadAuthResponse();
      
      this.accessToken = authResult.access_token;
      this.tokenExpiry = Date.now() + (authResult.expires_in * 1000);
      
      // Update stored tokens
      await this.storeTokens({
        accessToken: this.accessToken,
        tokenExpiry: this.tokenExpiry
      });

      console.log('Access token refreshed');
      return this.accessToken;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      // If refresh fails, user needs to sign in again
      await this.signOut();
      throw error;
    }
  }

  // Store tokens securely using Credential Management API
  async storeTokens(tokens) {
    try {
      if ('credentials' in navigator) {
        const credential = new PasswordCredential({
          id: 'google-photos-tokens',
          password: JSON.stringify(tokens),
          name: 'Google Photos Tokens'
        });
        
        await navigator.credentials.store(credential);
        console.log('Tokens stored securely');
      } else {
        // Fallback to localStorage
        localStorage.setItem('google-photos-tokens', JSON.stringify(tokens));
        console.log('Tokens stored in localStorage (fallback)');
      }
    } catch (error) {
      console.error('Error storing tokens:', error);
      // Fallback to localStorage
      localStorage.setItem('google-photos-tokens', JSON.stringify(tokens));
    }
  }

  // Load tokens from secure storage
  async loadTokens() {
    try {
      if ('credentials' in navigator) {
        const credential = await navigator.credentials.get({
          password: true,
          id: 'google-photos-tokens'
        });
        
        if (credential) {
          return JSON.parse(credential.password);
        }
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('google-photos-tokens');
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('google-photos-tokens');
      return stored ? JSON.parse(stored) : null;
    }
    
    return null;
  }

  // Clear stored tokens
  async clearTokens() {
    try {
      if ('credentials' in navigator) {
        // Note: There's no direct way to delete specific credentials
        // The user would need to clear them through browser settings
        console.log('Please clear credentials through browser settings');
      }
      
      // Clear localStorage fallback
      localStorage.removeItem('google-photos-tokens');
      console.log('Tokens cleared');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Get authorization header for API requests
  async getAuthHeader() {
    const token = await this.getValidAccessToken();
    return token ? `Bearer ${token}` : null;
  }
}

// Export for use in other modules
window.GoogleAuth = GoogleAuth;