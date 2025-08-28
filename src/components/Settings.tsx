import React, { useState, useEffect } from 'react';
import { AppSettings, PrintSettings } from '../types';
import { dbService } from '../services/database';
import { apiService } from '../services/api';
import { MobileBluetoothPrinterService } from '../services/mobileBluetoothPrinter';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    apiBaseUrl: '',
    defaultPrintSettings: {
      includeBarcode: true,
      includePrice: true,
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bluetoothInfo, setBluetoothInfo] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    // Load Bluetooth information
    const info = MobileBluetoothPrinterService.getDeviceInfo();
    setBluetoothInfo(info);
  }, []);

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
      apiService.setBaseUrl(settings.apiBaseUrl);
      
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
      },
    });
    setError('');
    setSuccess('');
  };

  const handlePrintSettingChange = (key: keyof PrintSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      defaultPrintSettings: {
        ...prev.defaultPrintSettings,
        [key]: value,
      },
    }));
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
    }
  ];

  return (
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

      {/* Database Management */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-800 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Database Management
        </h3>
        <button
          onClick={async () => {
            if (confirm('Clear all local data? This cannot be undone.')) {
              // This would clear the database - implementation would need to be added
              alert('Database cleared (functionality to be implemented)');
            }
          }}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Clear Local Data
        </button>
        <p className="text-xs text-red-700 mt-2">
          Warning: This will remove all items and count sessions from your device.
        </p>
      </div>
    </div>
  );
};
