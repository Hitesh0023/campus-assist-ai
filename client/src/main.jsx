import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initializePWA } from './utils/pwa.js'

// Initialize PWA (service worker, install prompt, etc.)
if ('serviceWorker' in navigator) {
  initializePWA().catch(err => console.error('PWA initialization failed:', err));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
