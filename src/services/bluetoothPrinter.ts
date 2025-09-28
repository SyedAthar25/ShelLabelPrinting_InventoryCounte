export class BluetoothPrinterService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

  // Common BLE thermal printer service/characteristic UUIDs
  private static readonly SERVICE_UUIDS = [
    0xffe0,  // Common UART service
    0xff00,  // Alternative service
    0x1800,  // Generic Access service
  ];
  
  private static readonly CHARACTERISTIC_UUIDS = [
    0xffe1,  // Common UART characteristic
    0xff01,  // Alternative characteristic
  ];

  async connect(): Promise<void> {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported on this device/browser. Use Chrome/Android.');
    }

    console.log('Starting Bluetooth device discovery...');
    console.log('Available services:', BluetoothPrinterService.SERVICE_UUIDS.map(uuid => '0x' + uuid.toString(16)));

    // Ensure we're in a secure context
    if (!window.isSecureContext) {
      throw new Error('Bluetooth requires a secure context (HTTPS or localhost)');
    }

    try {
      // First try with name filter for Gprinter devices
      console.log('Trying name-based filtering for Gprinter devices...');
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'GP-' },
          { namePrefix: 'Gprinter' },
          { namePrefix: 'GP' },
          { services: BluetoothPrinterService.SERVICE_UUIDS }
        ],
        optionalServices: BluetoothPrinterService.SERVICE_UUIDS
      });
      console.log('Device selected with name filter:', this.device.name);
    } catch (error) {
      // If name-based filtering fails, try with broader discovery
      console.log('Name-based filtering failed, trying broader discovery...', error);
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BluetoothPrinterService.SERVICE_UUIDS
      });
      console.log('Device selected with broader discovery:', this.device.name);
    }

    if (!this.device.gatt) {
      throw new Error('Selected device does not support GATT');
    }

    this.server = await this.device.gatt.connect();
    
    // Try to find a compatible service
    let service: BluetoothRemoteGATTService | null = null;
    for (const serviceUUID of BluetoothPrinterService.SERVICE_UUIDS) {
      try {
        service = await this.server.getPrimaryService(serviceUUID);
        console.log(`Found service: ${serviceUUID.toString(16)}`);
        break;
      } catch (error) {
        console.log(`Service ${serviceUUID.toString(16)} not found, trying next...`);
      }
    }

    if (!service) {
      throw new Error('No compatible printer service found. Please ensure the printer is turned on and in pairing mode.');
    }

    // Try to find a compatible characteristic
    for (const charUUID of BluetoothPrinterService.CHARACTERISTIC_UUIDS) {
      try {
        this.writeCharacteristic = await service.getCharacteristic(charUUID);
        console.log(`Found characteristic: ${charUUID.toString(16)}`);
        break;
      } catch (error) {
        console.log(`Characteristic ${charUUID.toString(16)} not found, trying next...`);
      }
    }

    if (!this.writeCharacteristic) {
      throw new Error('No compatible write characteristic found');
    }
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
    await this.writeCharacteristic.writeValueWithoutResponse(new Uint8Array(data));
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

  // Get device info for debugging
  getDeviceInfo(): string {
    if (!this.device) return 'No device connected';
    return `Device: ${this.device.name || 'Unknown'} (${this.device.id})`;
  }

  // Check if Bluetooth is available
  static isBluetoothAvailable(): boolean {
    return !!(navigator.bluetooth);
  }

  // Get Bluetooth availability info
  static getBluetoothInfo(): string {
    if (!navigator.bluetooth) {
      return 'Web Bluetooth not supported';
    }
    
    // Check if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      return 'Web Bluetooth available (Mobile)';
    }
    
    return 'Web Bluetooth available (Desktop)';
  }

  // Check if we're on a mobile device
  static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Get device capabilities info
  static getDeviceCapabilities(): string {
    const capabilities = [];
    
    if (navigator.bluetooth) capabilities.push('Bluetooth');
    if (window.isSecureContext) capabilities.push('Secure Context');
    if (this.isMobileDevice()) capabilities.push('Mobile Device');
    
    return capabilities.join(', ');
  }
}

export const bluetoothPrinterService = new BluetoothPrinterService();


