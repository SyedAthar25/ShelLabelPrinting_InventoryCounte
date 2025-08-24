import { Item, CountSession } from '../types';
import { dbService } from './database';

class ApiService {
  private baseUrl: string = '';

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  async downloadMasterData(): Promise<Item[]> {
    if (!this.baseUrl) {
      throw new Error('API base URL not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/items`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
        throw new Error(`HTTP error! status: ${response.status}`);
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
