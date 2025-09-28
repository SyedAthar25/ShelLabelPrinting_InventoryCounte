import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dbService } from '../services/database';
import { ItemTableView } from './ItemTableView';

export const Home: React.FC = () => {
  const [itemsCount, setItemsCount] = useState(0);
  const [showItemTable, setShowItemTable] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    loadItemsCount();
    
    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadItemsCount = async () => {
    try {
      const count = await dbService.getItemsCount();
      setItemsCount(count);
      
      // Removed auto-seeding - sample data will only be added when user clicks "Add Sample Data"
    } catch (error) {
      console.error('Error loading items count:', error);
    }
  };

  // Removed ensureSampleData function - no more auto-seeding

  const addMoreTestData = async () => {
    try {
      const sampleItems = [
        {
          id: `test-${Date.now()}-1`,
          itemCode: 'TEST001',
          barcode: `690${Date.now()}001`,
          itemNameEng: 'Test Item 1',
          itemNameArabic: 'عنصر تجريبي 1',
          price: 1.99,
          uom: 'piece',
          updatedAt: new Date().toISOString(),
        },
        {
          id: `test-${Date.now()}-2`,
          itemCode: 'TEST002',
          barcode: `690${Date.now()}002`,
          itemNameEng: 'Test Item 2',
          itemNameArabic: 'عنصر تجريبي 2',
          price: 2.99,
          uom: 'piece',
          updatedAt: new Date().toISOString(),
        }
      ];
      
      await dbService.saveItems(sampleItems);
      await loadItemsCount();
      alert(`Added ${sampleItems.length} more test items!`);
    } catch (error) {
      console.error('Error adding test data:', error);
      alert('Failed to add test data');
    }
  };

  const menuItems = [
    {
      to: '/shelf-label',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Shelf Label',
      subtitle: 'Print labels',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      textColor: 'text-blue-600'
    },
    {
      to: '/pricing-lookup',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      title: 'Pricing Lookup',
      subtitle: 'Check prices',
      color: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      textColor: 'text-yellow-600'
    },
    {
      to: '/inventory-count',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Inventory Count',
      subtitle: 'Count items',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      textColor: 'text-green-600'
    },
    {
      to: '/sync',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: 'Sync Data',
      subtitle: 'Upload/download',
      color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
      textColor: 'text-indigo-600'
    },
    {
      to: '/settings',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Settings',
      subtitle: 'Configure app',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="p-3 max-w-md mx-auto"> {/* Remove bottom padding since nav is handled by App.tsx */}
      {/* Simple Header */}
      <div className="bg-blue-600 text-white px-3 py-2 rounded-lg mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h1 className="text-lg font-semibold">Shelf Label & Inventory</h1>
      </div>

      {/* Offline Notice */}
      {isOffline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-yellow-800">Offline Mode</div>
              <div className="text-xs text-yellow-700">App works offline with sample data</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-600">Items in Database</div>
              <div className="text-lg font-bold text-gray-800">{itemsCount}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Last sync</div>
            <div className="text-sm font-medium text-gray-700">
              {isOffline ? 'Offline' : 'Not synced'}
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          {isSeeding ? (
            <div className="w-full text-xs bg-yellow-50 text-yellow-700 py-2 px-3 rounded-lg text-center">
              🔄 Seeding sample data...
            </div>
          ) : itemsCount === 0 ? (
            <button
              onClick={async () => {
                try {
                  setIsSeeding(true);
                  await dbService.forceSeedSampleData();
                  await loadItemsCount();
                  setIsSeeding(false);
                } catch (error) {
                  console.error('Error adding sample data:', error);
                  setIsSeeding(false);
                }
              }}
              className="w-full text-xs bg-green-50 hover:bg-green-100 text-green-700 py-2 px-3 rounded-lg transition-colors duration-200"
            >
              🌱 Add Sample Data
            </button>
          ) : itemsCount < 5 ? (
            <button
              onClick={addMoreTestData}
              className="w-full text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-3 rounded-lg transition-colors duration-200"
            >
              + Add More Test Items
            </button>
          ) : null}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.to}
            className="group block bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200`}>
              <div className="text-white">
                {item.icon}
              </div>
            </div>
            <div className={`font-semibold text-sm ${item.textColor} mb-1`}>
              {item.title}
            </div>
            <div className="text-xs text-gray-500">
              {item.subtitle}
            </div>
          </Link>
        ))}
      </div>


      {/* View Items Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-3">
        <button
          onClick={() => setShowItemTable(!showItemTable)}
          className="w-full flex items-center justify-center py-2 px-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <svg className={`w-4 h-4 mr-2 transition-transform duration-200 ${showItemTable ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            {showItemTable ? 'Hide All Items' : 'View All Items in Table'}
          </span>
        </button>
      </div>

      {/* Show Item Table if toggled */}
      {showItemTable && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <ItemTableView />
        </div>
      )}
    </div>
  );
};
