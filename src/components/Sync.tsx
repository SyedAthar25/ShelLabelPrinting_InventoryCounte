import React, { useState, useEffect } from 'react';
import { dbService } from '../services/database';
import { apiService } from '../services/api';
import { ExportUtils } from '../utils/exportUtils';

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

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const itemCount = await dbService.getItemsCount();
      const unsyncedSessions = await dbService.getUnsyncedSessions();
      const settings = await dbService.getSettings();
      
      setSyncStatus(prev => ({
        ...prev,
        itemCount,
        pendingSessions: unsyncedSessions.length,
        lastSync: settings.apiBaseUrl ? 'Unknown' : 'Not configured',
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
      const settings = await dbService.getSettings();
      if (!settings.apiBaseUrl) {
        throw new Error('API base URL not configured. Please set it in Settings.');
      }

      apiService.setBaseUrl(settings.apiBaseUrl);
      const items = await apiService.downloadMasterData();
      
      setSuccess(`Downloaded ${items.length} items successfully!`);
      setSyncStatus(prev => ({
        ...prev,
        itemCount: items.length,
        lastSync: new Date().toLocaleString(),
        status: 'success',
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      setError(errorMessage);
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

      apiService.setBaseUrl(settings.apiBaseUrl);
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

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Data Sync</h2>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{syncStatus.itemCount}</div>
          <div className="text-gray-600">Items in Database</div>
        </div>

        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-600">{syncStatus.pendingSessions}</div>
          <div className="text-gray-600">Pending Sync Sessions</div>
        </div>

        <div className="card text-center">
          <div className="text-sm text-gray-600">Last Sync</div>
          <div className="text-lg font-semibold">{syncStatus.lastSync}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Master Data</h3>
          <p className="text-gray-600 mb-4">
            Download the latest item master data from the server.
          </p>
          <button
            onClick={handleDownloadMaster}
            disabled={isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? 'Downloading...' : 'Download Master Data'}
          </button>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Count Sessions</h3>
          <p className="text-gray-600 mb-4">
            Upload pending count sessions to the server.
          </p>
          <button
            onClick={handleUploadCounts}
            disabled={isLoading || syncStatus.pendingSessions === 0}
            className="btn btn-success w-full mb-2"
          >
            {isLoading ? 'Syncing...' : `Sync ${syncStatus.pendingSessions} Sessions`}
          </button>
          
          <button
            onClick={handleExportAll}
            className="btn btn-warning w-full"
          >
            Export All to Excel
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* Help Text */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-2">Sync Instructions</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Ensure API base URL is configured in Settings</li>
          <li>• Download master data before starting inventory count</li>
          <li>• Sync count sessions regularly to avoid data loss</li>
          <li>• Use Export feature for offline backup</li>
        </ul>
      </div>
    </div>
  );
};
