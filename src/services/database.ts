import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Item, CountSession, AppSettings, PrintSettings } from '../types';

interface AppDatabase extends DBSchema {
  items: {
    key: string;
    value: Item;
    indexes: { 'by-barcode': string; 'by-code': string };
  };
  countSessions: {
    key: string;
    value: CountSession;
  };
  settings: {
    key: string;
    value: AppSettings & { id: string };
  };
}

class DatabaseService {
  private db: IDBPDatabase<AppDatabase> | null = null;

  async initialize(): Promise<IDBPDatabase<AppDatabase>> {
    if (!this.db) {
      this.db = await openDB<AppDatabase>('shelf-inventory-db', 1, {
        upgrade(db) {
          // Create items store
          const itemsStore = db.createObjectStore('items', { keyPath: 'id' });
          itemsStore.createIndex('by-barcode', 'barcode');
          itemsStore.createIndex('by-code', 'itemCode');

          // Create count sessions store
          db.createObjectStore('countSessions', { keyPath: 'id' });

          // Create settings store
          db.createObjectStore('settings', { keyPath: 'id' });
        },
      });
    }
    return this.db;
  }

  // Item methods
  async saveItems(items: Item[]) {
    const db = await this.initialize();
    const tx = db.transaction('items', 'readwrite');
    for (const item of items) {
      await tx.store.put(item);
    }
    await tx.done;
  }

  async getItemByBarcode(barcode: string): Promise<Item | undefined> {
    const db = await this.initialize();
    return db.getFromIndex('items', 'by-barcode', barcode);
  }

  async getItemByCode(code: string): Promise<Item | undefined> {
    const db = await this.initialize();
    return db.getFromIndex('items', 'by-code', code);
  }

  async getAllItems(): Promise<Item[]> {
    const db = await this.initialize();
    return db.getAll('items');
  }

  async getItemsCount(): Promise<number> {
    const db = await this.initialize();
    return db.count('items');
  }

  async searchItems(query: string): Promise<Item[]> {
    const db = await this.initialize();
    const allItems = await db.getAll('items');
    
    return allItems.filter(item => 
      item.itemCode.toLowerCase().includes(query.toLowerCase()) ||
      item.barcode.includes(query) ||
      item.itemNameEng.toLowerCase().includes(query.toLowerCase()) ||
      (item.itemNameArabic && item.itemNameArabic.includes(query))
    );
  }

  // Count session methods
  async saveCountSession(session: CountSession) {
    const db = await this.initialize();
    await db.put('countSessions', session);
  }

  async getCountSessions(): Promise<CountSession[]> {
    const db = await this.initialize();
    return db.getAll('countSessions');
  }

  async getUnsyncedSessions(): Promise<CountSession[]> {
    const db = await this.initialize();
    const sessions = await db.getAll('countSessions');
    return sessions.filter(session => !session.synced);
  }

  // Settings methods
  async saveSettings(settings: AppSettings) {
    const db = await this.initialize();
    await db.put('settings', { ...settings, id: 'app-settings' });
  }

  async getSettings(): Promise<AppSettings> {
    const db = await this.initialize();
    const settings = await db.get('settings', 'app-settings');
    if (settings) {
      const { id, ...rest } = settings;
      return rest;
    }
    return {
      apiBaseUrl: '',
      defaultPrintSettings: { includeBarcode: true, includePrice: true },
    };
  }
}

export const dbService = new DatabaseService();
