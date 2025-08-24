import React, { useState, useEffect } from 'react';
import { Item, PrintSettings } from '../types';
import { dbService } from '../services/database';
import { printService } from '../services/printService';
import { BarcodeScanner } from './BarcodeScanner';
import { PrintPreview } from './PrintPreview';
import { SearchSuggestions } from './SearchSuggestions';

export const ShelfLabel: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    includeBarcode: true,
    includePrice: true,
  });
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handleRefresh = () => {
    setSearchInput('');
    setShowSuggestions(false);
    setCurrentItem(null);
    setError('');
    setQuantity(1);
    // Optionally reset printSettings to default if needed
  };

  useEffect(() => {
    loadDefaultSettings();
  }, []);

  const loadDefaultSettings = async () => {
    try {
      const settings = await dbService.getSettings();
      setPrintSettings(settings.defaultPrintSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setShowSuggestions(false);

    setIsLoading(true);
    setError('');
    try {
      let item: Item | undefined;

      // Try barcode first
      if (searchInput.length >= 8) {
        item = await dbService.getItemByBarcode(searchInput);
      }

      // If not found by barcode, try item code
      if (!item) {
        item = await dbService.getItemByCode(searchInput);
      }

      if (item) {
        setCurrentItem(item);
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

  // Show modal with print preview
  const handlePrint = () => {
    setShowPrintModal(true);
  };

  // Print only the label in the modal
  const handleModalPrint = () => {
    const printContents = document.getElementById('modal-label-preview')?.innerHTML;
    const printWindow = window.open('', '', 'width=300,height=200');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label</title>
          <style>
            @media print {
              body { margin: 0; }
              .label {
                width: 60mm !important;
                height: 40mm !important;
                box-sizing: border-box;
                margin: 0 auto;
                background: #fff;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 5px;
                border: 1px solid #000;
              }
            }
          </style>
        </head>
        <body>
          <div class="label">
            ${printContents}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Shelf Label Printing</h2>
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
                  setError('');
                  setQuantity(1);
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
      {/* Item Display */}
      {currentItem && (
        <div className="space-y-4 flex flex-col items-center">
          {/* Print Settings */}
          <div className="card" style={{ boxShadow: 'none', border: '1px solid #e0e0e0', borderRadius: 12, padding: 20, background: '#fff', fontSize: 15, width: '100%', maxWidth: 420, margin: '0 auto' }}>
            <h3 className="text-base font-semibold mb-3">Print Settings</h3>
            <div className="form-group mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={printSettings.includeBarcode}
                  onChange={(e) => setPrintSettings(prev => ({
                    ...prev,
                    includeBarcode: e.target.checked
                  }))}
                  className="form-checkbox"
                />
                <span className="ml-2">Include Barcode</span>
              </label>
            </div>
            <div className="form-group mb-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={printSettings.includePrice}
                  onChange={(e) => setPrintSettings(prev => ({
                    ...prev,
                    includePrice: e.target.checked
                  }))}
                  className="form-checkbox"
                />
                <span className="ml-2">Include Price</span>
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity to print:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantity === 0 ? '' : quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^[1-9][0-9]*$/.test(val)) {
                    setQuantity(val === '' ? 0 : parseInt(val));
                  }
                }}
                className="form-input"
                style={{ fontSize: 15, padding: '2px 6px', height: 28 }}
              />
            </div>
          </div>
          {/* Print Preview - now matches the required label format */}
          <PrintPreview
            item={currentItem}
            settings={printSettings}
          />
          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="btn btn-success w-full"
          >
            Print Label
          </button>
        </div>
      )}
      {/* Print Modal */}
      {showPrintModal && currentItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '420px',
          height: '100vh',
          background: 'rgba(255,255,255,0.98)',
          zIndex: 1000,
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '32px 16px 16px 16px',
        }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ fontWeight: 600, fontSize: 18 }}>Print Preview</h3>
            <button onClick={() => setShowPrintModal(false)} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
          </div>
          <div id="modal-label-preview" style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
            {Array.from({ length: quantity > 0 ? quantity : 1 }).map((_, idx) => (
              <div key={idx} style={{ marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: printService.generateLabelHtml(currentItem, printSettings, 1) }} />
            ))}
          </div>
          <button
            onClick={() => {
              const printContents = document.getElementById('modal-label-preview')?.innerHTML;
              const printWindow = window.open('', '', 'width=800,height=600');
              if (!printWindow) return;
              printWindow.document.write(`
                <html>
                  <head>
                    <title>Print Label</title>
                    <style>
                      @media print {
                        body { margin: 0; }
                        .label {
                          width: 60mm !important;
                          height: 40mm !important;
                          box-sizing: border-box;
                          margin: 0 6px 16px 0;
                          background: #fff;
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          justify-content: center;
                          padding: 5px;
                          border: 1px solid #000;
                          float: left;
                        }
                      }
                      .label {
                        width: 60mm;
                        height: 40mm;
                        box-sizing: border-box;
                        margin: 0 6px 16px 0;
                        background: #fff;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 5px;
                        border: 1px solid #000;
                        float: left;
                      }
                    </style>
                  </head>
                  <body>
                    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                      ${printContents}
                    </div>
                  </body>
                </html>
              `);
              printWindow.document.close();
              printWindow.focus();
              setTimeout(() => {
                printWindow.print();
                printWindow.close();
              }, 300);
            }}
            style={{ marginTop: 16, width: '100%', background: '#22c55e', color: '#fff', fontWeight: 600, fontSize: 16, border: 'none', borderRadius: 4, padding: '10px 0', cursor: 'pointer' }}
          >
            Print
          </button>
        </div>
      )}
    </div>
  );
};
