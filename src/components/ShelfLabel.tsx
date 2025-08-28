import React, { useState, useEffect, useRef } from 'react';
import { Item, PrintSettings } from '../types';
import { dbService } from '../services/database';
import { printService } from '../services/printService';
import { BarcodeScanner } from './BarcodeScanner';
import { PrintPreview } from './PrintPreview';
import { SearchSuggestions } from './SearchSuggestions';
import { bluetoothPrinterService, BluetoothPrinterService } from '../services/bluetoothPrinter';
import { BluetoothConnect } from './BluetoothConnect';
import { MobileBluetoothConnect } from './MobileBluetoothConnect';
import { MobileBluetoothPrinterService, mobileBluetoothPrinterService } from '../services/mobileBluetoothPrinter';
import { useNavigate } from 'react-router-dom';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const [showScanner, setShowScanner] = useState(true);
  const [btStatus, setBtStatus] = useState<string>('');

  const printRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Detect mobile
  const isMobile = () =>
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    loadDefaultSettings();
  }, []);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const loadDefaultSettings = async () => {
    try {
      const settings = await dbService.getSettings();
      setPrintSettings(settings.defaultPrintSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
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
    setError('');
    setShowScanner(false);
    handleSearch(barcode);
  };

  // ✅ Mobile PDF export
  const handleMobilePDF = async () => {
    if (!printRef.current) return;

    const canvas = await html2canvas(printRef.current, {
      backgroundColor: "#fff",
      scale: 2,
    });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [60, 40], // 60x40mm = 4x6 cm
    });

    pdf.addImage(imgData, "PNG", 0, 0, 60, 40);

    // Handle quantity > 1
    for (let i = 1; i < (quantity > 0 ? quantity : 1); i++) {
      pdf.addPage([60, 40], "landscape");
      pdf.addImage(imgData, "PNG", 0, 0, 60, 40);
    }

    pdf.save("label.pdf"); // triggers download
  };

  // ✅ Unified print handler
  const handleDirectPrint = async () => {
    if (!currentItem) return;

    if (isMobile()) {
      await handleMobilePDF();
      return;
    }

    // Desktop flow
    const labelHtml = Array.from({ length: quantity > 0 ? quantity : 1 })
      .map(() =>
        printService.generateLabelHtml(currentItem, printSettings, quantity)
      )
      .join('');

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
          </style>
        </head>
        <body>
          <div style="display:flex; flex-wrap:wrap; gap:12px;">
            ${labelHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow?.print();
      printWindow?.close();
    }, 300);
  };

  // Bluetooth
  const handleBtConnect = async (event: React.MouseEvent) => {
    // Ensure this is triggered by a user gesture
    event.preventDefault();
    event.stopPropagation();
    
    try {
      setBtStatus('Searching for Bluetooth devices...');
      console.log('User clicked BT Connect button');
      
      // Add a small delay to ensure the user gesture is properly registered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await bluetoothPrinterService.connect();
      const deviceInfo = bluetoothPrinterService.getDeviceInfo();
      setBtStatus(`Connected to ${deviceInfo}`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Bluetooth connect failed';
      setBtStatus(`Connection failed: ${errorMessage}`);
      console.error('Bluetooth connection error:', e);
    }
  };

  const handleBtPrint = async () => {
    if (!currentItem) return;
    try {
      const isMobile = MobileBluetoothPrinterService.isMobileDevice();
      const service = isMobile ? mobileBluetoothPrinterService : bluetoothPrinterService;
      
      if (!service.isConnected()) {
        setBtStatus('Connecting to printer...');
        await service.connect();
      }
      setBtStatus('Printing...');
      await service.printSimpleLabel({
        title: currentItem.itemNameEng,
        arabic: currentItem.itemNameArabic || undefined,
        barcode: printSettings.includeBarcode ? currentItem.barcode : undefined,
        price: printSettings.includePrice ? currentItem.price.toFixed(2) : undefined,
      });
      setBtStatus('Successfully printed via Bluetooth');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Bluetooth print failed';
      setBtStatus(`Print failed: ${errorMessage}`);
      console.error('Bluetooth print error:', e);
    }
  };

  const handleRefresh = () => {
    setSearchInput('');
    setShowSuggestions(false);
    setCurrentItem(null);
    setError('');
    setQuantity(1);
    setShowScanner(true);
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-6 gap-2">
        <h2 className="text-2xl font-bold m-0">Shelf Label Printing</h2>
        <button onClick={handleRefresh} className="p-2 ml-2 text-blue-600 hover:text-blue-800 focus:outline-none" title="Refresh">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Search */}
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
              setError('');
              setQuantity(1);
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
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
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

      {showScanner && (
        <details className="mb-2">
          <summary className="cursor-pointer font-semibold text-blue-600">Use Camera Scanner</summary>
          <div className="mt-1">
            <BarcodeScanner onBarcodeDetected={handleBarcodeDetected} onError={setError} isVisible={showScanner} />
          </div>
        </details>
      )}

      {!showScanner && (
        <div className="mb-2">
          <button onClick={() => setShowScanner(true)} className="btn btn-secondary text-sm">
            Scan Another Item
          </button>
        </div>
      )}

      {error && <div className="error-message mb-2">{error}</div>}

      {currentItem && (
        <div className="flex flex-col items-center w-full">
          <div className="flex flex-wrap items-center gap-4 w-full mb-2" style={{ fontSize: 15, maxWidth: 420 }}>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={printSettings.includeBarcode}
                onChange={(e) => setPrintSettings(prev => ({ ...prev, includeBarcode: e.target.checked }))}
                className="form-checkbox"
              />
              <span className="ml-1">Barcode</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={printSettings.includePrice}
                onChange={(e) => setPrintSettings(prev => ({ ...prev, includePrice: e.target.checked }))}
                className="form-checkbox"
              />
              <span className="ml-1">Price</span>
            </label>
            <label className="flex items-center">
              <span className="mr-1">Qty</span>
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
                style={{ fontSize: 15, padding: '2px 6px', height: 28, width: 60 }}
              />
            </label>
          </div>

          {/* ✅ PrintPreview wrapped for capture */}
          <div className="mb-2" ref={printRef}>
            <PrintPreview item={currentItem} settings={printSettings} />
          </div>

          <div className="flex gap-2 w-full justify-center mb-1">
            <button onClick={handleDirectPrint} className="btn btn-success">Print</button>
          </div>
          
          {MobileBluetoothPrinterService.isMobileDevice() ? (
            <MobileBluetoothConnect 
              onConnectionChange={(connected) => {
                if (!connected) {
                  setBtStatus('Disconnected');
                }
              }}
              onError={(error) => {
                setBtStatus(`Error: ${error}`);
              }}
              onPrint={() => {
                setBtStatus('Print successful via mobile Bluetooth');
              }}
            />
          ) : (
            <BluetoothConnect 
              onConnectionChange={(connected) => {
                if (!connected) {
                  setBtStatus('Disconnected');
                }
              }}
              onError={(error) => {
                setBtStatus(`Error: ${error}`);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
