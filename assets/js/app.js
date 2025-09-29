// Photo Share PWA - Main Application
class PhotoShareApp {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.isAuthenticated = false;
    this.currentAlbum = null;
    this.currentImage = null;
    this.commentary = '';
    this.googleAuth = null;
    this.googlePhotosAPI = null;
    this.albums = [];
    
    this.init();
  }

  async init() {
    console.log('Photo Share PWA: Initializing...');
    
    // Set up theme
    this.setTheme(this.currentTheme);
    
    // Register service worker
    await this.registerServiceWorker();
    
    // Initialize Google Photos API
    await this.initializeGooglePhotos();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Check authentication status
    await this.checkAuthStatus();
    
    console.log('Photo Share PWA: Initialized successfully');
  }

  // Service Worker Registration
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, prompt user to refresh
              this.showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Event Listeners Setup
  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Authentication
    const authButton = document.getElementById('auth-button');
    if (authButton) {
      authButton.addEventListener('click', () => this.handleAuth());
    }

    // Album selection
    const albumList = document.getElementById('album-list');
    if (albumList) {
      albumList.addEventListener('click', (e) => this.handleAlbumClick(e));
    }

    // New random image
    const newImageBtn = document.getElementById('new-image-btn');
    if (newImageBtn) {
      newImageBtn.addEventListener('click', () => this.getRandomImage());
    }

    // Commentary input
    const commentaryInput = document.getElementById('commentary-input');
    if (commentaryInput) {
      commentaryInput.addEventListener('input', (e) => this.handleCommentaryChange(e));
    }

    // Sharing buttons
    const shareNative = document.getElementById('share-native');
    if (shareNative) {
      shareNative.addEventListener('click', () => this.shareNative());
    }

    const shareEmail = document.getElementById('share-email');
    if (shareEmail) {
      shareEmail.addEventListener('click', () => this.shareEmail());
    }

    const shareBluesky = document.getElementById('share-bluessky');
    if (shareBluesky) {
      shareBluesky.addEventListener('click', () => this.shareBluesky());
    }

    const copyLink = document.getElementById('copy-link');
    if (copyLink) {
      copyLink.addEventListener('click', () => this.copyLink());
    }

    // Emoji picker
    const emojiPicker = document.getElementById('emoji-picker');
    if (emojiPicker) {
      emojiPicker.addEventListener('click', () => this.showEmojiPicker());
    }

    // Sign out button
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => this.handleSignOut());
    }
  }

  // Theme Management
  setTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  // Initialize Google Photos API
  async initializeGooglePhotos() {
    try {
      // Initialize Google Auth
      this.googleAuth = new GoogleAuth();
      
      // Get configuration
      const config = window.APIConfig.getGooglePhotosConfig();
      
      // Validate configuration
      const validation = window.APIConfig.validateConfig();
      if (!validation.isValid) {
        console.error('API Configuration errors:', validation.errors);
        this.showError('API configuration is incomplete. Please check your Google Photos API setup.');
        return;
      }
      
      // Initialize with client ID
      await this.googleAuth.init(config.clientId);
      
      // Initialize Google Photos API
      this.googlePhotosAPI = new GooglePhotosAPI(this.googleAuth);
      
      console.log('Google Photos API initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Photos API:', error);
      this.showError('Failed to initialize Google Photos API. Please check your configuration.');
    }
  }

  // Authentication
  async checkAuthStatus() {
    console.log('Checking authentication status...');
    
    if (!this.googleAuth) {
      this.showSection('auth-section');
      return;
    }
    
    try {
      if (this.googleAuth.isSignedIn()) {
        this.isAuthenticated = true;
        this.showSignOutButton(true);
        this.showSection('album-section');
        await this.loadAlbums();
      } else {
        this.showSignOutButton(false);
        this.showSection('auth-section');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.showSection('auth-section');
    }
  }

  async handleAuth() {
    console.log('Handling authentication...');
    this.showLoading(true);
    
    try {
      if (!this.googleAuth) {
        throw new Error('Google Auth not initialized');
      }
      
      const authResult = await this.googleAuth.signIn();
      this.isAuthenticated = true;
      
      this.showLoading(false);
      this.showSignOutButton(true);
      this.showSection('album-section');
      await this.loadAlbums();
      
      this.showNotification(window.APIConfig.getSuccessMessage('signedIn'));
    } catch (error) {
      console.error('Authentication error:', error);
      this.showLoading(false);
      this.showError(window.APIConfig.getErrorMessage('notAuthenticated'));
    }
  }

  async handleSignOut() {
    try {
      if (this.googleAuth) {
        await this.googleAuth.signOut();
      }
      
      this.isAuthenticated = false;
      this.currentAlbum = null;
      this.currentImage = null;
      this.albums = [];
      
      this.showSignOutButton(false);
      this.showSection('auth-section');
      this.showNotification(window.APIConfig.getSuccessMessage('signedOut'));
    } catch (error) {
      console.error('Sign out error:', error);
      this.showError('Error signing out');
    }
  }

  // Album Management
  async loadAlbums() {
    console.log('Loading albums...');
    this.showLoading(true);
    
    try {
      if (!this.googlePhotosAPI) {
        throw new Error('Google Photos API not initialized');
      }
      
      const response = await this.googlePhotosAPI.getAlbums();
      this.albums = response.albums;
      
      if (this.albums.length === 0) {
        this.showError(window.APIConfig.getErrorMessage('noAlbums'));
        return;
      }
      
      this.renderAlbums(this.albums);
      this.showNotification(window.APIConfig.getSuccessMessage('albumLoaded'));
    } catch (error) {
      console.error('Error loading albums:', error);
      this.showError(window.APIConfig.getErrorMessage('apiError'));
    } finally {
      this.showLoading(false);
    }
  }

  renderAlbums(albums) {
    const albumList = document.getElementById('album-list');
    if (!albumList) return;
    
    albumList.innerHTML = albums.map(album => {
      const thumbnailUrl = album.coverPhotoBaseUrl ? 
        `${album.coverPhotoBaseUrl}=w200-h200-c` : 
        'https://via.placeholder.com/200x120/cccccc/666666?text=No+Image';
      
      return `
        <div class="album-item" data-album-id="${album.id}">
          <img src="${thumbnailUrl}" alt="${album.title}" class="album-thumbnail">
          <div class="album-title">${album.title}</div>
          <div class="album-count">${album.mediaItemsCount || 0} photos</div>
        </div>
      `;
    }).join('');
  }

  handleAlbumClick(event) {
    const albumItem = event.target.closest('.album-item');
    if (!albumItem) return;
    
    const albumId = albumItem.dataset.albumId;
    const albumTitle = albumItem.querySelector('.album-title').textContent;
    
    // Remove previous selection
    document.querySelectorAll('.album-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Select current album
    albumItem.classList.add('selected');
    
    this.currentAlbum = { id: albumId, title: albumTitle };
    this.showSection('image-section');
    this.getRandomImage();
  }

  // Image Management
  async getRandomImage() {
    if (!this.currentAlbum) return;
    
    console.log('Getting random image from album:', this.currentAlbum.title);
    this.showLoading(true);
    
    try {
      if (!this.googlePhotosAPI) {
        throw new Error('Google Photos API not initialized');
      }
      
      const mediaItem = await this.googlePhotosAPI.getRandomMediaFromAlbum(this.currentAlbum.id);
      
      if (!mediaItem) {
        throw new Error('No media found in album');
      }
      
      // Get optimized image URL
      const imageUrl = this.googlePhotosAPI.getImageUrl(mediaItem, 800, 600);
      
      if (!imageUrl) {
        throw new Error('Could not generate image URL');
      }
      
      this.currentImage = {
        url: imageUrl,
        fullUrl: this.googlePhotosAPI.getFullResolutionUrl(mediaItem),
        metadata: this.googlePhotosAPI.getMediaMetadata(mediaItem)
      };
      
      this.displayImage(imageUrl);
      this.showLoading(false);
      this.showSection('commentary-section');
      this.showSection('sharing-section');
      
      this.showNotification(window.APIConfig.getSuccessMessage('imageLoaded'));
    } catch (error) {
      console.error('Error getting random image:', error);
      this.showLoading(false);
      this.showError(window.APIConfig.getErrorMessage('noMedia'));
    }
  }

  displayImage(imageUrl) {
    const imageElement = document.getElementById('random-image');
    if (imageElement) {
      imageElement.src = imageUrl;
      imageElement.alt = `Random image from ${this.currentAlbum?.title || 'selected album'}`;
    }
  }

  // Commentary Management
  handleCommentaryChange(event) {
    this.commentary = event.target.value;
    this.updateCharCount();
  }

  updateCharCount() {
    const charCount = document.getElementById('char-count');
    if (charCount) {
      charCount.textContent = `${this.commentary.length}/280`;
    }
  }

  showEmojiPicker() {
    // Simple emoji picker implementation
    const emojis = ['😊', '😍', '🤩', '😎', '🥳', '🎉', '❤️', '👍', '🔥', '✨'];
    const emojiContainer = document.createElement('div');
    emojiContainer.className = 'emoji-picker-container';
    emojiContainer.innerHTML = emojis.map(emoji => 
      `<button class="emoji-btn" data-emoji="${emoji}">${emoji}</button>`
    ).join('');
    
    // Position the picker
    const emojiButton = document.getElementById('emoji-picker');
    emojiButton.parentNode.appendChild(emojiContainer);
    
    // Handle emoji selection
    emojiContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('emoji-btn')) {
        const emoji = e.target.dataset.emoji;
        this.addEmojiToCommentary(emoji);
        emojiContainer.remove();
      }
    });
    
    // Close picker when clicking outside
    setTimeout(() => {
      document.addEventListener('click', () => {
        emojiContainer.remove();
      }, { once: true });
    }, 100);
  }

  addEmojiToCommentary(emoji) {
    const commentaryInput = document.getElementById('commentary-input');
    if (commentaryInput) {
      const cursorPos = commentaryInput.selectionStart;
      const textBefore = commentaryInput.value.substring(0, cursorPos);
      const textAfter = commentaryInput.value.substring(commentaryInput.selectionEnd);
      
      commentaryInput.value = textBefore + emoji + textAfter;
      this.commentary = commentaryInput.value;
      this.updateCharCount();
      
      // Set cursor position after emoji
      commentaryInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
      commentaryInput.focus();
    }
  }

  // UI Helper Functions
  showSignOutButton(show) {
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
      if (show) {
        signOutBtn.classList.remove('hidden');
      } else {
        signOutBtn.classList.add('hidden');
      }
    }
  }

  // Sharing Functions
  async shareNative() {
    if (!this.currentImage) return;
    
    const shareData = {
      title: 'Check out this photo!',
      text: this.commentary || 'A random image from my Google Photos album',
      url: this.currentImage.url || window.location.href
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log('Content shared successfully');
        this.showNotification(window.APIConfig.getSuccessMessage('shared'));
      } catch (error) {
        console.error('Error sharing:', error);
        this.fallbackShare();
      }
    } else {
      this.fallbackShare();
    }
  }

  shareEmail() {
    const subject = 'Check out this photo!';
    const body = `${this.commentary || 'A random image from my Google Photos album'}\n\nView the image: ${this.currentImage.url || this.currentImage}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoUrl);
  }

  shareBluesky() {
    // This will be implemented in Phase 4
    console.log('Sharing to Bluesky...');
    alert('Bluesky sharing will be implemented in Phase 4');
  }

  async copyLink() {
    const linkText = `${this.commentary || 'Check out this random photo!'}\n\n${this.currentImage.url || this.currentImage}`;
    
    try {
      await navigator.clipboard.writeText(linkText);
      console.log('Link copied to clipboard');
      this.showNotification('Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.fallbackCopy(linkText);
    }
  }

  fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    this.showNotification('Link copied to clipboard!');
  }

  fallbackShare() {
    // Fallback sharing method
    this.copyLink();
  }

  // UI Helper Functions
  showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
      section.classList.add('hidden');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }
  }

  showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
      if (show) {
        loading.classList.remove('hidden');
      } else {
        loading.classList.add('hidden');
      }
    }
  }

  showNotification(message) {
    // Simple notification implementation
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--primary-color);
      color: white;
      padding: 1rem;
      border-radius: 8px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  showUpdateNotification() {
    const updateNotification = document.createElement('div');
    updateNotification.className = 'update-notification';
    updateNotification.innerHTML = `
      <div style="background: var(--primary-color); color: white; padding: 1rem; border-radius: 8px; margin: 1rem; text-align: center;">
        <p>New version available!</p>
        <button onclick="window.location.reload()" style="background: white; color: var(--primary-color); border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-top: 0.5rem; cursor: pointer;">
          Update Now
        </button>
      </div>
    `;
    
    document.body.appendChild(updateNotification);
  }

  showError(message) {
    // Simple error notification implementation
    const errorNotification = document.createElement('div');
    errorNotification.className = 'error-notification';
    errorNotification.textContent = message;
    errorNotification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 1rem;
      border-radius: 8px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      max-width: 300px;
    `;
    
    document.body.appendChild(errorNotification);
    
    setTimeout(() => {
      errorNotification.remove();
    }, 5000);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PhotoShareApp();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .emoji-picker-container {
    position: absolute;
    background: var(--surface-color);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    padding: 0.5rem;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.25rem;
    z-index: 1000;
    box-shadow: var(--shadow-hover);
  }
  
  .emoji-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }
  
  .emoji-btn:hover {
    background-color: var(--primary-color);
  }
`;
document.head.appendChild(style);