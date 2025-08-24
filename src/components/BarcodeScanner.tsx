import React, { useRef, useEffect, useState } from 'react';
import { barcodeScanner } from '../utils/barcodeScanner';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onError?: (error: string) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeDetected,
  onError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (videoRef.current && canvasRef.current) {
          await barcodeScanner.initializeScanner(videoRef.current, canvasRef.current);
          setIsInitialized(true);
        }
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'Failed to initialize scanner');
      }
    };

    initialize();

    return () => {
      barcodeScanner.stopScanning();
    };
  }, [onError]);

  const startScanning = () => {
    if (isInitialized) {
      barcodeScanner.startScanning(onBarcodeDetected);
      setIsScanning(true);
    }
  };

  const stopScanning = () => {
    barcodeScanner.stopScanning();
    setIsScanning(false);
  };

  return (
    <div className="scan-container">
      <video
        ref={videoRef}
        className="scan-video"
        autoPlay
        playsInline
        muted
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className="scan-overlay" />
      
      <div className="flex gap-4 mt-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="btn btn-primary"
            disabled={!isInitialized}
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="btn btn-secondary"
          >
            Stop Scanning
          </button>
        )}
      </div>
    </div>
  );
};
