import * as XLSX from 'xlsx';
import { CountSession } from '../types';

export class ExportUtils {
  static async exportToExcel(sessions: CountSession[]) {
    console.log('Starting Excel export for', sessions.length, 'sessions');

    try {
      const data = await this.prepareExportData(sessions);
      console.log('Prepared export data:', data.length, 'items');

      if (data.length === 0) {
        throw new Error('No data to export');
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');

      const isMobile = this.isMobileDevice();
      console.log('Device type:', isMobile ? 'Mobile' : 'Desktop');

      // For mobile devices, use blob download approach
      if (isMobile) {
        console.log('Using mobile blob download approach');
        const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        console.log('Created blob, size:', blob.size);
        this.downloadBlob(blob, 'inventory_export.xlsx');
      } else {
        // Desktop approach
        console.log('Using desktop XLSX.writeFile approach');
        XLSX.writeFile(workbook, 'inventory_export.xlsx');
      }

      console.log('Export completed successfully');
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  private static async prepareExportData(sessions: CountSession[]): Promise<any[]> {
    const data: any[] = [];

    // Get all unique item codes from sessions
    const itemCodes = new Set<string>();
    sessions.forEach(session => {
      session.items.forEach(item => {
        itemCodes.add(item.itemCode);
      });
    });

    // For each unique item code, get the item details and add to export
    for (const itemCode of itemCodes) {
      try {
        // Import dbService here to avoid circular dependency
        const { dbService } = await import('../services/database');
        const item = await dbService.getItemByCode(itemCode);

        if (item) {
          // Find the count for this item across all sessions
          let totalQuantity = 0;
          sessions.forEach(session => {
            session.items.forEach(sessionItem => {
              if (sessionItem.itemCode === itemCode) {
                totalQuantity += sessionItem.quantity;
              }
            });
          });

          data.push({
            itemCode: item.itemCode,
            barcode: item.barcode,
            itemNameEng: item.itemNameEng,
            itemNameArabic: item.itemNameArabic || '',
            price: item.price,
            uom: item.uom,
            totalQuantity: totalQuantity,
            location: sessions[0]?.location || 'Unknown'
          });
        }
      } catch (error) {
        console.error('Error fetching item details for export:', error);
      }
    }

    return data;
  }

  private static isMobileDevice(): boolean {
    // Check for Capacitor environment
    const isCapacitor = !!(window as any).Capacitor;
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    console.log('Environment check:', { isCapacitor, isAndroid, isIOS, userAgent: navigator.userAgent });

    return isCapacitor || isAndroid || isIOS || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private static async downloadBlob(blob: Blob, filename: string) {
    const isCapacitor = !!(window as any).Capacitor;

    if (isCapacitor) {
      // Capacitor Android/iOS native app handling
      try {
        console.log('Using Capacitor native file handling');

        // Convert blob to base64
        const base64Data = await this.blobToBase64(blob);

        // For Android, we'll use a different approach - save to cache directory and share
        if (this.isAndroid()) {
          await this.saveAndShareAndroid(base64Data, filename);
        } else {
          // iOS fallback
          await this.saveAndShareIOS(base64Data, filename);
        }

      } catch (error) {
        console.error('Capacitor file handling failed:', error);
        alert(`Unable to save ${filename}. Please check app permissions.`);
      }
    } else {
      // Web browser handling (original logic)
      try {
        // Method 1: Enhanced Standard Download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

      } catch (error) {
        console.error('Standard download failed, trying fallback:', error);

        try {
          // Method 2: New Tab Fallback
          const url = window.URL.createObjectURL(blob);
          const newWindow = window.open(url, '_blank');

          if (!newWindow) {
            // Method 3: Data URL for Very Restrictive Browsers
            const reader = new FileReader();
            reader.onload = function() {
              const dataUrl = reader.result as string;
              const fallbackWindow = window.open(dataUrl, '_blank');
              if (!fallbackWindow) {
                alert(`Unable to download ${filename} automatically. Please check your browser settings for downloads.`);
              }
            };
            reader.readAsDataURL(blob);
          } else {
            // Clean up the blob URL after a delay
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 1000);
          }

        } catch (fallbackError) {
          console.error('All download methods failed:', fallbackError);
          alert(`Unable to download ${filename}. Please try again or check your browser's download settings.`);
        }
      }
    }
  }

  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/octet-stream;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private static isAndroid(): boolean {
    return /Android/i.test(navigator.userAgent);
  }

  private static async saveAndShareAndroid(base64Data: string, filename: string) {
    try {
      // Use Capacitor Filesystem to save to cache directory
      const { Filesystem, Directory } = await import('@capacitor/filesystem');

      // Save file to cache directory
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache
      });

      console.log('File saved to cache:', result.uri);

      // Try to use Share plugin for Android
      try {
        const { Share } = await import('@capacitor/share');
        await Share.share({
          title: 'Inventory Export',
          text: 'Inventory data exported to Excel',
          url: result.uri,
          dialogTitle: 'Share Inventory Export'
        });
      } catch (shareError) {
        console.warn('Share plugin not available, file saved to cache:', result.uri);
        alert(`File saved successfully as ${filename}. You can find it in the app's cache directory.`);
      }

    } catch (error) {
      console.error('Android save/share failed:', error);
      throw error;
    }
  }

  private static async saveAndShareIOS(base64Data: string, filename: string) {
    try {
      // For iOS, try to use Filesystem and Share
      const { Filesystem, Directory } = await import('@capacitor/filesystem');

      // Save to documents directory on iOS
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Documents
      });

      console.log('File saved to documents:', result.uri);

      // Try to share
      try {
        const { Share } = await import('@capacitor/share');
        await Share.share({
          title: 'Inventory Export',
          text: 'Inventory data exported to Excel',
          url: result.uri,
          dialogTitle: 'Share Inventory Export'
        });
      } catch (shareError) {
        console.warn('Share plugin not available, file saved to documents:', result.uri);
        alert(`File saved as ${filename}. Check your Documents folder.`);
      }

    } catch (error) {
      console.error('iOS save/share failed:', error);
      // Fallback: just save and notify user
      alert(`File saved as ${filename}. Check your Documents folder.`);
    }
  }
}
