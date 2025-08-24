import React, { useState, useEffect } from 'react';
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

  const handleRefresh = () => {
    setSearchInput('');
    setShowSuggestions(false);
    setCurrentItem(null);
    setQuantity('');
    setError('');
    setSuccess('');
    // Optionally reset session if you want to clear all items
    // setCurrentSession({ id: Date.now().toString(), date: new Date().toISOString(), items: [], synced: false });
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setShowSuggestions(false);

    setIsLoading(true);
    setError('');
    try {
      let item: Item | undefined;

      if (searchInput.length >= 8) {
        item = await dbService.getItemByBarcode(searchInput);
      }

      if (!item) {
        item = await dbService.getItemByCode(searchInput);
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
    setTimeout(() => handleSearch(), 100);
  };

  const handleAddCount = () => {
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
    dbService.saveCountSession(updatedSession);
    
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
      await apiService.uploadCountSession(currentSession);
      setSuccess('Count session synced successfully!');
      setCurrentSession(prev => ({ ...prev, synced: true }));
    } catch (error) {
      setError('Sync failed. Please check your connection and try again.');
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
      <h2 className="text-2xl font-bold mb-6">Inventory Count</h2>
      <button className="btn btn-secondary mb-4" onClick={handleRefresh}>
        Refresh
      </button>

      {/* Search Input */}
      <div className="card">
        <div className="form-group relative">
          <label className="form-label">Scan barcode or enter item code:</label>
          <div className="flex gap-2">
            <input
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
              placeholder="Scan or enter barcode/item code"
              className="form-input flex-1"
              disabled={isLoading}
            />
            <button
              onClick={handleSearch}
              disabled={isLoading || !searchInput.trim()}
              className="btn btn-primary"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          {/* Search Suggestions */}
          <SearchSuggestions
            query={searchInput}
            showSuggestions={showSuggestions}
            onItemSelect={(item) => {
              setCurrentItem(item);
              setSearchInput(item.itemCode);
              setShowSuggestions(false);
            }}
          />
        </div>

        {/* Barcode Scanner */}
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold text-blue-600">
            Use Camera Scanner
          </summary>
          <div className="mt-2">
            <BarcodeScanner
              onBarcodeDetected={handleBarcodeDetected}
              onError={setError}
            />
          </div>
        </details>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* Item Display and Count Input */}
      {currentItem && (
        <div className="space-y-4">
          <ItemCard item={currentItem} />

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Enter Count</h3>
            
            <div className="form-group">
              <label className="form-label">Quantity:</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                className="form-input"
                placeholder="Enter quantity"
              />
            </div>

            <div className="flex gap-2 mb-4">
              <button onClick={() => handleQuickAdd(1)} className="btn btn-secondary flex-1">
                +1
              </button>
              <button onClick={() => handleQuickAdd(5)} className="btn btn-secondary flex-1">
                +5
              </button>
              <button onClick={() => handleQuickAdd(10)} className="btn btn-secondary flex-1">
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

      {/* Session Summary */}
      {currentSession.items.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            Current Session: {uniqueItems} items, {totalItems} total count
          </h3>

          <div className="count-list">
            {currentSession.items.map((item, index) => (
              <div key={item.itemId} className="count-item">
                <div className="count-item-info">
                  <div className="font-semibold">{item.itemName}</div>
                  <div className="text-sm text-gray-600">
                    Code: {item.itemCode} | Qty: {item.quantity}
                  </div>
                </div>
                <div className="count-item-actions">
                  <span className="text-sm text-gray-500">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => handleRemoveItem(item.itemId)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-4">
            <button
              onClick={handleSync}
              disabled={isLoading || currentSession.synced}
              className="btn btn-primary flex-1"
            >
              {isLoading ? 'Syncing...' : 'Sync to Server'}
            </button>
            <button
              onClick={handleExport}
              className="btn btn-warning flex-1"
            >
              Export to Excel
            </button>
          </div>

          {currentSession.synced && (
            <div className="success-message mt-4">
              This session has been synced successfully.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
