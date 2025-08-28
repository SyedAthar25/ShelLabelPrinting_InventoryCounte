import React, { useState, useEffect, useRef } from 'react';
import { Item, CountItem, CountSession } from '../types';
import { dbService } from '../services/database';
import { apiService } from '../services/api';
import { ExportUtils } from '../utils/exportUtils';
import { BarcodeScanner } from './BarcodeScanner';
import { ItemCard } from './ItemCard';
import { SearchSuggestions } from './SearchSuggestions';

export const InventoryCount: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState('');
  const [currentSession, setCurrentSession] = useState<CountSession>({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    items: [],
    synced: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(''); // Add feedback state
  const [showScanner, setShowScanner] = useState(true); // New state to control scanner visibility
  const [totalQuantities, setTotalQuantities] = useState<{ [itemId: string]: number }>({});
  const [selectedItemTotal, setSelectedItemTotal] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Fetch total quantities for all items in session
  useEffect(() => {
    const fetchTotals = async () => {
      const totals: { [itemId: string]: number } = {};
      for (const item of currentSession.items) {
        totals[item.itemId] = await dbService.getTotalQuantityForItem(item.itemId);
      }
      setTotalQuantities(totals);
    };
    if (currentSession.items.length > 0) {
      fetchTotals();
    }
  }, [currentSession.items]);

  // Fetch total quantity for the selected item
  useEffect(() => {
    const fetchTotal = async () => {
      if (currentItem) {
        const total = await dbService.getTotalQuantityForItem(currentItem.id);
        setSelectedItemTotal(total);
      } else {
        setSelectedItemTotal(null);
      }
    };
    fetchTotal();
  }, [currentItem]);

  const handleRefresh = () => {
    setSearchInput('');
    setShowSuggestions(false);
    setCurrentItem(null);
    setQuantity('');
    setError('');
    setSuccess('');
    setShowScanner(true); // Show scanner again when refreshing
    // Optionally reset session if you want to clear all items
    // setCurrentSession({ id: Date.now().toString(), date: new Date().toISOString(), items: [], synced: false });
  };

  const handleSearch = async (searchTerm?: string) => {
    const termToSearch = searchTerm || searchInput.trim();
    if (!termToSearch) return;
    setShowSuggestions(false);

    setIsLoading(true);
    setError('');
    try {
      let item: Item | undefined;

      if (termToSearch.length >= 8) {
        item = await dbService.getItemByBarcode(termToSearch);
      }

      if (!item) {
        item = await dbService.getItemByCode(termToSearch);
      }

      if (item) {
        setCurrentItem(item);
        // Check if item already exists in session
        const existingItem = currentSession.items.find(i => i.itemId === item!.id);
        if (existingItem) {
          setQuantity(existingItem.quantity.toString());
        } else {
          setQuantity('');
        }
      } else {
        setError('Item not found. Please check the barcode or item code.');
        setCurrentItem(null);
      }
    } catch (error) {
      setError('Error searching for item');
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeDetected = (barcode: string) => {
    setSearchInput(barcode);
    setError(''); // Clear any previous errors
    setFeedback('Barcode detected! Searching for item...'); // Show immediate feedback
    setShowScanner(false); // Hide the scanner
    // Call search with the barcode directly
    handleSearch(barcode);
    // Clear the feedback message after search completes and focus on quantity input
    setTimeout(() => {
      setFeedback('');
      // Auto-focus on quantity input for better UX
      const quantityInput = document.querySelector('input[type="number"]') as HTMLInputElement;
      if (quantityInput) quantityInput.focus();
    }, 2000);
  };

  const handleAddCount = async () => {
    if (!currentItem || !quantity.trim() || isNaN(parseInt(quantity))) {
      setError('Please enter a valid quantity');
      return;
    }

    const qty = parseInt(quantity);
    const newItem: CountItem = {
      itemId: currentItem.id,
      itemCode: currentItem.itemCode,
      itemName: currentItem.itemNameEng,
      quantity: qty,
      timestamp: new Date().toISOString(),
    };

    // Update or add item to session
    const existingIndex = currentSession.items.findIndex(i => i.itemId === currentItem.id);
    let updatedItems: CountItem[];

    if (existingIndex >= 0) {
      updatedItems = [...currentSession.items];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + qty,
        timestamp: new Date().toISOString(),
      };
    } else {
      updatedItems = [...currentSession.items, newItem];
    }

    const updatedSession: CountSession = {
      ...currentSession,
      items: updatedItems,
    };

    setCurrentSession(updatedSession);
    setIsLoading(true); // Disable Sync while saving
    await dbService.saveCountSession(updatedSession);
    setIsLoading(false);
    
    setSuccess(`Added ${qty} to ${currentItem.itemNameEng}`);
    setSearchInput('');
    setCurrentItem(null);
    setQuantity('');
    
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleQuickAdd = (amount: number) => {
    setQuantity(prev => {
      const current = parseInt(prev) || 0;
      return (current + amount).toString();
    });
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedItems = currentSession.items.filter(item => item.itemId !== itemId);
    const updatedSession: CountSession = {
      ...currentSession,
      items: updatedItems,
    };
    setCurrentSession(updatedSession);
    dbService.saveCountSession(updatedSession);
  };

  const handleSync = async () => {
    if (currentSession.items.length === 0) {
      setError('No items to sync');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Always fetch latest settings and set API base URL
      const settings = await dbService.getSettings();
      if (!settings.apiBaseUrl) {
        throw new Error('API base URL not configured');
      }
      apiService.setBaseUrl(settings.apiBaseUrl);
      await apiService.uploadCountSession(currentSession);
      setSuccess('Count session synced successfully!');
      setCurrentSession(prev => ({ ...prev, synced: true }));
      // Save last sync time
      await dbService.saveLastSyncTime(new Date().toISOString());
      // Notify other tabs/components
      window.dispatchEvent(new Event('sync-updated'));
    } catch (error) {
      let errorMessage = 'Sync failed. Please check your connection and try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      setError(errorMessage);
      console.error('Sync error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (currentSession.items.length === 0) {
      setError('No items to export');
      return;
    }

    ExportUtils.exportToExcel([currentSession]);
    setSuccess('Exported to Excel successfully!');
  };

  const totalItems = currentSession.items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = currentSession.items.length;

  return (
    <div className="p-4">
      <div className="flex items-center mb-6 gap-2">
        <h2 className="text-2xl font-bold m-0">Inventory Count</h2>
        <button onClick={handleRefresh} className="p-2 ml-2 text-blue-600 hover:text-blue-800 focus:outline-none" title="Refresh">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2 mb-2">
        <input
          ref={searchInputRef}
          type="text"
          value={searchInput}
          onChange={(e) => {
            const value = e.target.value;
            setSearchInput(value);
            setShowSuggestions(true);
            if (value === '') {
              setCurrentItem(null);
              setQuantity('');
              setError('');
              setSuccess('');
              setShowSuggestions(false);
            }
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter barcode/item code/Item Name"
          className="form-input flex-1"
          disabled={isLoading}
        />
        <button
          onClick={() => handleSearch()}
          disabled={isLoading || !searchInput.trim()}
          className="btn btn-primary flex items-center justify-center p-2"
          style={{ minWidth: 36, minHeight: 36 }}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /> </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" /><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          )}
        </button>
      </div>
      
      <SearchSuggestions
        query={searchInput}
        showSuggestions={showSuggestions}
        onItemSelect={(item) => {
          setCurrentItem(item);
          setSearchInput(item.itemCode);
          setShowSuggestions(false);
        }}
      />

      {/* Barcode Scanner - minimal space */}
      {showScanner && (
        <details className="mb-2">
          <summary className="cursor-pointer font-semibold text-blue-600">Use Camera Scanner</summary>
          <div className="mt-1">
            <BarcodeScanner
              onBarcodeDetected={handleBarcodeDetected}
              onError={setError}
              isVisible={showScanner}
            />
          </div>
        </details>
      )}
      {!showScanner && (
        <div className="mb-2">
          <button 
            onClick={() => setShowScanner(true)} 
            className="btn btn-secondary text-sm"
          >
            📷 Scan Another Item
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message mb-2">{error}</div>
      )}

      {/* Success Message */}
      {success && (
        <div className="success-message mb-2">{success}</div>
      )}

      {/* Feedback Message */}
      {feedback && !error && (
        <div className="success-message mb-2">{feedback}</div>
      )}

      {/* Item Display and Count Input - Compact Layout */}
      {currentItem && (
        <div className="flex flex-col items-center w-full">
          {/* Item Info - Compact */}
          <div className="w-full mb-2 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="font-semibold text-lg">{currentItem.itemNameEng}</div>
              <div className="text-sm text-gray-600">{currentItem.itemCode}</div>
              {currentItem.itemNameArabic && (
                <div className="text-sm text-gray-600 mt-1">{currentItem.itemNameArabic}</div>
              )}
              {selectedItemTotal !== null && (
                <div className="text-xs text-blue-700 mt-1">Existing Quantity: {selectedItemTotal}</div>
              )}
            </div>
          </div>

          {/* Quantity Input and Quick Add - Compact */}
          <div className="w-full mb-2">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium">Quantity:</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                className="form-input flex-1"
                placeholder="Enter quantity"
                style={{ fontSize: 15, padding: '4px 8px', height: 32 }}
              />
            </div>
            
            <div className="flex gap-2 mb-2">
              <button onClick={() => handleQuickAdd(1)} className="btn btn-secondary flex-1 text-sm py-1">
                +1
              </button>
              <button onClick={() => handleQuickAdd(5)} className="btn btn-secondary flex-1 text-sm py-1">
                +5
              </button>
              <button onClick={() => handleQuickAdd(10)} className="btn btn-secondary flex-1 text-sm py-1">
                +10
              </button>
            </div>

            <button
              onClick={handleAddCount}
              disabled={!quantity.trim() || isNaN(parseInt(quantity))}
              className="btn btn-success w-full"
            >
              Add to Count
            </button>
          </div>
        </div>
      )}

      {/* Session Summary - Compact */}
      {currentSession.items.length > 0 && (
        <div className="w-full">
          <div className="flex items-center justify-between mb-2 p-2 bg-blue-50 rounded">
            <span className="font-semibold text-sm">
              Session: {uniqueItems} items, {totalItems} total
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleSync}
                disabled={isLoading || currentSession.synced}
                className="btn btn-primary text-xs px-2 py-1"
              >
                {isLoading ? 'Saving...' : currentSession.synced ? 'Synced' : 'Sync'}
              </button>
              <button
                onClick={handleExport}
                className="btn btn-warning text-xs px-2 py-1"
              >
                Export
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {currentSession.items.map((item, index) => (
              <div key={item.itemId} className="flex items-center justify-between p-2 border-b border-gray-200">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.itemName}</div>
                  <div className="text-xs text-gray-600">
                    {item.itemCode} | Qty: {item.quantity} (Total: {totalQuantities[item.itemId] ?? '...'})
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => handleRemoveItem(item.itemId)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {currentSession.synced && (
            <div className="success-message mt-2 text-sm">
              ✓ Session synced successfully
            </div>
          )}
        </div>
      )}
    </div>
  );
};
