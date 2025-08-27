export class BluetoothPrinterService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // Many BLE thermal printers expose a UART-like service/characteristic (FFE0/FFE1)
  private static readonly SERVICE_UUID = 0xffe0;
  private static readonly CHARACTERISTIC_UUID = 0xffe1;

  async connect(): Promise<void> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported on this device/browser. Use Chrome/Android.');
    }

    this.device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [BluetoothPrinterService.SERVICE_UUID] }],
      optionalServices: [BluetoothPrinterService.SERVICE_UUID]
    });

    this.server = await this.device.gatt!.connect();
    const service = await this.server.getPrimaryService(BluetoothPrinterService.SERVICE_UUID);
    this.writeCharacteristic = await service.getCharacteristic(BluetoothPrinterService.CHARACTERISTIC_UUID);
  }

  isConnected(): boolean {
    return !!(this.server && this.server.connected && this.writeCharacteristic);
  }

  async disconnect(): Promise<void> {
    if (this.server && this.server.connected) {
      this.server.disconnect();
    }
    this.device = null;
    this.server = null;
    this.writeCharacteristic = null;
  }

  private async write(data: Uint8Array): Promise<void> {
    if (!this.writeCharacteristic) throw new Error('Printer is not connected');
    await this.writeCharacteristic.writeValueWithoutResponse(data);
  }

  // Basic ESC/POS helpers (works for many 58/80mm thermal printers)
  private encodeText(text: string): Uint8Array {
    // Encode as UTF-8
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  async printText(lines: string[]): Promise<void> {
    // Initialize printer
    const init = new Uint8Array([0x1b, 0x40]); // ESC @
    await this.write(init);
    for (const line of lines) {
      await this.write(this.encodeText(line + '\n'));
    }
    // Feed and cut (partial cut may be ignored depending on printer)
    await this.write(new Uint8Array([0x1d, 0x56, 0x42, 0x10]));
  }

  async printSimpleLabel(params: { title: string; arabic?: string; barcode?: string; price?: string; }): Promise<void> {
    const init = new Uint8Array([0x1b, 0x40]);
    await this.write(init);
    const lines: string[] = [];
    if (params.title) lines.push(params.title);
    if (params.arabic) lines.push(params.arabic);
    if (params.price) lines.push('SAR ' + params.price);
    for (const l of lines) {
      await this.write(this.encodeText(l + '\n'));
    }
    if (params.barcode) {
      // Print CODE128 if supported
      // GS k m d1..dk NUL
      // Select CODE128: m=73, data as ASCII, terminate with NUL
      const encoder = new TextEncoder();
      const data = encoder.encode(params.barcode);
      const header = new Uint8Array([0x1d, 0x6b, 0x49, data.length]);
      const payload = new Uint8Array(data);
      const cmd = new Uint8Array(header.length + payload.length);
      cmd.set(header, 0);
      cmd.set(payload, header.length);
      await this.write(cmd);
      await this.write(new Uint8Array([0x0a])); // LF
    }
    await this.write(new Uint8Array([0x0a, 0x0a]));
  }
}

export const bluetoothPrinterService = new BluetoothPrinterService();


