import React, { useState, useRef } from 'react';
import { Item } from '../types';
import { dbService } from '../services/database';
import { BarcodeScanner } from './BarcodeScanner';
import { SearchSuggestions } from './SearchSuggestions';

export const PricingLookup: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);


  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setCurrentItem(null);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const items = await dbService.searchItems(query);
      if (items.length > 0) {
        setCurrentItem(items[0]);
        setShowSuggestions(false);
      } else {
        setCurrentItem(null);
        setError('No item found with that code, name, or barcode');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
      setCurrentItem(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setError('');
    
    if (value.trim()) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setCurrentItem(null);
    }
  };

  const handleSuggestionSelect = (item: Item) => {
    setSearchInput(item.itemCode);
    setCurrentItem(item);
    setShowSuggestions(false);
    setError('');
  };

  const handleBarcodeScanned = (barcode: string) => {
    setSearchInput(barcode);
    setShowSuggestions(false);
    handleSearch(barcode);
  };

  const handleKeyboardToggle = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="pricing-lookup">
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Pricing Lookup
        </h1>

        {/* Search Input */}
        <div className="relative mb-4">
          <div className="flex gap-2">
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={handleInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchInput);
                }
              }}
              placeholder="Enter item code, name, or scan barcode..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleKeyboardToggle}
              className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              ⌨️
            </button>
            <button
              onClick={() => setShowScanner(!showScanner)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              📷
            </button>
            <button
              onClick={() => handleSearch(searchInput)}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isLoading ? '...' : 'Search'}
            </button>
          </div>

          {/* Search Suggestions */}
          {showSuggestions && searchInput.trim() && (
            <SearchSuggestions
              query={searchInput}
              showSuggestions={showSuggestions}
              onItemSelect={handleSuggestionSelect}
            />
          )}
        </div>

        {/* Barcode Scanner */}
        {showScanner && (
          <div className="mb-4">
            <BarcodeScanner
              onBarcodeDetected={handleBarcodeScanned}
              isVisible={showScanner}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Item Pricing Display */}
        {currentItem && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {currentItem.itemNameEng}
              </h2>
              
              {currentItem.itemNameArabic && (
                <p className="text-lg text-gray-600 mb-4">
                  {currentItem.itemNameArabic}
                </p>
              )}

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-500 mb-1">Item Code</p>
                <p className="text-lg font-mono text-gray-800">
                  {currentItem.itemCode}
                </p>
              </div>

              {currentItem.barcode && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-500 mb-1">Barcode</p>
                  <p className="text-lg font-mono text-gray-800">
                    {currentItem.barcode}
                  </p>
                </div>
              )}

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <p className="text-sm text-green-600 mb-2">Current Price</p>
                <p className="text-4xl font-bold text-green-700">
                  {formatPrice(currentItem.price)}
                </p>
              </div>

              {currentItem.uom && (
                <div className="mt-4 text-sm text-gray-500">
                  UOM: {currentItem.uom}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!currentItem && !error && (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-2">Search for an item to view its pricing information</p>
            <p className="text-sm">You can search by:</p>
            <ul className="text-sm mt-1">
              <li>• Item code</li>
              <li>• Item name</li>
              <li>• Barcode (scan or type)</li>
            </ul>
          </div>
        )}
      </div>

    </div>
  );
};
