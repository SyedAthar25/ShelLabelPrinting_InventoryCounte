import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from './components/Home';
import { ShelfLabel } from './components/ShelfLabel';
import { PricingLookup } from './components/PricingLookup';
import { InventoryCount } from './components/InventoryCount';
import { MasterDataImport } from './components/MasterDataImport';
import { Sync } from './components/Sync';
import { Settings } from './components/Settings';
import PrintPreviewMobile from './components/PrintPreviewMobile';
import { dbService } from './services/database';
import './styles/tw-output.css';

const Navigation: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    loadItemsCount();
  }, []);

  const loadItemsCount = async () => {
    try {
      await dbService.getItemsCount(); // Removed unused variable assignment
    } catch (error) {
      console.error('Error loading items count:', error);
    }
  };

  const navItems = [
    { 
      path: '/', 
      label: 'Home', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      path: '/shelf-label', 
      label: 'Print', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      )
    },
    { 
      path: '/pricing-lookup', 
      label: 'Pricing', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    { 
      path: '/inventory-count', 
      label: 'Count', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      path: '/sync', 
      label: 'Sync', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  return (
    <nav className="bg-white shadow-lg border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center py-2 px-3 text-xs transition-all duration-200 ${
              location.pathname === item.path
                ? 'text-blue-600 scale-110'
                : 'text-gray-600 hover:text-gray-900 hover:scale-105'
            }`}
          >
            <span className="mb-1">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
};

const AppContent: React.FC = () => {
  useEffect(() => {
    // Set background color to white
    document.body.style.background = '#fff';
  }, []);
  return (
    <>
      {/* VersionBanner removed */}
      <div className="app-container pb-16" style={{ paddingTop: 0 }}> {/* Remove padding for banner */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shelf-label" element={<ShelfLabel />} />
          <Route path="/pricing-lookup" element={<PricingLookup />} />
          <Route path="/inventory-count" element={<InventoryCount />} />
          <Route path="/master-data-import" element={<MasterDataImport />} />
          <Route path="/sync" element={<Sync />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/print-preview" element={<PrintPreviewMobile />} />
        </Routes>
        {/* <PWAInstall /> Removed per user request */}
        <Navigation />
      </div>
    </>
  );
};

const getFirstLaunchDate = () => {
  const stored = localStorage.getItem('app_first_launch');
  if (stored) return new Date(stored);
  const now = new Date();
  localStorage.setItem('app_first_launch', now.toISOString());
  return now;
};

const isExpired = () => {
  const firstLaunch = getFirstLaunchDate();
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - firstLaunch.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 10;
};

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (isExpired()) {
      setExpired(true);
      return;
    }
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        await dbService.initialize();
        const itemCount = await dbService.getItemsCount();
        console.log('Item count after initialization:', itemCount);
        // Removed auto-seeding - sample data will only be added when user clicks "Add Sample Data"
        setIsInitialized(true);
        console.log('App initialization complete');
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true);
      }
    };
    initializeApp();
  }, []);

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">App Expired</h2>
          <p className="mb-2">This application has expired after 10 days of use.</p>
          <p>Please contact support to renew your access.</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p>Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
