import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstall: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [browserType, setBrowserType] = useState<'chrome' | 'safari' | 'firefox' | 'edge' | 'other'>('other');

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      setShowInstallButton(false);
      localStorage.setItem('pwa-user-interaction', 'installed');
      return;
    }

    // Check if user has already dismissed or installed (local storage)
    const hasUserInteracted = localStorage.getItem('pwa-user-interaction');
    if (hasUserInteracted === 'installed' || hasUserInteracted === 'dismissed') {
      setShowInstallButton(false);
      return;
    }

    // Detect browser type
    detectBrowser();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
      localStorage.setItem('pwa-user-interaction', 'installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show popup immediately if criteria are met (no delay)
    checkPWACriteria();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const detectBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      setBrowserType('chrome');
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      setBrowserType('safari');
    } else if (userAgent.includes('firefox')) {
      setBrowserType('firefox');
    } else if (userAgent.includes('edg')) {
      setBrowserType('edge');
    } else {
      setBrowserType('other');
    }
  };

  const checkPWACriteria = () => {
    const criteria = {
      hasManifest: !!document.querySelector('link[rel="manifest"]'),
      hasServiceWorker: 'serviceWorker' in navigator,
      isHTTPS: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      hasIcons: !!document.querySelector('link[rel="icon"]'),
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
    // If all criteria are met, show install button
    if (Object.values(criteria).every(Boolean)) {
      setShowInstallButton(true);
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-user-interaction', 'installed');
      } else {
        localStorage.setItem('pwa-user-interaction', 'dismissed');
      }
      setDeferredPrompt(null);
      setShowInstallButton(false);
    } else {
      // No deferred prompt, show manual install
      handleManualInstall();
    }
  };

  const handleManualInstall = () => {
    let instructions = '';
    switch (browserType) {
      case 'chrome':
        if (/Android/i.test(navigator.userAgent)) {
          instructions = `To install this app on Android:\n1. Tap the menu (⋮) in Chrome\n2. Select "Install app" or "Add to Home screen"\n3. Tap "Install"`;
        } else {
          instructions = `To install this app on Desktop Chrome:\n1. Click the install icon (⬇️) in the address bar\n2. Or click the menu (⋮) → "Install Shelf Labels"`;
        }
        break;
      case 'safari':
        instructions = `To install this app on iOS:\n1. Tap the Share button (□↗)\n2. Scroll down and select "Add to Home Screen"\n3. Tap "Add"`;
        break;
      case 'firefox':
        instructions = `To install this app on Firefox:\n1. Click the menu (☰) in Firefox\n2. Select "Install App"\n3. Click "Install"`;
        break;
      case 'edge':
        instructions = `To install this app on Edge:\n1. Click the menu (⋯) in Edge\n2. Select "Apps" → "Install this site as an app"\n3. Click "Install"`;
        break;
      default:
        instructions = `To install this app:\nLook for an install option in your browser's menu or try adding it to your home screen manually.`;
    }
    alert(instructions);
    // After showing instructions, treat as dismissed so popup doesn't show again
    localStorage.setItem('pwa-user-interaction', 'dismissed');
    setShowInstallButton(false);
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
    localStorage.setItem('pwa-user-interaction', 'dismissed');
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {showInstallButton && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md mx-4 text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Install Shelf Labels</h2>
            <p className="text-gray-600 mb-6">
              Add to your home screen for quick access to shelf label printing and inventory management.
            </p>
            <button
              onClick={handleInstallClick}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors mb-3"
            >
              Install App
            </button>
            <button
              onClick={handleManualInstall}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors mb-3"
            >
              How to Install
            </button>
            <button
              onClick={handleDismiss}
              className="w-full text-gray-500 py-2 px-4 rounded-lg font-medium hover:text-gray-700 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}
    </>
  );
};
