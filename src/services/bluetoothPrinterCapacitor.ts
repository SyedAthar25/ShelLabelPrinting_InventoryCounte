import { BluetoothLe } from '@capacitor-community/bluetooth-le';

const GPRINTER_NAMES = ['GP-M322', 'GP-M421', 'Gprinter', 'Printer_BE62'];
const GPRINTER_PREFIXES = ['Printer_', 'Printer-', 'Printer_BE'];
const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
const LS_DEVICE_ID = 'bt.printer.deviceId';
const LS_DEVICE_NAME = 'bt.printer.name';

export class BluetoothPrinterCapacitorService {
  private deviceId: string | null = null;
  private connected = false;

  private isLikelyGprinter(name: string): boolean {
    if (!name) return false;
    if (GPRINTER_NAMES.some(n => name.includes(n))) return true;
    if (GPRINTER_PREFIXES.some(p => name.startsWith(p))) return true;
    return false;
  }

  private async scanForCandidate(timeoutMs = 7000): Promise<{ deviceId: string; name: string } | null> {
    await BluetoothLe.initialize();

    const matches: Array<{ deviceId: string; name: string }> = [];
    const listener = (await (BluetoothLe as any).addListener?.('onScanResult', (event: any) => {
      try {
        const dev = event?.device || event; // plugin sends {device}
        const id = dev?.deviceId || dev?.id;
        const name = dev?.name || '';
        if (id && name) {
          if (this.isLikelyGprinter(name)) {
            matches.push({ deviceId: id, name });
          }
        }
      } catch {}
    })) || { remove: () => {} };

    try {
      await (BluetoothLe as any).requestLEScan?.({ allowDuplicates: false, services: [SERVICE_UUID] });
      await new Promise(resolve => setTimeout(resolve, timeoutMs));
    } finally {
      try { await (BluetoothLe as any).stopLEScan?.(); } catch {}
      try { await (listener as any).remove?.(); } catch {}
    }

    if (matches.length > 0) {
      // Prefer the first strong match
      return matches[0];
    }
    return null;
  }

  async ensureConnected(): Promise<void> {
    if (this.connected && this.deviceId) return;

    await BluetoothLe.initialize();

    const attempts = 3;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        // Try reconnecting to last saved device silently
        const savedId = localStorage.getItem(LS_DEVICE_ID);
        if (savedId) {
          try {
            await BluetoothLe.connect({ deviceId: savedId });
            this.deviceId = savedId;
            this.connected = true;
            return;
          } catch (_) {
            // fall through
          }
        }

        // Try silent scan first
        const candidate = await this.scanForCandidate();
        if (candidate && candidate.deviceId) {
          await BluetoothLe.connect({ deviceId: candidate.deviceId });
          this.deviceId = candidate.deviceId;
          this.connected = true;
          try {
            localStorage.setItem(LS_DEVICE_ID, candidate.deviceId);
            localStorage.setItem(LS_DEVICE_NAME, candidate.name || '');
          } catch {}
          return;
        }

        // Fallback: Try Web Bluetooth API silently (paired devices)
        try {
          await this.tryWebBluetoothFallback();
          return;
        } catch (_) {}

        // Final fallback: Bluetooth Classic (SPP)
        try {
          await this.tryBluetoothClassicFallback();
          return;
        } catch (_) {}
      } catch (_) {
        // ignore and retry
      }

