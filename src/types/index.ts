export interface Item {
    id: string;
    itemCode: string;
    barcode: string;
    itemNameEng: string;
    itemNameArabic: string;
    price: number;
    uom: string;
    updatedAt: string;
  }
  
  export interface PrintSettings {
    includeBarcode: boolean;
    includePrice: boolean;
    labelScale?: number; // Overall scale factor for the entire label (0.5 to 2.0)
  }
  
  export interface CountSession {
    id: string;
    date: string;
    location?: string;
    items: CountItem[];
    synced: boolean;
    completed?: boolean;
  }
  
  export interface CountItem {
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    timestamp: string;
  }
  
  export interface AppSettings {
    apiBaseUrl: string;
    defaultPrintSettings: PrintSettings;
    printerName?: string;
    lastSyncTime?: string;
  }
  
  export interface SyncStatus {
    lastSync: string;
    itemCount: number;
    pendingCounts: number;
    status: 'idle' | 'syncing' | 'error' | 'success';
  }
  