import React, { useState, useRef, useCallback } from 'react';
import { bluetoothPrinterService, BluetoothPrinterService } from '../services/bluetoothPrinter';

interface BluetoothConnectProps {
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

export const BluetoothConnect: React.FC<BluetoothConnectProps> = ({
  onConnectionChange,
  onError
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check connection status on mount
  React.useEffect(() => {
    const checkConnection = () => {
      const connected = bluetoothPrinterService.isConnected();
      setIsConnected(connected);
      if (connected) {
        setStatus(`Connected to ${bluetoothPrinterService.getDeviceInfo()}`);
      }
    };
    
    checkConnection();
    // Check periodically
    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (isConnecting) return;
    
    setIsConnecting(true);
    setStatus('Searching for Bluetooth devices...');
    
    try {
      console.log('User clicked BT Connect button');
      
      // Use a more direct approach for mobile compatibility
      const connectPromise = bluetoothPrinterService.connect();
      
      // Add a small delay to ensure the user gesture is properly registered
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await connectPromise;
      
      const deviceInfo = bluetoothPrinterService.getDeviceInfo();
      setStatus(`Connected to ${deviceInfo}`);
      setIsConnected(true);
      onConnectionChange?.(true);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bluetooth connect failed';
      setStatus(`Connection failed: ${errorMessage}`);
      console.error('Bluetooth connection error:', error);
      onError?.(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, onConnectionChange, onError]);

  const handleDisconnect = useCallback(async () => {
    try {
      await bluetoothPrinterService.disconnect();
      setStatus('Disconnected');
      setIsConnected(false);
      onConnectionChange?.(false);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, [onConnectionChange]);

  const handlePrint = useCallback(async () => {
    if (!isConnected) {
      setStatus('Not connected to printer');
      return;
    }
    
    try {
      setStatus('Printing...');
      await bluetoothPrinterService.printText(['Test Print', 'Gprinter GP-M322', new Date().toLocaleString()]);
      setStatus('Print successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Print failed';
      setStatus(`Print failed: ${errorMessage}`);
      onError?.(errorMessage);
    }
  }, [isConnected, onError]);

  return (
    <div className="bluetooth-connect">
      <div className="flex gap-2 mb-2">
        <button
          ref={buttonRef}
          onClick={handleConnect}
          disabled={isConnecting}
          className={`btn ${isConnected ? 'btn-secondary' : 'btn-primary'} ${isConnecting ? 'opacity-50' : ''}`}
          style={{ minWidth: '120px' }}
        >
          {isConnecting ? 'Connecting...' : isConnected ? 'Reconnect' : 'BT Connect'}
        </button>
        
        {isConnected && (
          <>
            <button
              onClick={handlePrint}
              className="btn btn-success"
              style={{ minWidth: '100px' }}
            >
              Test Print
            </button>
            <button
              onClick={handleDisconnect}
              className="btn btn-danger"
              style={{ minWidth: '100px' }}
            >
              Disconnect
            </button>
          </>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mb-1">
        Bluetooth: {BluetoothPrinterService.getBluetoothInfo()}
      </div>
      
      {status && (
        <div className={`text-xs ${status.includes('failed') || status.includes('error') ? 'text-red-600' : 'text-gray-600'}`}>
          {status}
        </div>
      )}
    </div>
  );
};
