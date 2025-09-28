import { Item, CountSession } from '../types';
import { dbService } from './database';

class ApiService {
  private baseUrl: string = 'http://192.168.31.57:5000'; // Hardcoded for testing against .NET API

  // setBaseUrl is now a no-op since we hardcode the baseUrl
  setBaseUrl() {}

  async downloadMasterData(): Promise<Item[]> {
    if (!this.baseUrl) {
      throw new Error('API base URL not configured');
    }

    try {
      const itemsUrl = `${this.baseUrl}/api/items`;
      const response = await fetch(itemsUrl);
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`API error ${response.status}: ${text || 'Unable to fetch items'} (${itemsUrl})`);
      }

      const items: Item[] = await response.json();
      await dbService.saveItems(items);
      return items;
    } catch (error) {
      console.error('Failed to download master data:', error);
      throw error;
    }
  }

  async uploadCountSession(session: CountSession): Promise<void> {
    if (!this.baseUrl) {
      throw new Error('API base URL not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/counts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(session),
      });

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = '[Could not read response body]';
        }
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      // Mark session as synced
      session.synced = true;
      await dbService.saveCountSession(session);
    } catch (error) {
      console.error('Failed to upload count session:', error);
      throw error;
    }
  }

  async getLastSyncTimestamp(): Promise<string> {
    // This would typically come from the server
    return new Date().toISOString();
  }
}

export const apiService = new ApiService();
