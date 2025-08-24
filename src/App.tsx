import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from './components/Home';
import { ShelfLabel } from './components/ShelfLabel';
import { InventoryCount } from './components/InventoryCount';
import { Sync } from './components/Sync';
import { Settings } from './components/Settings';
import { dbService } from './services/database';
import './styles/App.css';

const Navigation: React.FC = () => {
  const location = useLocation();
  const [itemsCount, setItemsCount] = useState(0);

  useEffect(() => {
    loadItemsCount();
  }, []);

  const loadItemsCount = async () => {
    try {
      const count = await dbService.getItemsCount();
      setItemsCount(count);
    } catch (error) {
      console.error('Error loading items count:', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/shelf-label', label: 'Print', icon: '🖨️' },
    { path: '/inventory-count', label: 'Count', icon: '📊' },
    { path: '/sync', label: 'Sync', icon: '🔄' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="bg-white shadow-sm border-t fixed bottom-0 left-0 right-0 z-10">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center py-2 px-4 text-xs ${
              location.pathname === item.path
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-lg mb-1">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
};

const AppContent: React.FC = () => {
  return (
    <div className="app-container pb-16"> {/* Padding for bottom navigation */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shelf-label" element={<ShelfLabel />} />
        <Route path="/inventory-count" element={<InventoryCount />} />
        <Route path="/sync" element={<Sync />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Navigation />
    </div>
  );
};

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await dbService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

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
