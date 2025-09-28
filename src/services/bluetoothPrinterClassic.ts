// Bluetooth Classic (SPP) printer service using cordova-plugin-bluetooth-serial
// Works with paired printers like Gprinter over RFCOMM/Serial

const CLASSIC_MATCH_NAMES = ['GP-M322', 'GP-M421', 'Gprinter', 'Printer_', 'Printer-'];

interface BluetoothSerialLike {
  isEnabled(success: () => void, failure: (err: any) => void): void;
  list(success: (devices: Array<{ id: string; address?: string; name?: string }>) => void, failure: (err: any) => void): void;
  connect(address: string, success: () => void, failure: (err: any) => void): void;
  disconnect(success: () => void, failure: (err: any) => void): void;
  write(data: ArrayBuffer | Uint8Array | string, success: () => void, failure: (err: any) => void): void;
}

function getPlugin(): BluetoothSerialLike | null {
  const w = window as any;
  return w && w.bluetoothSerial ? (w.bluetoothSerial as BluetoothSerialLike) : null;
}

export class BluetoothPrinterClassicService {
  private deviceAddress: string | null = null;
  private connected = false;

  private matchesPrinterName(name: string | undefined): boolean {
    if (!name) return false;
    return CLASSIC_MATCH_NAMES.some(p => name.includes(p) || name.startsWith(p));
  }

  async ensureConnected(): Promise<void> {
    const plugin = getPlugin();
    if (!plugin) throw new Error('Bluetooth Serial plugin not available');
    if (this.connected && this.deviceAddress) return;

    // Check bluetooth enabled
    await new Promise<void>((resolve, reject) => plugin.isEnabled(resolve, reject));

    // List bonded devices and pick a likely Gprinter/Printer_*
    const devices = await new Promise<Array<{ id: string; address?: string; name?: string }>>((resolve, reject) =>
      plugin.list(resolve, reject)
    );

    if (!devices || devices.length === 0) throw new Error('No bonded Bluetooth devices');

    const target = devices.find(d => this.matchesPrinterName(d.name)) || devices[0];
    const address = (target.address || target.id);
    if (!address) throw new Error('No device address');

    await new Promise<void>((resolve, reject) => plugin.connect(address, resolve, reject));
    this.deviceAddress = address;
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    const plugin = getPlugin();
    if (!plugin) return;
    await new Promise<void>((resolve) => plugin.disconnect(resolve, () => resolve()));
    this.connected = false;
    this.deviceAddress = null;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async write(data: Uint8Array): Promise<void> {
    const plugin = getPlugin();
    if (!plugin) throw new Error('Bluetooth Serial plugin not available');
    if (!this.connected || !this.deviceAddress) await this.ensureConnected();

    // Chunk write for reliability
    const chunkSize = 1024;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
      await new Promise<void>((resolve, reject) => plugin.write(chunk.buffer, resolve, reject));
    }
  }

  async printText(lines: string[]): Promise<void> {
    await this.write(new Uint8Array([0x1b, 0x40]));
    const encoder = new TextEncoder();
    for (const line of lines) {
      await this.write(encoder.encode(line + '\n'));
    }
    await this.write(new Uint8Array([0x0a, 0x0a]));
  }

  async printImageFromDataUrl(dataUrl: string): Promise<void> {
    // Convert image to ESC/POS raster and send via classic
    const img = await this.loadImage(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const threshold = 200;
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
        const bit = lum < threshold ? 1 : 0;
        const byteIndex = y * bytesPerRow + (x >> 3);
        const bitIndex = 7 - (x & 7);
        if (bit) mono[byteIndex] |= (1 << bitIndex);
      }
    }

    const m = 0x00;
    const xL = bytesPerRow & 0xff;
    const xH = (bytesPerRow >> 8) & 0xff;
    const yL = canvas.height & 0xff;
    const yH = (canvas.height >> 8) & 0xff;

    const header = new Uint8Array([0x1b, 0x40, 0x1d, 0x76, 0x30, m, xL, xH, yL, yH]);
    const payload = new Uint8Array(header.length + mono.length + 4);
    payload.set(header, 0);
    payload.set(mono, header.length);
    payload.set(new Uint8Array([0x0a, 0x0a, 0x1d, 0x56]), header.length + mono.length);

    await this.write(payload);
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  }
}

export const bluetoothPrinterClassicService = new BluetoothPrinterClassicService();
