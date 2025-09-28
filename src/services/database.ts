import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Item, CountSession, AppSettings } from '../types';

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
  locations: {
    key: string;
    value: { id: string; name: string; createdAt: string };
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
      this.db = await openDB<AppDatabase>('shelf-inventory-db', 2, {
        upgrade(db, oldVersion, _newVersion) {
          // Version 1 stores
          if (oldVersion < 1) {
            // Create items store
            const itemsStore = db.createObjectStore('items', { keyPath: 'id' });
            itemsStore.createIndex('by-barcode', 'barcode');
            itemsStore.createIndex('by-code', 'itemCode');

            // Create count sessions store
            db.createObjectStore('countSessions', { keyPath: 'id' });

            // Create settings store
            db.createObjectStore('settings', { keyPath: 'id' });
          }

          // Version 2 additions
          if (oldVersion < 2) {
            // Create locations store
            db.createObjectStore('locations', { keyPath: 'id' });
          }
        },
      });
      // Removed auto-seed sample data for offline installations per user request
      // await this.autoSeedSampleData();
    }
    return this.db;
  }

  // Removed autoSeedSampleData method as it is no longer used per user request

  private async seedSampleData(): Promise<void> {
    const sampleItems: Item[] = [
      {
        id: '1',
        itemCode: 'BEV001',
        barcode: '6901234567890',
        itemNameEng: 'Mineral Water 500ml',
        itemNameArabic: 'مياه معدنية 500 مل',
        price: 1.50,
        uom: 'bottle',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        itemCode: 'BEV002',
        barcode: '6901234567891',
        itemNameEng: 'Apple Juice 1L',
        itemNameArabic: 'عصير تفاح 1 لتر',
        price: 3.75,
        uom: 'bottle',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        itemCode: 'SNK001',
        barcode: '6901234567892',
        itemNameEng: 'Potato Chips 150g',
        itemNameArabic: 'رقائق البطاطس 150 جرام',
        price: 2.25,
        uom: 'pack',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        itemCode: 'SNK002',
        barcode: '6901234567893',
        itemNameEng: 'Chocolate Bar 100g',
        itemNameArabic: 'شوكولاتة 100 جرام',
        price: 4.50,
        uom: 'bar',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '5',
        itemCode: 'DAI001',
        barcode: '6901234567894',
        itemNameEng: 'Fresh Milk 1L',
        itemNameArabic: 'حليب طازج 1 لتر',
        price: 5.25,
        uom: 'bottle',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '6',
        itemCode: 'DAI002',
        barcode: '6901234567895',
        itemNameEng: 'Yogurt 500g',
        itemNameArabic: 'زبادي 500 جرام',
        price: 3.25,
        uom: 'cup',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '7',
        itemCode: 'CLN001',
        barcode: '6901234567896',
        itemNameEng: 'Hand Soap 250ml',
        itemNameArabic: 'صابون اليد 250 مل',
        price: 6.75,
        uom: 'bottle',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '8',
        itemCode: 'CLN002',
        barcode: '6901234567897',
        itemNameEng: 'Laundry Detergent 2L',
        itemNameArabic: 'منظف الغسيل 2 لتر',
        price: 12.99,
        uom: 'bottle',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '9',
        itemCode: 'BKY001',
        barcode: '6901234567898',
        itemNameEng: 'White Bread 400g',
        itemNameArabic: 'خبز ابيض 400 جرام',
        price: 2.50,
        uom: 'loaf',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '10',
        itemCode: 'BKY002',
        barcode: '6901234567899',
        itemNameEng: 'Croissant Pack 6pcs',
        itemNameArabic: 'كرواسون 6 قطع',
        price: 8.25,
        uom: 'pack',
        updatedAt: new Date().toISOString(),
      }
    ];

    await this.saveItems(sampleItems);
    console.log(`Auto-seeded ${sampleItems.length} sample items for offline use`);
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

  async clearAllData() {
    const db = await this.initialize();
    const tx = db.transaction(['items', 'countSessions', 'settings', 'locations'], 'readwrite');
    await tx.db.clear('items');
    await tx.db.clear('countSessions');
    await tx.db.clear('locations');
    await tx.db.clear('settings');
    await tx.done;
    localStorage.removeItem('app-seeded-sample-data');
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

  async getTotalQuantityForItem(itemId: string): Promise<number> {
    const db = await this.initialize();
    const sessions = await db.getAll('countSessions');
    let total = 0;
    for (const session of sessions) {
      for (const item of session.items) {
        if (item.itemId === itemId) {
          total += item.quantity;
        }
      }
    }
    return total;
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

  async saveLastSyncTime(isoString: string) {
    const db = await this.initialize();
    const settings = await this.getSettings();
    await db.put('settings', { ...settings, id: 'app-settings', lastSyncTime: isoString });
  }

  async getLastSyncTime(): Promise<string | null> {
    const db = await this.initialize();
    const settings = await db.get('settings', 'app-settings');
    return settings && settings.lastSyncTime ? settings.lastSyncTime : null;
  }

  // Force seed sample data (for manual seeding)
  async forceSeedSampleData(): Promise<void> {
    try {
      await this.seedSampleData();
      localStorage.setItem('app-seeded-sample-data', 'true');
      console.log('Sample data force-seeded successfully');
    } catch (error) {
      console.error('Error force-seeding sample data:', error);
      throw error;
    }
  }

  // Check if database needs seeding
  async needsSeeding(): Promise<boolean> {
    try {
      const itemCount = await this.getItemsCount();
      return itemCount === 0;
    } catch (error) {
      console.error('Error checking if seeding needed:', error);
      return true; // Assume needs seeding if we can't check
    }
  }

  // Location methods
  async saveLocation(location: { id: string; name: string; createdAt: string }) {
    const db = await this.initialize();
    await db.put('locations', location);
  }

  async getLocations(): Promise<{ id: string; name: string; createdAt: string }[]> {
    const db = await this.initialize();
    return db.getAll('locations');
  }

  async deleteLocation(id: string) {
    const db = await this.initialize();
    await db.delete('locations', id);
  }

  async getLocationById(id: string): Promise<{ id: string; name: string; createdAt: string } | undefined> {
    const db = await this.initialize();
    return db.get('locations', id);
  }
}

export const dbService = new DatabaseService();
