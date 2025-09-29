# Photo Share PWA

A Progressive Web App (PWA) for sharing random images from Google Photos albums with commentary to various platforms.

## Features

### Phase 1: PWA Foundation ✅
- **Progressive Web App**: Installable on mobile and desktop devices
- **Offline Support**: Works offline with cached content
- **Responsive Design**: Mobile-first approach with touch-friendly interface
- **Theme Support**: Light and dark theme toggle
- **Service Worker**: Advanced caching for static assets and API responses
- **Modern UI**: Clean, accessible interface with smooth animations

### Phase 2: Google Photos Integration (Planned)
- OAuth 2.0 authentication with Google Photos
- Album browsing and selection
- Random image fetching from selected albums
- Secure token storage

### Phase 3: Credential Management (Planned)
- Secure credential storage using browser APIs
- Biometric authentication support
- Session management

### Phase 4: Sharing System (Planned)
- Web Share API integration
- Email sharing
- Bluesky integration
- Copy to clipboard functionality
- Commentary system with emoji support

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd photo-share-pwa
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to GitHub Pages.

## Project Structure

```
/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                  # Service worker
├── offline.html           # Offline fallback page
├── assets/
│   ├── icons/             # PWA icons (SVG)
│   ├── css/
│   │   └── styles.css     # Main stylesheet
│   └── js/
│       └── app.js         # Main application logic
├── src/                   # Source modules (for future phases)
│   ├── auth/              # Authentication logic
│   ├── photos/            # Google Photos integration
│   ├── sharing/           # Sharing functionality
│   ├── storage/           # Local storage management
│   └── utils/             # Utility functions
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions deployment
└── package.json           # Dependencies and scripts
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy` - Deploy to GitHub Pages

### PWA Features

The app includes all essential PWA features:

- **Web App Manifest**: Defines app metadata, icons, and display properties
- **Service Worker**: Handles caching, offline functionality, and background sync
- **Responsive Design**: Works on all device sizes
- **Theme Support**: Light and dark mode with system preference detection
- **Accessibility**: Keyboard navigation and screen reader support

## Deployment

### GitHub Pages

The app is configured for automatic deployment to GitHub Pages:

1. Push to the `main` branch
2. GitHub Actions will automatically build and deploy the app
3. The app will be available at `https://<username>.github.io/photo-share-pwa/`

### Manual Deployment

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Ensure your server serves `index.html` for all routes (SPA routing)

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

## Roadmap

- [x] Phase 1: PWA Foundation
- [ ] Phase 2: Google Photos Integration
- [ ] Phase 3: Credential Management
- [ ] Phase 4: Sharing System
- [ ] Phase 5: GitHub Pages Deployment
- [ ] Phase 6: Advanced Features

## Support

For issues and questions, please open an issue on GitHub.