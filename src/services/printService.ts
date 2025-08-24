import { Item, PrintSettings } from '../types';

class PrintService {
  async printLabel(item: Item, settings: PrintSettings, quantity: number = 1) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window. Please allow popups.');
    }

    const labelHtml = this.generateLabelHtml(item, settings, quantity);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label</title>
          <style>
            body { 
              margin: 0; 
              padding: 10px; 
              font-family: Arial, sans-serif;
            }
            .label {
              width: 60mm;
              height: 40mm;
              border: none;
              padding: 5px;
              box-sizing: border-box;
              background: #fff;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              margin: 0 auto;
            }
            .logo {
              width: 80%;
              max-width: 180px;
              object-fit: contain;
              margin-bottom: 4px;
            }
            .arabic-name {
              font-size: 12px;
              direction: rtl;
              font-family: Arial, sans-serif;
              margin-bottom: 2px;
              text-align: center;
              width: 100%;
            }
            .english-name {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 2px;
              text-align: center;
              width: 100%;
            }
            .barcode-container {
              margin: 4px 0 0 0;
              text-align: center;
              width: 100%;
            }
            .barcode-svg {
              display: flex;
              justify-content: center;
            }
            .barcode-number {
              font-size: 12px;
              margin-top: 2px;
              text-align: center;
            }
            .price-container {
              font-size: 16px;
              font-weight: bold;
              margin-top: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              text-align: center;
              gap: 4px;
            }
            .riyal-symbol {
              height: 18px;
              margin-right: 4px;
              vertical-align: middle;
            }
            @media print {
              .label {
                width: 60mm !important;
                height: 40mm !important;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${labelHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  public generateLabelHtml(item: Item, settings: PrintSettings, quantity: number): string {
    // Generate barcode SVG
    const barcodeSvg = this.generateBarcodeSvg(item.barcode);
    
    return `
      <div class="label" style="width:60mm;height:40mm;padding:5px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <!-- Logo -->
        <img src="Logo 6x1-Photoroom.png" alt="Logo" style="width:80%;max-width:180px;object-fit:contain;margin-bottom:4px;" />
        <!-- Arabic Name -->
        ${item.itemNameArabic ? `<div style="font-size:12px;direction:rtl;font-family:Arial,sans-serif;margin-bottom:2px;text-align:center;width:100%;">${item.itemNameArabic}</div>` : ''}
        <!-- English Name -->
        <div style="font-size:12px;font-weight:bold;margin-bottom:2px;text-align:center;width:100%;">${item.itemNameEng}</div>
        <!-- Barcode -->
        ${settings.includeBarcode && item.barcode ? `
          <div style="margin:4px 0 0 0;text-align:center;width:100%;">
            <div style="display:flex;justify-content:center;">${barcodeSvg}</div>
            <div style="font-size:12px;margin-top:2px;text-align:center;">${item.barcode}</div>
          </div>
        ` : ''}
        <!-- Price -->
        ${settings.includePrice ? `
          <div style="font-size:16px;font-weight:bold;margin-top:4px;display:flex;align-items:center;justify-content:center;width:100%;text-align:center;gap:4px;">
            <img src="Saudi_Riyal_Symbol.png" alt="SAR" style="height:18px;margin-right:4px;vertical-align:middle;" />
            <span style="margin-left:2px;">${item.price.toFixed(2)}</span>
          </div>
        ` : ''}
        ${quantity > 1 ? `<div style="font-size:10px;margin-top:3px;text-align:center;">Qty: ${quantity}</div>` : ''}
      </div>
    `;
  }

  private generateBarcodeSvg(barcode: string): string {
    // Simple barcode generation - you can replace this with a proper barcode library
    const bars = this.generateBarcodeBars(barcode);
    const barWidth = 2;
    const barHeight = 40;
    const totalWidth = bars.length * barWidth;
    
    let svg = `<svg width="${totalWidth}" height="${barHeight}" xmlns="http://www.w3.org/2000/svg">`;
    
    bars.forEach((bar, index) => {
      if (bar === 1) {
        svg += `<rect x="${index * barWidth}" y="0" width="${barWidth}" height="${barHeight}" fill="black"/>`;
      }
    });
    
    svg += '</svg>';
    return svg;
  }

  private generateBarcodeBars(barcode: string): number[] {
    // Simple barcode pattern generation - replace with proper barcode algorithm
    const bars: number[] = [];
    for (let i = 0; i < barcode.length; i++) {
      const char = barcode.charCodeAt(i);
      // Generate alternating bars based on character code
      for (let j = 0; j < 8; j++) {
        bars.push((char >> j) & 1);
      }
    }
    return bars;
  }
}

export const printService = new PrintService();
