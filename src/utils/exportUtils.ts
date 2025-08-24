import * as XLSX from 'xlsx';
import { CountSession } from '../types';

export class ExportUtils {
  static exportToExcel(sessions: CountSession[]) {
    const data = this.prepareExportData(sessions);
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Counts');
    
    XLSX.writeFile(workbook, 'inventory_counts.xlsx');
  }

  private static prepareExportData(sessions: CountSession[]): any[] {
    const data: any[] = [];
    
    sessions.forEach(session => {
      session.items.forEach(item => {
        data.push({
          'Session Date': session.date,
          'Item Code': item.itemCode,
          'Item Name': item.itemName,
          'Quantity': item.quantity,
          'Timestamp': item.timestamp,
          'Synced': session.synced ? 'Yes' : 'No'
        });
      });
    });

    return data;
  }
}
