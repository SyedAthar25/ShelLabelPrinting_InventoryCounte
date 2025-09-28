import React, { useState, useRef, useCallback } from 'react';
import { bluetoothPrinterCapacitorService } from '../services/bluetoothPrinterCapacitor';

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
    setIsConnected(bluetoothPrinterCapacitorService.isConnected());
  }, []);

  const handleConnect = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (isConnecting) return;
    setIsConnecting(true);
    setStatus('Searching for Gprinter devices...');
    try {
      await bluetoothPrinterCapacitorService.scanAndConnect();
      setStatus('Connected to Gprinter');
      setIsConnected(true);
      onConnectionChange?.(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bluetooth connect failed';
      setStatus(`Connection failed: ${errorMessage}`);
      onError?.(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, onConnectionChange, onError]);

  const handleDisconnect = useCallback(async () => {
    try {
      await bluetoothPrinterCapacitorService.disconnect();
      setStatus('Disconnected');
      setIsConnected(false);
      onConnectionChange?.(false);
    } catch (error) {
      onError?.('Disconnect error');
    }
  }, [onConnectionChange, onError]);

  const handlePrint = useCallback(async () => {
    if (!isConnected) {
      setStatus('Not connected to printer');
      return;
    }
    try {
      setStatus('Printing...');
      await bluetoothPrinterCapacitorService.printText(['Test Print', 'Gprinter', new Date().toLocaleString()]);
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
      {status && (
        <div className={`text-xs ${status.includes('failed') || status.includes('error') ? 'text-red-600' : 'text-gray-600'}`}>
          {status}
        </div>
      )}
    </div>
  );
};
