import { useState, useEffect, useRef } from 'react';
import { Item, CountItem, CountSession } from '../types';
import { dbService } from '../services/database';
import { apiService } from '../services/api';
import { ExportUtils } from '../utils/exportUtils';
import { BarcodeScanner } from './BarcodeScanner';
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
  const [locations, setLocations] = useState<{ id: string; name: string; createdAt: string }[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ id: string; name: string } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);


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
    setQuantity(''); // Clear quantity on refresh
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
          setQuantity(''); // Always start with empty quantity for new items
        }
      } else {
        setError('Item not found. Please check the barcode or item code.');
        setCurrentItem(null);
        setQuantity(''); // Clear quantity when item not found
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

  const handleKeyboardToggle = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Restore autofocus on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Load locations and persisted location on mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const locs = await dbService.getLocations();
        setLocations(locs);

        // Load persisted location
        const persistedLocation = localStorage.getItem('selectedLocation');
        if (persistedLocation) {
          const locationData = JSON.parse(persistedLocation);
          setSelectedLocation(locationData);
          setCurrentSession(prev => ({
            ...prev,
            location: locationData.name,
          }));
        } else {
          // Show location modal if no location selected
          setShowLocationModal(true);
        }
      } catch (error) {
        console.error('Error loading locations:', error);
      }
    };
    loadLocations();
  }, []);

  const handleAddCount = async () => {
    if (!selectedLocation) {
      setError('Please select a location first');
      return;
    }

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
    // Refocus for next scan
    setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.focus();
      alert('Added to count. Ready for next scan.');
    }, 50);

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
      apiService.setBaseUrl();
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

  const handleLocationSelect = (location: { id: string; name: string }) => {
    setSelectedLocation(location);
    localStorage.setItem('selectedLocation', JSON.stringify(location));
    setCurrentSession(prev => ({
      ...prev,
      location: location.name,
    }));
    setShowLocationModal(false);
    setLocationInput('');
    setError('');
    setSuccess(`Location set to: ${location.name}`);
  };

  const handleLocationSubmit = () => {
    if (!locationInput.trim()) {
      setError('Please enter a location name');
      return;
    }

    const trimmedInput = locationInput.trim();
    const existingLocation = locations.find(loc =>
      loc.name.toLowerCase() === trimmedInput.toLowerCase()
    );

    if (existingLocation) {
      handleLocationSelect(existingLocation);
    } else {
      setError('Location not found. Please select from existing locations or add it in Settings.');
    }
  };

  const handleChangeLocation = () => {
    setShowLocationModal(true);
    setLocationInput('');
    setError('');
  };

  const handleCompleteLocation = async () => {
    if (!selectedLocation) {
      setError('Please select a location first');
      return;
    }

    try {
      const updatedSession: CountSession = {
        ...currentSession,
        completed: true,
      };

      await dbService.saveCountSession(updatedSession);
      setCurrentSession(updatedSession);
      setSuccess(`Location "${selectedLocation.name}" inventory completed!`);

      // Clear persisted location and reset for next location
      localStorage.removeItem('selectedLocation');
      setTimeout(() => {
        setCurrentSession({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          items: [],
          synced: false,
        });
        setSelectedLocation(null);
        setSuccess('');
        setShowLocationModal(true); // Show modal for next location
      }, 2000);
    } catch (error) {
      setError('Failed to complete location inventory');
      console.error('Error completing location:', error);
    }
  };

  const totalItems = currentSession.items.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = currentSession.items.length;

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold m-0">Inventory Count</h2>
          <button onClick={handleRefresh} className="p-2 ml-2 text-blue-600 hover:text-blue-800 focus:outline-none" title="Refresh">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Location Controls - Right after heading */}
        <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {selectedLocation ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">{selectedLocation.name}</span>
              </div>
            ) : (
              <div className="text-red-600 font-medium">⚠️ No location selected - Inventory disabled</div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleChangeLocation}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              {selectedLocation ? 'Change Location' : 'Select Location'}
            </button>

            {selectedLocation && (
              <button
                onClick={handleCompleteLocation}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Complete Location
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Input - Disabled when no location selected */}
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
          onKeyPress={(e) => e.key === 'Enter' && selectedLocation && handleSearch()}
          placeholder={selectedLocation ? "Enter barcode/item code/Item Name" : "Select a location first"}
          className={`form-input flex-1 ${!selectedLocation ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          disabled={isLoading || !selectedLocation}
        />
        <button
          onClick={handleKeyboardToggle}
          disabled={!selectedLocation}
          className={`btn btn-secondary flex items-center justify-center p-2 ${!selectedLocation ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ minWidth: 36, minHeight: 36 }}
        >
          ⌨️
        </button>
        <button
          onClick={() => handleSearch()}
          disabled={isLoading || !searchInput.trim() || !selectedLocation}
          className={`btn btn-primary flex items-center justify-center p-2 ${!selectedLocation ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        onItemSelect={(item: Item) => {
          setCurrentItem(item);
          setSearchInput(item.itemCode);
          setShowSuggestions(false);
        }}
      />

      {/* Barcode Scanner - disabled when no location selected */}
      {selectedLocation && showScanner && (
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
      {selectedLocation && !showScanner && (
        <div className="mb-2">
          <button
            onClick={() => setShowScanner(true)}
            className="btn btn-secondary text-sm"
          >
            📷 Scan Another Item
          </button>
        </div>
      )}
      {!selectedLocation && (
        <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">📷 Camera scanner will be available after selecting a location</p>
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
            {(() => {
              // Show only the most recently changed item
              const sortedItems = [...currentSession.items].sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
              );
              const lastItem = sortedItems[0];
              
              if (!lastItem) return null;
              
              return (
                <div key={lastItem.itemId} className="flex items-center justify-between p-2 border-b border-gray-200">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{lastItem.itemName}</div>
                    <div className="text-xs text-gray-600">
                      {lastItem.itemCode} | Qty: {lastItem.quantity} (Total: {totalQuantities[lastItem.itemId] ?? '...'})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(lastItem.timestamp).toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(lastItem.itemId)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {currentSession.synced && (
            <div className="success-message mt-2 text-sm">
              ✓ Session synced successfully
            </div>
          )}
        </div>
      )}

      {/* Location Selection Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Select Location</h3>

            {/* Location Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Enter Location Name:</label>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Type location name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleLocationSubmit()}
                autoFocus
              />
              <button
                onClick={handleLocationSubmit}
                disabled={!locationInput.trim()}
                className="w-full mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Select Location
              </button>
            </div>

            {/* Existing Locations */}
            {locations.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Or select from existing locations:</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {locations.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleLocationSelect(location)}
                      className="w-full text-left px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      {location.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Info Message */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                To add new locations, go to Settings → Location Management.
              </p>
            </div>

            {/* Close Button */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
