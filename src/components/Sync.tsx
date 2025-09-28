import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';
import { apiService } from '../services/api';
import { ExportUtils } from '../utils/exportUtils';
import { ExcelImportService } from '../services/excelImport';

export const Sync: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState({
    lastSync: 'Never',
    itemCount: 0,
    pendingSessions: 0,
    status: 'idle' as 'idle' | 'syncing' | 'error' | 'success',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastSync, setLastSync] = useState<string>('Unknown');
  const [importResult, setImportResult] = useState<{ success: number; errors: string[]; updated: number } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadStatus();
    // Listen for sync-updated event
    const handler = () => loadStatus();
    window.addEventListener('sync-updated', handler);
    return () => window.removeEventListener('sync-updated', handler);
  }, []);

  const loadStatus = async () => {
    try {
      const itemCount = await dbService.getItemsCount();
      const unsyncedSessions = await dbService.getUnsyncedSessions();
      const settings = await dbService.getSettings();
      const lastSyncTime = await dbService.getLastSyncTime();
      setLastSync(lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never');
      setSyncStatus(prev => ({
        ...prev,
        itemCount,
        pendingSessions: unsyncedSessions.length,
        lastSync: settings.apiBaseUrl ? (lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never') : 'Not configured',
      }));
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const handleDownloadMaster = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const items = await apiService.downloadMasterData();
      
      setSuccess(`Downloaded ${items.length} items successfully!`);
      setSyncStatus(prev => ({
        ...prev,
        itemCount: items.length,
        lastSync: new Date().toLocaleString(),
        status: 'success',
      }));
    } catch (error) {
      let errorMessage = 'Download failed. Please check your connection and try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'toString' in error) {
        errorMessage = error.toString();
      }
      setError(errorMessage);
      console.error('Download error:', error);
      alert('Download failed: ' + errorMessage);
      setSyncStatus(prev => ({ ...prev, status: 'error' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadCounts = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const settings = await dbService.getSettings();
      if (!settings.apiBaseUrl) {
        throw new Error('API base URL not configured');
      }

      apiService.setBaseUrl();
      const unsyncedSessions = await dbService.getUnsyncedSessions();
      if (unsyncedSessions.length === 0) {
        setSuccess('No pending counts to sync');
        return;
      }

      let successCount = 0;
      for (const session of unsyncedSessions) {
        try {
          await apiService.uploadCountSession(session);
          successCount++;
        } catch (error) {
          console.error(`Failed to sync session ${session.id}:`, error);
        }
      }

      if (successCount > 0) {
        setSuccess(`Synced ${successCount} count session(s) successfully!`);
      } else {
        setError('All sync attempts failed');
      }

      await loadStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAll = async () => {
    try {
      const allSessions = await dbService.getCountSessions();
      if (allSessions.length === 0) {
        setError('No count sessions to export');
        return;
      }

      ExportUtils.exportToExcel(allSessions);
      setSuccess('Exported all sessions to Excel successfully!');
    } catch (error) {
      setError('Export failed');
      console.error('Export error:', error);
    }
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
    setSuccess('');
    setImportResult(null);

    try {
      const result = await ExcelImportService.importItemsFromExcel(file);
      setImportResult(result);

      if (result.success > 0) {
        setSuccess(`Successfully imported ${result.success} items`);
        // Refresh status to show updated item count
        await loadStatus();
      }

      if (result.errors.length > 0) {
        setError(`${result.errors.length} errors occurred during import. Check details below.`);
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

  const statusCards = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
      title: 'Items in Database',
      value: syncStatus.itemCount,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Pending Sessions',
      value: syncStatus.pendingSessions,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Last Sync',
      value: syncStatus.lastSync,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <div className="p-3 max-w-md mx-auto">
      {/* Simple Header */}
      <div className="bg-blue-600 text-white px-3 py-2 rounded-lg mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <h1 className="text-lg font-semibold">Data Sync</h1>
      </div>

      {/* Status Cards */}
      <div className="space-y-2 mb-4">
        {statusCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 ${card.bgColor} rounded-lg flex items-center justify-center mr-2`}>
                  <div className={card.color}>
                    {card.icon}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">{card.title}</div>
                  <div className="text-lg font-bold text-gray-800">{card.title === 'Last Sync' ? lastSync : card.value}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sync Options Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {/* Master Data Download */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <div className="font-semibold text-sm text-blue-600 mb-1">Download Master</div>
          <div className="text-xs text-gray-500 mb-2">Get latest items</div>
          <button
            onClick={handleDownloadMaster}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-medium py-1 px-2 rounded transition-colors duration-200"
          >
            {isLoading ? 'Downloading...' : 'Download'}
          </button>
        </div>

        {/* Count Sessions Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="font-semibold text-sm text-green-600 mb-1">Upload Counts</div>
          <div className="text-xs text-gray-500 mb-2">Sync sessions</div>
          <button
            onClick={handleUploadCounts}
            disabled={isLoading || syncStatus.pendingSessions === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-medium py-1 px-2 rounded transition-colors duration-200"
          >
            {isLoading ? 'Syncing...' : `Sync (${syncStatus.pendingSessions})`}
          </button>
        </div>

        {/* Excel Import */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="font-semibold text-sm text-purple-600 mb-1">Import Excel</div>
          <div className="text-xs text-gray-500 mb-2">Add items</div>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelImport}
            disabled={isImporting}
            className="hidden"
            id="excel-import-sync"
          />
          <label
            htmlFor="excel-import-sync"
            className="block w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs font-medium py-1 px-2 rounded transition-colors duration-200 text-center cursor-pointer"
          >
            {isImporting ? 'Importing...' : 'Import'}
          </label>
        </div>

        {/* Export All */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="font-semibold text-sm text-orange-600 mb-1">Export Data</div>
          <div className="text-xs text-gray-500 mb-2">To Excel file</div>
          <button
            onClick={handleExportAll}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium py-1 px-2 rounded transition-colors duration-200"
          >
            Export
          </button>
        </div>

        {/* Settings Link */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="font-semibold text-sm text-purple-600 mb-1">Configure</div>
          <div className="text-xs text-gray-500 mb-2">API settings</div>
          <a
            href="/settings"
            className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium py-1 px-2 rounded transition-colors duration-200 text-center"
          >
            Settings
          </a>
        </div>
      </div>

      {/* Excel Import Section */}
      {(isImporting || importResult) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-gray-800">Excel Import</h4>
            <button
              onClick={handleDownloadTemplate}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
            >
              Template
            </button>
          </div>

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
            <div className="mt-2">
              <div className="text-sm text-green-600">✓ {importResult.success} items processed successfully</div>
              {importResult.updated > 0 && (
                <div className="text-sm text-blue-600">🔄 {importResult.updated} items updated</div>
              )}
              {importResult.errors.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm text-red-600">⚠ {importResult.errors.length} errors:</div>
                  <div className="mt-1 max-h-20 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-600">• {error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center text-sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Sync Instructions
        </h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Configure API URL in Settings first</li>
          <li>• Download master data before counting</li>
          <li>• Sync count sessions regularly</li>
          <li>• Use Export for offline backup</li>
        </ul>
      </div>
    </div>
  );
};
