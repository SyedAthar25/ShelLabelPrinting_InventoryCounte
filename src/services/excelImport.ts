import * as XLSX from 'xlsx';
import { Item } from '../types';
import { dbService } from './database';

export class ExcelImportService {
  static async importItemsFromExcel(file: File): Promise<{ success: number; errors: string[]; updated: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // Assume first sheet contains the data
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const items: Item[] = [];
          const itemsToUpdate: Item[] = [];
          const errors: string[] = [];
          const duplicateCodes: string[] = [];
          let shouldUpdate = false; // Initialize shouldUpdate variable

          // First pass: collect all items and identify duplicates
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];

            if (!row || row.length === 0) continue;

            try {
              // Expected columns: itemCode, barcode, itemNameEng, itemNameArabic, price, uom
              const itemCode = row[0]?.toString().trim();
              const barcode = row[1]?.toString().trim();
              const itemNameEng = row[2]?.toString().trim();
              const itemNameArabic = row[3]?.toString().trim() || '';
              const price = parseFloat(row[4]?.toString()) || 0;
              const uom = row[5]?.toString().trim() || 'pcs';

              // Validation
              if (!itemCode) {
                errors.push(`Row ${i + 1}: Item code is required`);
                continue;
              }

              if (!itemNameEng) {
                errors.push(`Row ${i + 1}: English item name is required`);
                continue;
              }

              if (!barcode) {
                errors.push(`Row ${i + 1}: Barcode is required`);
                continue;
              }

              // Check if item already exists by itemCode
              const existingByCode = await dbService.getItemByCode(itemCode);

              if (existingByCode) {
                duplicateCodes.push(itemCode);
                // Create updated item with existing ID
                const updatedItem: Item = {
                  id: existingByCode.id, // Keep existing ID
                  itemCode,
                  barcode,
                  itemNameEng,
                  itemNameArabic,
                  price,
                  uom,
                  updatedAt: new Date().toISOString(),
                };
                itemsToUpdate.push(updatedItem);
              } else {
                // New item
                const item: Item = {
                  id: `${itemCode}_${Date.now()}`,
                  itemCode,
                  barcode,
                  itemNameEng,
                  itemNameArabic,
                  price,
                  uom,
                  updatedAt: new Date().toISOString(),
                };
                items.push(item);
              }
            } catch (error) {
              errors.push(`Row ${i + 1}: Error processing row - ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }

          // If there are duplicates, show confirmation popup
          if (duplicateCodes.length > 0) {
            shouldUpdate = confirm(
              `Found ${duplicateCodes.length} existing items with the same codes: ${duplicateCodes.join(', ')}\n\nDo you want to update these existing items with the new data from Excel?`
            );

            if (shouldUpdate) {
              // Add items to update to the main items array
              items.push(...itemsToUpdate);
            } else {
              // Add duplicate items to errors
              duplicateCodes.forEach(code => {
                errors.push(`Item with code '${code}' skipped (user chose not to update)`);
              });
            }
          }

          // Save all items (new + updated)
          if (items.length > 0) {
            await dbService.saveItems(items);
          }

          resolve({
            success: items.length,
            errors,
            updated: shouldUpdate ? itemsToUpdate.length : 0,
          });

        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  static downloadTemplate(): void {
    // Create sample data for template - matches export format
    const templateData = [
      ['itemCode', 'barcode', 'itemNameEng', 'itemNameArabic', 'price', 'uom'],
      ['BEV001', '6901234567890', 'Mineral Water 500ml', 'مياه معدنية 500 مل', '1.50', 'bottle'],
      ['SNK001', '6901234567891', 'Potato Chips 150g', 'رقائق البطاطس 150 جرام', '2.25', 'pack'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');

    // Try different download methods for better Android compatibility
    try {
      // Method 1: Standard blob download (works on most modern browsers)
      const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'items_import_template.xlsx';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Template download failed:', error);
      // Fallback: Try opening in new tab (less ideal but works on some Android browsers)
      try {
        const buffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
        const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${buffer}`;
        const newWindow = window.open(dataUrl, '_blank');
        if (!newWindow) {
          alert('Please allow popups for this site to download the template. Alternatively, you can manually create an Excel file with columns: itemCode, barcode, itemNameEng, itemNameArabic, price, uom');
        }
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
        alert('Unable to download template automatically. Please manually create an Excel file with these columns: itemCode, barcode, itemNameEng, itemNameArabic, price, uom');
      }
    }
  }
}