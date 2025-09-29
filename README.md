# Photo Share PWA

A Progressive Web App for sharing random images from Google Photos albums with commentary to various platforms.

## Features

- 🔐 **Secure Authentication**: OAuth 2.0 integration with Google Photos
- 📱 **PWA Ready**: Installable on mobile devices with offline support
- 🎲 **Random Image Selection**: Get random photos from your Google Photos albums
- 💬 **Commentary System**: Add your thoughts with emoji support
- 📤 **Multi-Platform Sharing**: Share to email, social media, and more
- 🌙 **Dark/Light Theme**: Toggle between themes
- 🔒 **Secure Storage**: Uses Credential Management API for secure token storage

## Setup Instructions

### 1. Google Photos API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Photos Library API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: `https://your-username.github.io`
   - Authorized redirect URIs: `https://your-username.github.io/oauth2callback`
5. Create an API key for the Google Photos Library API

### 2. Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the configuration in `src/config/api-config.js`:
   ```javascript
   this.googlePhotos = {
     clientId: 'YOUR_GOOGLE_CLIENT_ID_HERE',
     apiKey: 'YOUR_GOOGLE_API_KEY_HERE',
     // ... other config
   };
   ```

### 3. Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

### 4. Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

## Project Structure

```
/
├── index.html                 # Main HTML file
├── manifest.json             # PWA manifest
├── sw.js                     # Service worker
├── assets/
│   ├── css/
│   │   └── styles.css        # Main stylesheet
│   └── js/
│       └── app.js            # Main application logic
├── src/
│   ├── auth/
│   │   └── google-auth.js    # Google OAuth implementation
│   ├── photos/
│   │   └── google-photos-api.js # Google Photos API integration
│   └── config/
│       └── api-config.js     # API configuration
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## API Configuration

The app requires the following Google Photos API permissions:
- `https://www.googleapis.com/auth/photoslibrary.readonly`

## Security Features

- **Credential Management API**: Secure storage of OAuth tokens
- **HTTPS Required**: All API calls require HTTPS
- **Token Refresh**: Automatic token refresh when expired
- **Secure Storage**: Tokens stored using browser's secure credential storage

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

## Roadmap

- [x] Phase 1: PWA Foundation
- [x] Phase 2: Google Photos Integration
- [ ] Phase 3: Credential Management
- [ ] Phase 4: Advanced Sharing
- [ ] Phase 5: GitHub Pages Deployment
- [ ] Phase 6: Advanced Features