import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';

interface MasterDataItem {
  [key: string]: any;
}

export const MasterDataImport: React.FC = () => {
  const [items, setItems] = useState<MasterDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [step, setStep] = useState<string>('');

  const fetchMasterData = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    setStep('Testing connection to server...');

    try {
      // First test the connection with a simple endpoint
      setStep('Testing /api/test endpoint...');
      console.log('Testing connection to server...');
      // Use fetch instead of XMLHttpRequest for better compatibility
      let testData;
      try {
        const response = await fetch('http://192.168.31.57:8080/api/test');
        if (!response.ok) {
          setStep('Failed at /api/test endpoint');
          throw new Error(`Test endpoint error! status: ${response.status}`);
        }
        testData = await response.json();
      } catch (fetchError: any) {
        setStep('Failed at /api/test endpoint');
        throw new Error(`Test endpoint error! ${fetchError.message}`);
      }
      setStep('Test endpoint successful. Fetching items...');
      console.log('Test successful:', testData);
      
      // Now fetch the actual items data
      let data;
      try {
        setStep('Fetching /api/items...');
        const response = await fetch('http://192.168.31.57:8080/api/items');
        if (!response.ok) {
          setStep('Failed at /api/items endpoint');
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        data = await response.json();
      } catch (fetchError) {
        setStep('Failed at /api/items endpoint');
        throw new Error(`Failed to fetch items: ${(fetchError as Error).message}`);
      }
      setStep('Items fetched. Processing data...');
      
      if (!Array.isArray(data)) {
        setStep('Server response is not an array');
        throw new Error('Server response is not an array');
      }

      setItems(data);
      setSuccess(`Successfully loaded ${data.length} items from server`);
      setLastUpdated(new Date().toLocaleString());
      setStep('Saving items to local database...');
      
      // Optionally save to local database
      if (data.length > 0) {
        try {
          await dbService.saveItems(data);
          setSuccess(`Successfully loaded and saved ${data.length} items to local database`);
          setStep('All steps completed successfully!');
        } catch (dbError) {
          setStep('Failed to save items to local database');
          console.warn('Could not save to local database:', dbError);
          setSuccess(`Successfully loaded ${data.length} items (could not save to local database)`);
        }
      }
    } catch (error) {
      setStep('Error occurred8080 during import process');
      console.error('Full error details:', error);
      let errorMessage = 'Failed to fetch data';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch when component mounts
  useEffect(() => {
    fetchMasterData();
  }, []);

  const getTableHeaders = () => {
    if (items.length === 0) return [];
    return Object.keys(items[0]);
  };

  return (
    <div className="p-3 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-blue-600 text-white px-3 py-2 rounded-lg mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <h1 className="text-lg font-semibold">Master Data Import</h1>
        </div>
        <button
          onClick={fetchMasterData}
          disabled={isLoading}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 text-white px-3 py-1 rounded text-sm font-medium"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Status Messages */}
      {step && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-800">{step}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-sm text-gray-600 mb-4">
          Last updated: {lastUpdated}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-600 mr-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-lg text-gray-600">Loading master data...</span>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && items.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {getTableHeaders().map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {getTableHeaders().map((header, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                      >
                        {item[header] !== null && item[header] !== undefined 
                          ? String(item[header]) 
                          : '-'
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-4 py-3 text-sm text-gray-700">
            Total items: {items.length}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && !error && (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
          <p className="mt-1 text-sm text-gray-500">Click refresh to load master data from server.</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center text-sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How it works
        </h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• This page automatically loads data from your .NET API server</li>
          <li>• Data is displayed in a table format for easy viewing</li>
          <li>• Click "Refresh" to reload the latest data</li>
          <li>• Data is also saved to your local database for offline use</li>
        </ul>
      </div>
    </div>
  );
};
