/**
 * PWA Installation and Service Worker Management
 * Handles PWA registration, updates, and installation prompts
 */

let deferredPrompt = null;
let isAppInstalled = false;

/**
 * Detects if app is running as standalone PWA
 */
export const isStandalone = () => {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    document.referrer.includes('android-app://');
};

/**
 * Initialize PWA - register service worker and handle install prompts
 */
export const initializePWA = async () => {
  // Check if running as standalone
  if (isStandalone()) {
    isAppInstalled = true;
    console.log('✅ App running as PWA/installed app');
  }

  // Register service worker
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('✅ Service Worker registered:', registration);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute

      // Listen for controller change (new service worker activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      // Handle update available
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            // New service worker ready
            showUpdateNotification();
          }
        });
      });

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }

  // Handle install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📱 Install prompt available');
  });

  // Handle app installed
  window.addEventListener('appinstalled', () => {
    isAppInstalled = true;
    deferredPrompt = null;
    console.log('✅ App installed successfully');
  });
};

/**
 * Check if PWA can be installed
 */
export const canInstallPWA = () => {
  return deferredPrompt !== null && !isAppInstalled;
};

/**
 * Trigger PWA installation prompt
 */
export const installPWA = async () => {
  if (!deferredPrompt) {
    console.warn('⚠️ Install prompt not available');
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted installation');
      deferredPrompt = null;
      isAppInstalled = true;
      return true;
    } else {
      console.log('❌ User declined installation');
      return false;
    }
  } catch (error) {
    console.error('❌ Installation prompt failed:', error);
    return false;
  }
};

/**
 * Get installation status
 */
export const getInstallationStatus = () => {
  return {
    isAppInstalled,
    canInstall: canInstallPWA(),
    isStandalone: isStandalone(),
  };
};

/**
 * Show update notification
 */
const showUpdateNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('CampusPro Update', {
      body: 'A new version is available. Refresh to update.',
      icon: '/icons/pwa-192x192.png',
      badge: '/icons/pwa-64x64.png',
      tag: 'update-notification',
    });
  }
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('⚠️ Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Send notification
 */
export const sendNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/icons/pwa-192x192.png',
      badge: '/icons/pwa-64x64.png',
      ...options,
    });
  }
};

/**
 * Check if online
 */
export const isOnline = () => navigator.onLine;

/**
 * Listen to connectivity changes
 */
export const onConnectivityChange = (callback) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Clear all caches
 */
export const clearAllCaches = async () => {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(name => caches.delete(name))
  );
  console.log('✅ All caches cleared');
};

/**
 * Get cache storage info
 */
export const getCacheStorageInfo = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percent: ((estimate.usage / estimate.quota) * 100).toFixed(2),
      };
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return null;
    }
  }
  return null;
};

export default {
  initializePWA,
  installPWA,
  canInstallPWA,
  getInstallationStatus,
  isStandalone,
  requestNotificationPermission,
  sendNotification,
  isOnline,
  onConnectivityChange,
  clearAllCaches,
  getCacheStorageInfo,
};
