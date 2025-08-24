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

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Shelf Label & Inventory
        </h1>
        <p className="text-gray-600">
          Mobile app for label printing and inventory counting
        </p>
      </div>

      {/* Test Data Management */}
      <TestDataButton />

      {/* Add View Items Button */}
      <div className="card mb-6">
        <button
          onClick={() => setShowItemTable(!showItemTable)}
          className="btn btn-secondary w-full"
        >
          {showItemTable ? 'Hide All Items' : 'View All Items in Table'}
        </button>
      </div>

      {/* Show Item Table if toggled */}
      {showItemTable && <ItemTableView />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-6">
        {/* Shelf Label Card */}
        <Link
          to="/shelf-label"
          className="card hover:shadow-lg transition-shadow duration-200 text-center"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Shelf Label Printing
          </h3>
          <p className="text-gray-600">
            Print barcode labels with customizable options
          </p>
        </Link>

        {/* Inventory Count Card */}
        <Link
          to="/inventory-count"
          className="card hover:shadow-lg transition-shadow duration-200 text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Inventory Count
          </h3>
          <p className="text-gray-600">
            Count inventory items and sync with server
          </p>
        </Link>

        {/* Sync Card */}
        <Link
          to="/sync"
          className="card hover:shadow-lg transition-shadow duration-200 text-center"
        >
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Sync Data
          </h3>
          <p className="text-gray-600">
            Download master data and upload counts
          </p>
        </Link>

        {/* Settings Card */}
        <Link
          to="/settings"
          className="card hover:shadow-lg transition-shadow duration-200 text-center"
        >
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Settings
          </h3>
          <p className="text-gray-600">
            Configure API endpoints and preferences
          </p>
        </Link>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Last sync: Not synced yet</p>
        <p>Items in local database: {itemsCount}</p>
      </div>
    </div>
  );
};