      // Backoff before next attempt
      await new Promise(r => setTimeout(r, 500 + attempt * 500));
    }

    throw new Error('No compatible printer found. Please ensure printer is on and paired.');
  }

  async scanAndConnect(): Promise<void> {
    // Use silent scan method to avoid popup
    await this.ensureConnected();
  }

  async connect(): Promise<void> {
    if (!this.deviceId) throw new Error('No device selected');
    await BluetoothLe.connect({ deviceId: this.deviceId });
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (this.deviceId) {
      await BluetoothLe.disconnect({ deviceId: this.deviceId });
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async printText(lines: string[]): Promise<void> {
    if (!this.deviceId || !this.connected) {
      await this.ensureConnected();
    }
    if (!this.deviceId) throw new Error('Printer not connected');
    
    // Handle different connection types
    if (this.deviceId === 'classic') {
      const { bluetoothPrinterClassicService } = await import('./bluetoothPrinterClassic');
      await bluetoothPrinterClassicService.printText(lines);
      return;
    }

    await this.write(new Uint8Array([0x1b, 0x40])); // ESC @ init
    for (const line of lines) {
      await this.write(this.encodeText(line + '\n'));
    }
    await this.write(new Uint8Array([0x1d, 0x56, 0x42, 0x10])); // Partial cut
  }

  async printSimpleLabel(params: { title: string; arabic?: string; barcode?: string; price?: string; }): Promise<void> {
    if (!this.deviceId || !this.connected) {
      await this.ensureConnected();
    }
    if (!this.deviceId) throw new Error('Printer not connected');
    
    // Handle different connection types
    if (this.deviceId === 'classic') {
      const { bluetoothPrinterClassicService } = await import('./bluetoothPrinterClassic');
      const lines: string[] = [];
      if (params.title) lines.push(params.title);
      if (params.arabic) lines.push(params.arabic);
      if (params.price) lines.push('SAR ' + params.price);
      if (params.barcode) lines.push(params.barcode);
      await bluetoothPrinterClassicService.printText(lines);
      return;
    }

    await this.write(new Uint8Array([0x1b, 0x40]));
    const lines: string[] = [];
    if (params.title) lines.push(params.title);
    if (params.arabic) lines.push(params.arabic);
    if (params.price) lines.push('SAR ' + params.price);
    for (const l of lines) {
      await this.write(this.encodeText(l + '\n'));
    }
    if (params.barcode) {
      const encoder = new TextEncoder();
      const data = encoder.encode(params.barcode);
      const header = new Uint8Array([0x1d, 0x6b, 0x49, data.length]);
      const payload = new Uint8Array(data);
      const cmd = new Uint8Array(header.length + payload.length);
      cmd.set(header, 0);
      cmd.set(payload, header.length);
      await this.write(cmd);
      await this.write(new Uint8Array([0x0a]));
    }
    await this.write(new Uint8Array([0x0a, 0x0a]));
  }

  // Backward-compatible: ensures connection, then prints image
  async printImageFromDataUrl(dataUrl: string): Promise<void> {
    try {
      await this.ensureConnected();

      // Handle different connection types
      if (this.deviceId === 'classic') {
        const { bluetoothPrinterClassicService } = await import('./bluetoothPrinterClassic');
        await bluetoothPrinterClassicService.printImageFromDataUrl(dataUrl);
        return;
      }

      await this.printImageFromDataUrlNoConnect(dataUrl);
    } catch (err) {
      // One reconnect retry on failure
      this.connected = false;
      await this.ensureConnected();
      if (this.deviceId === 'classic') {
        const { bluetoothPrinterClassicService } = await import('./bluetoothPrinterClassic');
        await bluetoothPrinterClassicService.printImageFromDataUrl(dataUrl);
        return;
      }
      await this.printImageFromDataUrlNoConnect(dataUrl);
    }
  }

  // Print a PNG/DataURL image using ESC/POS raster bit image (GS v 0), assumes already connected
  async printImageFromDataUrlNoConnect(dataUrl: string): Promise<void> {
    if (!this.deviceId || !this.connected) throw new Error('Printer not connected');

    const img = await this.loadImage(dataUrl);

    // Draw to canvas to access pixel data
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Convert to 1-bit monochrome (simple luminance threshold)
    const threshold = 200; // tweak if needed
    const bytesPerRow = Math.ceil(canvas.width / 8);
    const totalBytes = bytesPerRow * canvas.height;
    const mono = new Uint8Array(totalBytes);

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        const a = imageData.data[idx + 3];
        const lum = a === 0 ? 255 : Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        const bit = lum < threshold ? 1 : 0; // 1 = black pixel
        const byteIndex = y * bytesPerRow + (x >> 3);
        const bitIndex = 7 - (x & 7);
        if (bit) mono[byteIndex] |= (1 << bitIndex);
      }
    }

    // ESC/POS: GS v 0 m xL xH yL yH + data
    const m = 0x00; // normal
    const xL = bytesPerRow & 0xff;
    const xH = (bytesPerRow >> 8) & 0xff;
    const yL = canvas.height & 0xff;
    const yH = (canvas.height >> 8) & 0xff;

    const header = new Uint8Array([0x1d, 0x76, 0x30, m, xL, xH, yL, yH]);
    const payload = new Uint8Array(header.length + mono.length);
    payload.set(header, 0);
    payload.set(mono, header.length);

    // Initialize
    await this.write(new Uint8Array([0x1b, 0x40]));
    // Write in BLE-safe chunks
    await this.writeLarge(payload);
    // Feed and cut
    await this.write(new Uint8Array([0x0a, 0x0a, 0x1d, 0x56, 0x42, 0x10]));
  }

  private encodeText(text: string): Uint8Array {
    return new TextEncoder().encode(text);
  }

  private async write(data: Uint8Array): Promise<void> {
    if (!this.deviceId) throw new Error('Printer not connected');
    
    // Handle Web Bluetooth connection
    if (this.deviceId !== 'classic' && navigator.bluetooth) {
      const devices = await navigator.bluetooth.getDevices();
      const device = devices.find(d => d.id === this.deviceId);
      if (device && device.gatt && device.gatt.connected) {
        const service = await device.gatt.getPrimaryService(SERVICE_UUID);
        const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
        await characteristic.writeValue(data);
        return;
      }
    }
    
    // Handle Capacitor BLE connection
    await BluetoothLe.write({
      deviceId: this.deviceId,
      service: SERVICE_UUID,
      characteristic: CHARACTERISTIC_UUID,
      value: btoa(String.fromCharCode(...data)),
    });
  }

  private async writeLarge(data: Uint8Array, chunkSize = 180): Promise<void> {
    let offset = 0;
    while (offset < data.length) {
      const end = Math.min(offset + chunkSize, data.length);
      const chunk = data.slice(offset, end);
      await this.write(chunk);
      offset = end;
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  }

  // Fallback to Web Bluetooth API (this was working before)
  private async tryWebBluetoothFallback(): Promise<void> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth not available');
    }

    // Try to connect to already paired device without showing picker
    const devices = await navigator.bluetooth.getDevices();
    const printerDevice = devices.find(device => 
      this.isLikelyGprinter(device.name || '')
    );

    if (printerDevice && printerDevice.gatt) {
      await printerDevice.gatt.connect();
      this.connected = true;
      this.deviceId = printerDevice.id; // Use Web Bluetooth device ID
      return;
    }

    throw new Error('No paired printer found');
  }

  // Fallback to Bluetooth Classic
  private async tryBluetoothClassicFallback(): Promise<void> {
    // Import the classic service dynamically to avoid circular dependencies
    const { bluetoothPrinterClassicService } = await import('./bluetoothPrinterClassic');
    
    try {
      await bluetoothPrinterClassicService.ensureConnected();
      this.connected = true;
      this.deviceId = 'classic'; // Mark as classic connection
      return;
    } catch (error) {
      throw new Error('Bluetooth Classic connection failed');
    }
  }
}

export const bluetoothPrinterCapacitorService = new BluetoothPrinterCapacitorService();
