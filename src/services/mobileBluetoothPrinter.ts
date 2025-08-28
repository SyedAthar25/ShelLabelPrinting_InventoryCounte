export class MobileBluetoothPrinterService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isConnecting: boolean = false;

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

  // Check if we're on a mobile device
  static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Check if Web Bluetooth is available
  static isBluetoothAvailable(): boolean {
    return !!(navigator.bluetooth);
  }

  // Get detailed device information
  static getDeviceInfo(): {
    browser: string;
    platform: string;
    isMobile: boolean;
    hasBluetooth: boolean;
    isSecure: boolean;
    userAgent: string;
  } {
    const userAgent = navigator.userAgent;
    const isMobile = this.isMobileDevice();
    const hasBluetooth = !!navigator.bluetooth;
    const isSecure = window.isSecureContext;
    
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('SamsungBrowser')) browser = 'Samsung Internet';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    let platform = 'Unknown';
    if (userAgent.includes('Android')) platform = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) platform = 'iOS';
    else if (userAgent.includes('Windows')) platform = 'Windows';
    else if (userAgent.includes('Mac')) platform = 'macOS';
    else if (userAgent.includes('Linux')) platform = 'Linux';
    
    return {
      browser,
      platform,
      isMobile,
      hasBluetooth,
      isSecure,
      userAgent
    };
  }

  // Get Bluetooth status message
  static getBluetoothStatus(): string {
    const info = this.getDeviceInfo();
    
    if (!info.hasBluetooth) {
      return 'Web Bluetooth not supported';
    }
    
    if (!info.isSecure) {
      return 'HTTPS required for Bluetooth';
    }
    
    if (info.platform === 'iOS') {
      return 'Web Bluetooth not supported on iOS';
    }
    
    if (info.isMobile) {
      return `Web Bluetooth available (${info.browser} on ${info.platform})`;
    }
    
    return `Web Bluetooth available (${info.browser} on ${info.platform})`;
  }

  async connect(): Promise<void> {
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    this.isConnecting = true;

    try {
      // Check Web Bluetooth support
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth is not supported on this device/browser. Use Chrome or Samsung Internet on Android.');
      }

      // Check secure context
      if (!window.isSecureContext) {
        throw new Error('Bluetooth requires a secure context (HTTPS). Please access the app via HTTPS.');
      }

      // Check iOS (not supported)
      const deviceInfo = MobileBluetoothPrinterService.getDeviceInfo();
      if (deviceInfo.platform === 'iOS') {
        throw new Error('Web Bluetooth is not supported on iOS. Please use an Android device.');
      }

      console.log('Starting mobile Bluetooth device discovery...');
      console.log('Device info:', deviceInfo);

      // Try multiple connection strategies for mobile
      await this.tryMobileConnection();

    } finally {
      this.isConnecting = false;
    }
  }

  private async tryMobileConnection(): Promise<void> {
    // Show all nearby Bluetooth devices
    console.log('Starting broad device discovery to show all devices...');
    
    try {
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          // Common services to discover
          0xffe0,  // UART service
          0xff00,  // Alternative service
          0x1800,  // Generic Access service
          0x1801,  // Generic Attribute service
          0x1802,  // Immediate Alert service
          0x1803,  // Link Loss service
          0x1804,  // Tx Power service
          0x1805,  // Current Time service
          0x1806,  // Reference Time Update service
          0x1807,  // Next DST Change service
          0x1808,  // Glucose service
          0x1809,  // Health Thermometer service
          0x180a,  // Device Information service
          0x180b,  // Network Availability service
          0x180c,  // Offline Storage service
          0x180d,  // Heart Rate service
          0x180e,  // Phone Alert Status service
          0x180f,  // Battery service
          0x1810,  // Blood Pressure service
          0x1811,  // Alert Notification service
          0x1812,  // Human Interface Device service
          0x1813,  // Scan Parameters service
          0x1814,  // Running Speed and Cadence service
          0x1815,  // Automation IO service
          0x1816,  // Cycling Speed and Cadence service
          0x1818,  // Cycling Power service
          0x1819,  // Location and Navigation service
          0x181a,  // Environmental Sensing service
          0x181b,  // Body Composition service
          0x181c,  // User Data service
          0x181d,  // Weight Scale service
          0x181e,  // Bond Management service
          0x181f,  // Continuous Glucose Monitoring service
          0x1820,  // Internet Protocol Support service
          0x1821,  // Indoor Positioning service
          0x1822,  // Pulse Oximeter service
          0x1823,  // HTTP Proxy service
          0x1824,  // Transport Discovery service
          0x1825,  // Object Transfer service
          0x1826,  // Fitness Machine service
          0x1827,  // Mesh Provisioning service
          0x1828,  // Mesh Proxy service
          0x1829,  // Reconnection Configuration service
          0x182a,  // Insulin Delivery service
          0x182b,  // Binary Sensor service
          0x182c,  // Emergency Configuration service
          0x182d,  // Physical Activity Monitor service
          0x182e,  // Audio Input Control service
          0x182f,  // Volume Control service
          0x1830,  // Volume Offset Control service
          0x1831,  // Coordinated Set Identification service
          0x1832,  // Device Time service
          0x1833,  // Media Control service
          0x1834,  // Generic Media Control service
          0x1835,  // Constant Tone Extension service
          0x1836,  // Telephone Bearer service
          0x1837,  // Generic Telephone Bearer service
          0x1838,  // Microphone Control service
          0x1839,  // Audio Stream Control service
          0x183a,  // Broadcast Audio Scan service
          0x183b,  // Published Audio Capabilities service
          0x183c,  // Audio Input Control service
          0x183d,  // Volume Offset Control service
          0x183e,  // Volume Control service
          0x183f,  // Coordinated Set Identification service
          0x1840,  // Device Time service
          0x1841,  // Media Control service
          0x1842,  // Generic Media Control service
          0x1843,  // Constant Tone Extension service
          0x1844,  // Telephone Bearer service
          0x1845,  // Generic Telephone Bearer service
          0x1846,  // Microphone Control service
          0x1847,  // Audio Stream Control service
          0x1848,  // Broadcast Audio Scan service
          0x1849,  // Published Audio Capabilities service
          0x184a,  // Audio Input Control service
          0x184b,  // Volume Offset Control service
          0x184c,  // Volume Control service
          0x184d,  // Coordinated Set Identification service
          0x184e,  // Device Time service
          0x184f,  // Media Control service
          0x1850,  // Generic Media Control service
        ]
      });
      console.log('Device selected:', this.device.name || 'Unknown');
    } catch (error) {
      console.log('Device selection failed:', error);
      throw new Error(`Device selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!this.device.gatt) {
      throw new Error('Selected device does not support GATT. Please try a different device.');
    }

    // Connect to GATT server
    console.log('Connecting to GATT server...');
    this.server = await this.device.gatt.connect();
    console.log('GATT server connected');

    // Find compatible service
    const service = await this.findCompatibleService();
    if (!service) {
      throw new Error('No compatible printer service found. Please ensure the printer is turned on and in pairing mode.');
    }

    // Find compatible characteristic
    this.writeCharacteristic = await this.findCompatibleCharacteristic(service);
    if (!this.writeCharacteristic) {
      throw new Error('No compatible write characteristic found. This device may not be a printer.');
    }

    console.log('Mobile Bluetooth connection successful!');
  }

  private async findCompatibleService(): Promise<BluetoothRemoteGATTService | null> {
    // First try to find printer-specific services
    for (const serviceUUID of MobileBluetoothPrinterService.SERVICE_UUIDS) {
      try {
        const service = await this.server!.getPrimaryService(serviceUUID);
        console.log(`Found printer service: 0x${serviceUUID.toString(16)}`);
        return service;
      } catch (error) {
        console.log(`Service 0x${serviceUUID.toString(16)} not found, trying next...`);
      }
    }
    
    // If no printer services found, try to find any available service
    console.log('No printer services found, looking for any available service...');
    return await this.findAnyAvailableService();
  }

  private async findAnyAvailableService(): Promise<BluetoothRemoteGATTService | null> {
    try {
      // Get all primary services
      const services = await this.server!.getPrimaryServices();
      console.log(`Found ${services.length} primary services`);
      
      for (const service of services) {
        console.log(`Service: ${service.uuid}`);
        try {
          // Try to get characteristics for this service
          const characteristics = await service.getCharacteristics();
          console.log(`  - Has ${characteristics.length} characteristics`);
          
          for (const char of characteristics) {
            console.log(`    - Characteristic: ${char.uuid} (${char.properties.read ? 'R' : ''}${char.properties.write ? 'W' : ''}${char.properties.notify ? 'N' : ''})`);
          }
          
          // Return the first service with characteristics
          if (characteristics.length > 0) {
            return service;
          }
        } catch (error) {
          console.log(`  - Error getting characteristics: ${error}`);
        }
      }
    } catch (error) {
      console.log('Error getting primary services:', error);
    }
    
    return null;
  }

  private async findCompatibleCharacteristic(service: BluetoothRemoteGATTService): Promise<BluetoothRemoteGATTCharacteristic | null> {
    // First try to find printer-specific characteristics
    for (const charUUID of MobileBluetoothPrinterService.CHARACTERISTIC_UUIDS) {
      try {
        const characteristic = await service.getCharacteristic(charUUID);
        console.log(`Found printer characteristic: 0x${charUUID.toString(16)}`);
        return characteristic;
      } catch (error) {
        console.log(`Characteristic 0x${charUUID.toString(16)} not found, trying next...`);
      }
    }
    
    // If no printer characteristics found, try to find any writable characteristic
    console.log('No printer characteristics found, looking for any writable characteristic...');
    return await this.findAnyWritableCharacteristic(service);
  }

  private async findAnyWritableCharacteristic(service: BluetoothRemoteGATTService): Promise<BluetoothRemoteGATTCharacteristic | null> {
    try {
      const characteristics = await service.getCharacteristics();
      console.log(`Found ${characteristics.length} characteristics`);
      
      for (const char of characteristics) {
        console.log(`Characteristic: ${char.uuid} - Properties: ${JSON.stringify(char.properties)}`);
        
        // Look for writable characteristics
        if (char.properties.write || char.properties.writeWithoutResponse) {
          console.log(`Found writable characteristic: ${char.uuid}`);
          return char;
        }
      }
    } catch (error) {
      console.log('Error getting characteristics:', error);
    }
    
    return null;
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
    console.log('Mobile Bluetooth disconnected');
  }

  private async write(data: Uint8Array): Promise<void> {
    if (!this.writeCharacteristic) {
      throw new Error('Printer is not connected');
    }
    await this.writeCharacteristic.writeValueWithoutResponse(data);
  }

  private encodeText(text: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  async printText(lines: string[]): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer is not connected');
    }

    try {
      // Initialize printer
      await this.write(new Uint8Array([0x1b, 0x40])); // ESC @
      
      // Print each line
      for (const line of lines) {
        await this.write(this.encodeText(line + '\n'));
      }
      
      // Feed and cut
      await this.write(new Uint8Array([0x1d, 0x56, 0x42, 0x10]));
      
      console.log('Print job completed successfully');
    } catch (error) {
      console.error('Print error:', error);
      throw new Error(`Print failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Send test data to any connected device
  async sendTestData(data: string = 'Hello from mobile app!'): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Device is not connected');
    }

    try {
      console.log('Sending test data to device...');
      await this.write(this.encodeText(data));
      console.log('Test data sent successfully');
    } catch (error) {
      console.error('Send test data error:', error);
      throw new Error(`Send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get detailed device information
  getDetailedDeviceInfo(): {
    name: string;
    id: string;
    gatt: boolean;
    services: string[];
    characteristics: string[];
  } {
    if (!this.device) {
      return {
        name: 'No device connected',
        id: '',
        gatt: false,
        services: [],
        characteristics: []
      };
    }

    return {
      name: this.device.name || 'Unknown',
      id: this.device.id,
      gatt: !!this.device.gatt,
      services: [],
      characteristics: []
    };
  }

  async printSimpleLabel(params: { title: string; arabic?: string; barcode?: string; price?: string; }): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer is not connected');
    }

    try {
      // Initialize printer
      await this.write(new Uint8Array([0x1b, 0x40]));
      
      // Print content
      const lines: string[] = [];
      if (params.title) lines.push(params.title);
      if (params.arabic) lines.push(params.arabic);
      if (params.price) lines.push('SAR ' + params.price);
      
      for (const line of lines) {
        await this.write(this.encodeText(line + '\n'));
      }
      
      // Print barcode if provided
      if (params.barcode) {
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
      
      // Feed and cut
      await this.write(new Uint8Array([0x0a, 0x0a]));
      
      console.log('Label printed successfully');
    } catch (error) {
      console.error('Label print error:', error);
      throw new Error(`Label print failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getDeviceInfo(): string {
    if (!this.device) return 'No device connected';
    return `Device: ${this.device.name || 'Unknown'} (${this.device.id})`;
  }

  getConnectionStatus(): string {
    if (!this.isConnected()) return 'Disconnected';
    return `Connected to ${this.getDeviceInfo()}`;
  }
}

export const mobileBluetoothPrinterService = new MobileBluetoothPrinterService();
