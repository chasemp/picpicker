// Photo Share PWA - Main Application
class PhotoShareApp {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.isAuthenticated = false;
    this.currentAlbum = null;
    this.currentImage = null;
    this.commentary = '';
    
    this.init();
  }

  async init() {
    console.log('Photo Share PWA: Initializing...');
    
    // Set up theme
    this.setTheme(this.currentTheme);
    
    // Register service worker
    await this.registerServiceWorker();
    
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

  // Authentication (Placeholder for Phase 2)
  async checkAuthStatus() {
    // This will be implemented in Phase 2
    console.log('Checking authentication status...');
    // For now, show the auth section
    this.showSection('auth-section');
  }

  async handleAuth() {
    // This will be implemented in Phase 2
    console.log('Handling authentication...');
    this.showLoading(true);
    
    // Simulate authentication process
    setTimeout(() => {
      this.isAuthenticated = true;
      this.showLoading(false);
      this.showSection('album-section');
      this.loadAlbums();
    }, 2000);
  }

  // Album Management (Placeholder for Phase 2)
  async loadAlbums() {
    // This will be implemented in Phase 2
    console.log('Loading albums...');
    
    // Mock data for demonstration
    const mockAlbums = [
      { id: '1', title: 'Vacation 2024', count: 45, thumbnail: 'https://via.placeholder.com/200x120/1976d2/ffffff?text=Vacation' },
      { id: '2', title: 'Family Photos', count: 123, thumbnail: 'https://via.placeholder.com/200x120/4caf50/ffffff?text=Family' },
      { id: '3', title: 'Nature', count: 67, thumbnail: 'https://via.placeholder.com/200x120/ff9800/ffffff?text=Nature' },
      { id: '4', title: 'Food', count: 89, thumbnail: 'https://via.placeholder.com/200x120/e91e63/ffffff?text=Food' }
    ];
    
    this.renderAlbums(mockAlbums);
  }

  renderAlbums(albums) {
    const albumList = document.getElementById('album-list');
    if (!albumList) return;
    
    albumList.innerHTML = albums.map(album => `
      <div class="album-item" data-album-id="${album.id}">
        <img src="${album.thumbnail}" alt="${album.title}" class="album-thumbnail">
        <div class="album-title">${album.title}</div>
        <div class="album-count">${album.count} photos</div>
      </div>
    `).join('');
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

  // Image Management (Placeholder for Phase 2)
  async getRandomImage() {
    if (!this.currentAlbum) return;
    
    console.log('Getting random image from album:', this.currentAlbum.title);
    this.showLoading(true);
    
    // Mock random image
    const mockImages = [
      'https://picsum.photos/800/600?random=1',
      'https://picsum.photos/800/600?random=2',
      'https://picsum.photos/800/600?random=3',
      'https://picsum.photos/800/600?random=4',
      'https://picsum.photos/800/600?random=5'
    ];
    
    const randomImageUrl = mockImages[Math.floor(Math.random() * mockImages.length)];
    
    setTimeout(() => {
      this.currentImage = randomImageUrl;
      this.displayImage(randomImageUrl);
      this.showLoading(false);
      this.showSection('commentary-section');
      this.showSection('sharing-section');
    }, 1000);
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

  // Sharing Functions
  async shareNative() {
    if (!this.currentImage) return;
    
    const shareData = {
      title: 'Check out this photo!',
      text: this.commentary || 'A random image from my Google Photos album',
      url: window.location.href
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log('Content shared successfully');
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
    const body = `${this.commentary || 'A random image from my Google Photos album'}\n\nView the image: ${this.currentImage}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoUrl);
  }

  shareBluesky() {
    // This will be implemented in Phase 4
    console.log('Sharing to Bluesky...');
    alert('Bluesky sharing will be implemented in Phase 4');
  }

  async copyLink() {
    const linkText = `${this.commentary || 'Check out this random photo!'}\n\n${this.currentImage}`;
    
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