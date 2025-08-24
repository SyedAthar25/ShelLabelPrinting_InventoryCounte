import React, { useState, useEffect } from 'react';
import { AppSettings, PrintSettings } from '../types';
import { dbService } from '../services/database';
import { apiService } from '../services/api';

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

  useEffect(() => {
    loadSettings();
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

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
        
        <div className="form-group">
          <label className="form-label">API Base URL:</label>
          <input
            type="url"
            value={settings.apiBaseUrl}
            onChange={(e) => setSettings(prev => ({ ...prev, apiBaseUrl: e.target.value }))}
            placeholder="https://your-api-server.com"
            className="form-input"
          />
          <div className="text-sm text-gray-600 mt-1">
            Enter the base URL of your API server (e.g., https://api.example.com)
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4 mt-6">Default Print Settings</h3>
        
        <div className="form-group">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.defaultPrintSettings.includeBarcode}
              onChange={(e) => handlePrintSettingChange('includeBarcode', e.target.checked)}
              className="form-checkbox"
            />
            <span className="ml-2">Include Barcode by default</span>
          </label>
        </div>

        <div className="form-group">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.defaultPrintSettings.includePrice}
              onChange={(e) => handlePrintSettingChange('includePrice', e.target.checked)}
              className="form-checkbox"
            />
            <span className="ml-2">Include Price by default</span>
          </label>
        </div>

        <h3 className="text-lg font-semibold mb-4 mt-6">Printer Configuration</h3>
        
        <div className="form-group">
          <label className="form-label">Printer Name (optional):</label>
          <input
            type="text"
            value={settings.printerName || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, printerName: e.target.value }))}
            placeholder="Enter printer name if needed"
            className="form-input"
          />
          <div className="text-sm text-gray-600 mt-1">
            Specify printer name for direct printing (if supported)
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="btn btn-primary flex-1"
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            onClick={handleReset}
            className="btn btn-secondary"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="error-message mt-4">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message mt-4">
          {success}
        </div>
      )}

      {/* App Information */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-4">App Information</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <div><strong>Version:</strong> 1.0.0</div>
          <div><strong>Built with:</strong> React, TypeScript, IndexedDB</div>
          <div><strong>Storage:</strong> Local database for offline use</div>
          <div><strong>Features:</strong> Barcode scanning, Label printing, Inventory counting</div>
        </div>
      </div>

      {/* Database Management */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-4">Database Management</h3>
        <div className="space-y-2">
          <button
            onClick={async () => {
              if (confirm('Clear all local data? This cannot be undone.')) {
                // This would clear the database - implementation would need to be added
                alert('Database cleared (functionality to be implemented)');
              }
            }}
            className="btn btn-danger w-full"
          >
            Clear Local Data
          </button>
          <div className="text-sm text-gray-600">
            Warning: This will remove all items and count sessions from your device.
          </div>
        </div>
      </div>
    </div>
  );
};
