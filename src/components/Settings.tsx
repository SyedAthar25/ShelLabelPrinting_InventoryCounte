import { useState, useEffect } from 'react';
import { AppSettings, PrintSettings } from '../types';
import { dbService } from '../services/database';
import { apiService } from '../services/api';
import { MobileBluetoothPrinterService } from '../services/mobileBluetoothPrinter';
import { ExcelImportService } from '../services/excelImport';
import TestDataButton from './TestDataButton';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    apiBaseUrl: '',
    defaultPrintSettings: {
      includeBarcode: true,
      includePrice: true,
      labelScale: 1.0,
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bluetoothInfo, setBluetoothInfo] = useState<any>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [daysRemaining, setDaysRemaining] = useState<number>(10);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[]; updated: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [locations, setLocations] = useState<{ id: string; name: string; createdAt: string }[]>([]);
  const [newLocationName, setNewLocationName] = useState('');

  // Utility functions for expiration tracking
  const getInstallationDate = (): Date => {
    const stored = localStorage.getItem('app_installation_date');
    if (stored) {
      return new Date(stored);
    }
    // First time - set current date as installation date
    const now = new Date();
    localStorage.setItem('app_installation_date', now.toISOString());
    return now;
  };

  const calculateDaysRemaining = (): number => {
    const installationDate = getInstallationDate();
    const expirationDate = new Date(installationDate);
    expirationDate.setDate(expirationDate.getDate() + 10); // 10 days trial

    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays); // Don't go negative
  };

  useEffect(() => {
    // Calculate days remaining
    setDaysRemaining(calculateDaysRemaining());

    // Password protection: only ask once per session
    if (sessionStorage.getItem('settings_authenticated') !== 'true') {
      setShowPasswordModal(true);
    }
    loadSettings();
    loadLocations();
    // Load Bluetooth information
    const info = MobileBluetoothPrinterService.getDeviceInfo();
    setBluetoothInfo(info);
  }, []);

  const loadLocations = async () => {
    try {
      const locs = await dbService.getLocations();
      setLocations(locs);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'A1YAC@4321') {
      sessionStorage.setItem('settings_authenticated', 'true');
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password.');
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await dbService.getSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate API URL
      if (settings.apiBaseUrl) {
        try {
          const url = new URL(settings.apiBaseUrl);
          if (!url.protocol.startsWith('http')) {
            throw new Error('URL must start with http:// or https://');
          }
        } catch {
          throw new Error('Please enter a valid URL');
        }
      }

      await dbService.saveSettings(settings);
      apiService.setBaseUrl();
      
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      apiBaseUrl: '',
      defaultPrintSettings: {
        includeBarcode: true,
        includePrice: true,
        labelScale: 1.0,
      },
    });
    setError('');
    setSuccess('');
  };

  const handlePrintSettingChange = (key: keyof PrintSettings, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      defaultPrintSettings: {
        ...prev.defaultPrintSettings,
        [key]: value,
      },
    }));
  };

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    setIsImporting(true);
    setError('');
    setImportResult(null);

    try {
      const result = await ExcelImportService.importItemsFromExcel(file);
      setImportResult(result);

      if (result.success > 0) {
        setSuccess(`Successfully imported ${result.success} items`);
      }

      if (result.errors.length > 0) {
        setError(`${result.errors.length} errors occurred during import. Check the import results below.`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsImporting(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    ExcelImportService.downloadTemplate();
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) {
      setError('Please enter a location name');
      return;
    }

    const locationId = `loc_${Date.now()}`;
    const newLocation = {
      id: locationId,
      name: newLocationName.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      await dbService.saveLocation(newLocation);
      setLocations(prev => [...prev, newLocation]);
      setNewLocationName('');
      setSuccess(`Location "${newLocation.name}" added successfully`);
    } catch (error) {
      setError('Failed to add location');
      console.error('Error adding location:', error);
    }
  };

  const handleDeleteLocation = async (locationId: string, locationName: string) => {
    if (!confirm(`Are you sure you want to delete location "${locationName}"?`)) {
      return;
    }

    try {
      await dbService.deleteLocation(locationId);
      setLocations(prev => prev.filter(loc => loc.id !== locationId));
      setSuccess(`Location "${locationName}" deleted successfully`);
    } catch (error) {
      setError('Failed to delete location');
      console.error('Error deleting location:', error);
    }
  };

  const settingSections = [
    {
      title: 'API Configuration',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      content: (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label>
            <input
              type="url"
              value={settings.apiBaseUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, apiBaseUrl: e.target.value }))}
              placeholder="https://your-api-server.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the base URL of your API server
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Print Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      ),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Include Barcode</div>
              <div className="text-xs text-gray-500">Show barcode on labels by default</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultPrintSettings.includeBarcode}
                onChange={(e) => handlePrintSettingChange('includeBarcode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Include Price</div>
              <div className="text-xs text-gray-500">Show price on labels by default</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultPrintSettings.includePrice}
                onChange={(e) => handlePrintSettingChange('includePrice', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Label Scale Settings */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Label Scale Settings</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scale Factor</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.defaultPrintSettings.labelScale || 1.0}
                    onChange={(e) => handlePrintSettingChange('labelScale', parseFloat(e.target.value) || 1.0)}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
                    {(settings.defaultPrintSettings.labelScale || 1.0).toFixed(1)}x
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Adjust the overall size of the entire label. 1.0x = normal size, 0.5x = half size, 2.0x = double size
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Printer Configuration',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      content: (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Printer Name (optional)</label>
            <input
              type="text"
              value={settings.printerName || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, printerName: e.target.value }))}
              placeholder="Enter printer name if needed"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Specify printer name for direct printing
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Bluetooth Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      content: (
        <div className="space-y-3">
          {bluetoothInfo && (
            <>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Device Information</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Browser:</strong> {bluetoothInfo.browser}</div>
                  <div><strong>Platform:</strong> {bluetoothInfo.platform}</div>
                  <div><strong>Mobile:</strong> {bluetoothInfo.isMobile ? 'Yes' : 'No'}</div>
                  <div><strong>Bluetooth:</strong> {bluetoothInfo.hasBluetooth ? 'Supported' : 'Not Supported'}</div>
                  <div><strong>Secure Context:</strong> {bluetoothInfo.isSecure ? 'Yes' : 'No'}</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Bluetooth Status</div>
                <div className="text-xs text-gray-600">
                  {MobileBluetoothPrinterService.getBluetoothStatus()}
                </div>
              </div>

              {bluetoothInfo.platform === 'iOS' && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800 mb-1">iOS Limitation</div>
                  <div className="text-xs text-yellow-700">
                    Web Bluetooth is not supported on iOS. Please use an Android device for Bluetooth printing.
                  </div>
                </div>
              )}

              {!bluetoothInfo.isSecure && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <div className="text-sm font-medium text-red-800 mb-1">HTTPS Required</div>
                  <div className="text-xs text-red-700">
                    Bluetooth requires a secure context (HTTPS). Please access the app via HTTPS.
                  </div>
                </div>
              )}

              {bluetoothInfo.hasBluetooth && bluetoothInfo.isSecure && bluetoothInfo.platform !== 'iOS' && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <div className="text-sm font-medium text-green-800 mb-1">Bluetooth Ready</div>
                  <div className="text-xs text-green-700">
                    Your device supports Web Bluetooth and is ready for printing.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )
    },
    {
      title: 'Sync & Import',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v6m0 0l3-3m-3 3l-3-3" />
        </svg>
      ),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      content: (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Import Items from Excel</label>
            <div className="flex gap-2 mb-2">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelImport}
                disabled={isImporting}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Template
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Upload an Excel file with columns: itemCode, barcode, itemNameEng, itemNameArabic, price, uom
            </p>

            {isImporting && (
              <div className="flex items-center text-sm text-blue-600">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Importing items...
              </div>
            )}

            {importResult && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Import Results:</div>
                <div className="text-sm text-green-600">✓ {importResult.success} items processed successfully</div>
                {importResult.updated > 0 && (
                  <div className="text-sm text-blue-600">🔄 {importResult.updated} items updated</div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-red-600">⚠ {importResult.errors.length} errors:</div>
                    <div className="mt-1 max-h-32 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-600">• {error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: 'Location Management',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      content: (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add New Location</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="Enter location name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
              />
              <button
                onClick={handleAddLocation}
                disabled={!newLocationName.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Add
              </button>
            </div>
          </div>

          {locations.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Locations ({locations.length})</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{location.name}</div>
                      <div className="text-xs text-gray-500">
                        Added: {new Date(location.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteLocation(location.id, location.name)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete location"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'License Status',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: daysRemaining > 5 ? 'text-green-600' : daysRemaining > 0 ? 'text-yellow-600' : 'text-red-600',
      bgColor: daysRemaining > 5 ? 'bg-green-50' : daysRemaining > 0 ? 'bg-yellow-50' : 'bg-red-50',
      content: (
        <div className="space-y-3">
          <div className={`p-3 rounded-lg ${daysRemaining > 5 ? 'bg-green-50 border border-green-200' : daysRemaining > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-sm font-medium ${daysRemaining > 5 ? 'text-green-800' : daysRemaining > 0 ? 'text-yellow-800' : 'text-red-800'}`}>
                  Trial Period
                </div>
                <div className="text-xs text-gray-600">
                  {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Trial expired'}
                </div>
              </div>
              <div className={`text-2xl font-bold ${daysRemaining > 5 ? 'text-green-600' : daysRemaining > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                {daysRemaining}
              </div>
            </div>
            {daysRemaining <= 3 && daysRemaining > 0 && (
              <div className="mt-2 text-xs text-yellow-700">
                ⚠️ Your trial is expiring soon. Please contact support to extend your license.
              </div>
            )}
            {daysRemaining === 0 && (
              <div className="mt-2 text-xs text-red-700">
                ❌ Your trial has expired. Please contact support to continue using the application.
              </div>
            )}
          </div>
        </div>
      )
    }
  ];

  return (
    <>
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <form onSubmit={handlePasswordSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-xs w-full">
            <h2 className="text-lg font-semibold mb-4">Enter Settings Password</h2>
            <input
              type="password"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              className="form-input w-full mb-2"
              placeholder="Password"
              autoFocus
            />
            {passwordError && <div className="text-red-600 text-sm mb-2">{passwordError}</div>}
            <button type="submit" className="btn btn-primary w-full">Submit</button>
          </form>
        </div>
      )}
      {!showPasswordModal && (
        <div className="p-4 max-w-md mx-auto">
          {/* Simple Header */}
          <div className="bg-blue-600 text-white px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
          {/* Settings Sections */}
          <div className="space-y-4 mb-6">
            {settingSections.map((section, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center mb-4">
                  <div className={`w-10 h-10 ${section.bgColor} rounded-lg flex items-center justify-center mr-3`}>
                    <div className={section.color}>
                      {section.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800">{section.title}</h3>
                </div>
                {section.content}
              </div>
            ))}
          </div>
          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
              >
                Reset
              </button>
            </div>
          </div>
          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-green-800">{success}</span>
              </div>
            </div>
          )}
          {/* App Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              App Information
            </h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>Version:</strong> 1.0.0</div>
              <div><strong>Built with:</strong> React, TypeScript, IndexedDB</div>
              <div><strong>Storage:</strong> Local database for offline use</div>
              <div><strong>Features:</strong> Barcode scanning, Label printing, Inventory counting</div>
            </div>
          </div>
          {/* Test Data Management */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-yellow-800 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Test Data Management
          </h3>
          <TestDataButton />
          <p className="text-xs text-yellow-700 mt-2">
            Add sample items for testing the application functionality.
          </p>
        </div>
      </div>
    )}
    </>
  );
};
