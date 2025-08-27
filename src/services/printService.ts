import { Item, PrintSettings } from '../types';
import JsBarcode from 'jsbarcode';

class PrintService {
  private generateBarcodeSvg(barcode: string): string {
    try {
      // Create a temporary div to hold the SVG
      const tempDiv = document.createElement('div');
      const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      tempDiv.appendChild(svgNode);
      
      // Use JsBarcode with settings that match react-barcode's default behavior
      // react-barcode defaults to CODE128 format, which is what makes it scannable
      JsBarcode(svgNode, barcode, {
        format: 'CODE128', // This is the key - same as react-barcode default
        width: 2,
        height: 40,
        displayValue: false,
        margin: 0,
        background: '#fff',
        lineColor: '#111',
        fontSize: 0, // No text display
      });
      
      // Extract the SVG string
      const svgString = tempDiv.innerHTML;
      console.log('Generated barcode SVG:', svgString);
      return svgString;
    } catch (e) {
      console.error('Barcode generation failed:', e);
      return this.getFallbackSvg(barcode);
    }
  }

  private getFallbackSvg(barcode: string): string {
    return `<svg width="180" height="50" xmlns="http://www.w3.org/2000/svg">
      <rect width="180" height="50" fill="white" stroke="black" stroke-width="1"/>
      <text x="90" y="30" font-family="monospace" font-size="14" text-anchor="middle" fill="black">${barcode}</text>
    </svg>`;
  }

  public generateLabelHtml(item: Item, settings: PrintSettings, quantity: number): string {
    console.log('generateLabelHtml called with:', { item, settings, quantity }); // DEBUG LOG
    const barcodeSvg = settings.includeBarcode && item.barcode ? this.generateBarcodeSvg(item.barcode) : '';
    console.log('barcodeSvg generated:', barcodeSvg); // DEBUG LOG
    return `
      <div class="label" style="width:60mm;height:40mm;padding:2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <!-- Logo -->
        <img src="Logo 6x1-Photoroom.png" alt="Logo" style="width:80%;max-width:180px;object-fit:contain;margin-bottom:4px;" />
        <!-- Arabic Name -->
        ${item.itemNameArabic ? `<div style="font-size:12px;direction:rtl;font-family:Arial,sans-serif;margin-bottom:2px;text-align:center;width:100%;">${item.itemNameArabic}</div>` : ''}
        <!-- English Name -->
        <div style="font-size:12px;font-weight:bold;margin-bottom:2px;text-align:center;width:100%;">${item.itemNameEng}</div>
        <!-- Barcode -->
        ${settings.includeBarcode && item.barcode ? `
          <div style="margin:2mm 0 0 0;text-align:center;width:100%;">
            <div style="display:flex;justify-content:center;">${barcodeSvg}</div>
            <div style="font-size:12px;margin-top:2px;text-align:center;">${item.barcode}</div>
          </div>
        ` : ''}
        <!-- Price -->
        ${settings.includePrice ? `
          <div style="font-size:16px;font-weight:bold;margin-top:0.5mm;display:flex;align-items:center;justify-content:center;width:100%;text-align:center;gap:4px;">
            <img src="Saudi_Riyal_Symbol.png" alt="SAR" style="height:18px;margin-right:4px;vertical-align:middle;" />
            <span style="margin-left:2px;">${item.price.toFixed(2)}</span>
          </div>
        ` : ''}
        ${quantity > 1 ? `<div style="font-size:10px;margin-top:3px;text-align:center;">Qty: ${quantity}</div>` : ''}
      </div>
    `;
  }
}

export const printService = new PrintService();
