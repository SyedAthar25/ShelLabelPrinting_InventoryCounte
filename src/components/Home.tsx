import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dbService } from '../services/database';
import TestDataButton from './TestDataButton';
import { ItemTableView } from './ItemTableView';

export const Home: React.FC = () => {
  const [itemsCount, setItemsCount] = useState(0);
  const [showItemTable, setShowItemTable] = useState(false);

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
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      textColor: 'text-purple-600'
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
    <div className="p-3 max-w-md mx-auto pb-20"> {/* Add bottom padding for nav */}
      {/* Simple Header */}
      <div className="bg-blue-600 text-white px-3 py-2 rounded-lg mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h1 className="text-lg font-semibold">Shelf Label & Inventory</h1>
      </div>

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
            <div className="text-sm font-medium text-gray-700">Not synced</div>
          </div>
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

      {/* Test Data Management */}
      <div className="mb-3">
        <TestDataButton />
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
      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full max-w-md mx-auto bg-white border-t border-gray-200 flex justify-around items-center py-2 z-50" style={{boxShadow: '0 -2px 8px rgba(0,0,0,0.04)'}}>
        <Link to="/" className="flex flex-col items-center text-blue-600 hover:text-blue-800">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m4-8v8m5 0a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2h14z" /></svg>
          <span className="text-xs">Home</span>
        </Link>
        <Link to="/shelf-label" className="flex flex-col items-center text-blue-600 hover:text-blue-800">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span className="text-xs">Print</span>
        </Link>
        <Link to="/inventory-count" className="flex flex-col items-center text-blue-600 hover:text-blue-800">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <span className="text-xs">Count</span>
        </Link>
        <Link to="/sync" className="flex flex-col items-center text-blue-600 hover:text-blue-800">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <span className="text-xs">Sync</span>
        </Link>
        <Link to="/settings" className="flex flex-col items-center text-blue-600 hover:text-blue-800">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-xs">Settings</span>
        </Link>
      </nav>
    </div>
  );
};
