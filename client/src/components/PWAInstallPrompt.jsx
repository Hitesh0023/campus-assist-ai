import { useState, useEffect } from 'react';
import { canInstallPWA, installPWA, getInstallationStatus } from '../utils/pwa';

/**
 * PWA Install Prompt Component
 * Shows install button for mobile users who can install the app
 */
export const PWAInstallPrompt = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const updateInstallPrompt = () => {
      const status = getInstallationStatus();
      setIsInstalled(status.isAppInstalled || status.isStandalone);
      setShowInstallPrompt(status.canInstall);
    };

    updateInstallPrompt();

    // Listen for app install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
    });

    return () => {
      window.removeEventListener('appinstalled', updateInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      setShowInstallPrompt(false);
      setIsInstalled(true);
    }
  };

  if (!showInstallPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      right: '1rem',
      left: '1rem',
      background: 'linear-gradient(135deg, var(--violet) 0%, #7C3AED 100%)',
      borderRadius: '12px',
      padding: '1rem',
      boxShadow: '0 10px 30px rgba(124, 58, 237, 0.3)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      color: '#fff',
      fontWeight: 600,
      fontSize: '0.95rem',
      animation: 'slideUp 0.3s ease-out',
    }}>
      <div style={{ flex: 1 }}>
        📱 Install CampusPro app for offline access!
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', whiteSpace: 'nowrap' }}>
        <button
          onClick={() => setShowInstallPrompt(false)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
            backdropFilter: 'blur(10px)',
          }}
        >
          Dismiss
        </button>
        <button
          onClick={handleInstall}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: '#fff',
            color: 'var(--violet)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          Install
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(120%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default PWAInstallPrompt;
