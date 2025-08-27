// Web Bluetooth API type declarations
declare global {
  interface Navigator {
    bluetooth?: Bluetooth;
  }

  interface Bluetooth {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  }

  interface RequestDeviceOptions {
    filters?: BluetoothRequestDeviceFilter[];
    optionalServices?: BluetoothServiceUUID[];
  }

  interface BluetoothRequestDeviceFilter {
    services?: BluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
    manufacturerData?: ManufacturerDataFilter[];
  }

  interface ManufacturerDataFilter {
    companyIdentifier: number;
    dataPrefix?: BufferSource;
    mask?: BufferSource;
  }

  type BluetoothServiceUUID = string | number;

  interface BluetoothDevice extends EventTarget {
    readonly id: string;
    readonly name?: string;
    readonly gatt?: BluetoothRemoteGATTServer;
  }

  interface BluetoothRemoteGATTServer {
    readonly device: BluetoothDevice;
    readonly connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  }

  interface BluetoothRemoteGATTService {
    readonly device: BluetoothDevice;
    readonly isPrimary: boolean;
    readonly uuid: string;
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  type BluetoothCharacteristicUUID = string | number;

  interface BluetoothRemoteGATTCharacteristic {
    readonly service: BluetoothRemoteGATTService;
    readonly uuid: string;
    readonly value?: DataView;
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
  }

  // BarcodeDetector API type declarations
  interface BarcodeDetectorOptions {
    formats?: BarcodeFormat[];
  }

  type BarcodeFormat = 
    | 'aztec'
    | 'code_128'
    | 'code_39'
    | 'code_93'
    | 'codabar'
    | 'data_matrix'
    | 'ean_13'
    | 'ean_8'
    | 'itf'
    | 'pdf417'
    | 'qr_code'
    | 'upc_a'
    | 'upc_e';

  interface DetectedBarcode {
    boundingBox: DOMRectReadOnly;
    cornerPoints: DOMPointReadOnly[];
    format: BarcodeFormat;
    rawValue: string;
  }

  class BarcodeDetector {
    constructor(options?: BarcodeDetectorOptions);
    detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
  }

  interface Window {
    BarcodeDetector?: typeof BarcodeDetector;
  }
}

export {};
