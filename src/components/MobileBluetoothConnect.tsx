import React, { useState, useRef, useCallback, useEffect } from 'react';
import { mobileBluetoothPrinterService, MobileBluetoothPrinterService } from '../services/mobileBluetoothPrinter';

interface MobileBluetoothConnectProps {
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
  onPrint?: () => void;
}

export const MobileBluetoothConnect: React.FC<MobileBluetoothConnectProps> = ({
  onConnectionChange,
  onError,
  onPrint
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Initialize device info on mount
  useEffect(() => {
    const info = MobileBluetoothPrinterService.getDeviceInfo();
    setDeviceInfo(info);
    
    // Check initial connection status
    const checkConnection = () => {
      const connected = mobileBluetoothPrinterService.isConnected();
      setIsConnected(connected);
      if (connected) {
        setStatus(`Connected to ${mobileBluetoothPrinterService.getDeviceInfo()}`);
      }
    };
    
    checkConnection();
    
    // Check periodically
    const interval = setInterval(checkConnection, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = useCallback(async (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (isConnecting) return;
    
    setIsConnecting(true);
    setStatus('Searching for Bluetooth devices...');
    
    try {
      console.log('User clicked BT Connect button');
      
      // Add a small delay for mobile touch handling
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await mobileBluetoothPrinterService.connect();
      
      const deviceInfo = mobileBluetoothPrinterService.getDeviceInfo();
      setStatus(`Connected to ${deviceInfo}`);
      setIsConnected(true);
      onConnectionChange?.(true);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bluetooth connect failed';
      setStatus(`Connection failed: ${errorMessage}`);
      console.error('Mobile Bluetooth connection error:', error);
      onError?.(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, onConnectionChange, onError]);

  const handleDisconnect = useCallback(async () => {
    try {
      await mobileBluetoothPrinterService.disconnect();
      setStatus('Disconnected');
      setIsConnected(false);
      onConnectionChange?.(false);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, [onConnectionChange]);

  const handlePrint = useCallback(async () => {
    if (!isConnected) {
      setStatus('Not connected to device');
      return;
    }
    
    try {
      setStatus('Printing...');
      await mobileBluetoothPrinterService.printText(['Test Print', 'Gprinter GP-M322', new Date().toLocaleString()]);
      setStatus('Print successful');
      onPrint?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Print failed';
      setStatus(`Print failed: ${errorMessage}`);
      onError?.(errorMessage);
    }
  }, [isConnected, onError, onPrint]);

  const handleTestCommunication = useCallback(async () => {
    if (!isConnected) {
      setStatus('Not connected to device');
      return;
    }
    
    try {
      setStatus('Sending test data...');
      await mobileBluetoothPrinterService.sendTestData('Hello from mobile app! ' + new Date().toLocaleString());
      setStatus('Test data sent successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Send failed';
      setStatus(`Send failed: ${errorMessage}`);
      onError?.(errorMessage);
    }
  }, [isConnected, onError]);

  const getStatusColor = () => {
    if (status.includes('failed') || status.includes('error')) return 'text-red-600';
    if (status.includes('Connected') || status.includes('successful')) return 'text-green-600';
    return 'text-gray-600';
  };

  const getBluetoothStatusMessage = () => {
    if (!deviceInfo) return 'Checking...';
    
    if (!deviceInfo.hasBluetooth) {
      return 'Web Bluetooth not supported';
    }
    
    if (!deviceInfo.isSecure) {
      return 'HTTPS required for Bluetooth';
    }
    
    if (deviceInfo.platform === 'iOS') {
      return 'Web Bluetooth not supported on iOS';
    }
    
    return `Bluetooth: ${deviceInfo.browser} on ${deviceInfo.platform}`;
  };

  return (
    <div className="mobile-bluetooth-connect">
      {/* Device Information */}
      <div className="text-xs text-gray-500 mb-2">
        {getBluetoothStatusMessage()}
      </div>
      
      {/* Connection Status */}
      {status && (
        <div className={`text-xs mb-2 ${getStatusColor()}`}>
          {status}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <button
          ref={buttonRef}
          onClick={handleConnect}
          onTouchEnd={handleConnect}
          disabled={isConnecting}
          className={`
            w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200
            ${isConnecting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : isConnected 
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800' 
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
            }
            ${isConnecting ? 'opacity-50' : 'opacity-100'}
            touch-manipulation
          `}
          style={{ 
            minHeight: '48px',
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          {isConnecting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Connecting...
            </div>
          ) : isConnected ? (
            'Reconnect Device'
          ) : (
            'Connect Bluetooth'
          )}
        </button>
        
        {isConnected && (
          <>
            {/* Device Information */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mb-2">
              <div className="text-xs text-gray-700">
                <div><strong>Device:</strong> {mobileBluetoothPrinterService.getDetailedDeviceInfo().name}</div>
                <div><strong>ID:</strong> {mobileBluetoothPrinterService.getDetailedDeviceInfo().id.substring(0, 8)}...</div>
                <div><strong>GATT:</strong> {mobileBluetoothPrinterService.getDetailedDeviceInfo().gatt ? 'Supported' : 'Not Supported'}</div>
              </div>
            </div>

            <button
              onClick={handleTestCommunication}
              onTouchEnd={handleTestCommunication}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg font-medium transition-all duration-200 touch-manipulation"
              style={{ 
                minHeight: '48px',
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            >
              Send Test Data
            </button>
            
            <button
              onClick={handlePrint}
              onTouchEnd={handlePrint}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-medium transition-all duration-200 touch-manipulation"
              style={{ 
                minHeight: '48px',
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            >
              Test Print
            </button>
            
            <button
              onClick={handleDisconnect}
              onTouchEnd={handleDisconnect}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-medium transition-all duration-200 touch-manipulation"
              style={{ 
                minHeight: '48px',
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            >
              Disconnect
            </button>
          </>
        )}
      </div>
      
      {/* Mobile Tips */}
      {deviceInfo?.isMobile && !isConnected && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-800">
            <strong>Mobile Tips:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Enable Bluetooth in device settings</li>
              <li>• Allow Bluetooth permissions when prompted</li>
              <li>• Will show all nearby Bluetooth devices</li>
              <li>• Can connect to any BLE device for testing</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
