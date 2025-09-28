import React, { useRef, useEffect, useState } from 'react';
import { barcodeScanner } from '../utils/barcodeScanner';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onError?: (error: string) => void;
  isVisible?: boolean; // New prop to control visibility
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeDetected,
  onError,
  isVisible = true, // Default to visible
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const feedbackTimeout = useRef<number | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    return () => {
      barcodeScanner.stopScanning();
      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
      zxingReaderRef.current = null;
    };
  }, []);

  // Stop scanning when component becomes invisible
  useEffect(() => {
    if (!isVisible && isScanning) {
      stopScanning();
    }
  }, [isVisible]);

  const startScanning = async () => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const needsInit = !video || !canvas || !video.srcObject || (video.srcObject instanceof MediaStream && video.srcObject.getVideoTracks().length === 0);
      if (needsInit) {
        await barcodeScanner.initializeScanner(video!);
      }
      let fallbackTried = false;
      let barcodeDetected = false; // Flag to prevent multiple detections
      
      barcodeScanner.startScanning(async (barcode) => {
        if (barcodeDetected) {
          return; // Prevent multiple detections
        }
        barcodeDetected = true;
        
        setFeedback('Barcode detected!');
        if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
        setTimeout(() => setFeedback(''), 1500);
        
        // Call the callback first, then stop scanning
        onBarcodeDetected(barcode);
        
        // Stop scanning after calling the callback
        stopScanning();
      });
      setIsScanning(true);
      setFeedback('Point camera at barcode...');
      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = window.setTimeout(async () => {
        if (barcodeDetected) return; // Don't try fallback if already detected
        
        setFeedback('No barcode detected. Trying fallback...');
        // Fallback: try zxing-js
        if (!fallbackTried && video && video.srcObject) {
          fallbackTried = true;
          try {
            const codeReader = new BrowserMultiFormatReader();
            zxingReaderRef.current = codeReader;
            codeReader.decodeFromVideoElement(video, (result) => {
              if (result && !barcodeDetected) {
                barcodeDetected = true;
                setFeedback('Barcode detected!');
                onBarcodeDetected(result.getText());
                stopScanning();
              }
            });
          } catch (e) {
            setFeedback('No barcode detected. Try manual entry or upload.');
            setShowManualEntry(true);
          }
        } else {
          setFeedback('No barcode detected. Try manual entry or upload.');
          setShowManualEntry(true);
        }
      }, 2000); // Reduced from 5000ms to 2000ms for faster fallback
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to initialize scanner');
      setFeedback('Camera error');
      setShowManualEntry(true);
    }
  };

  const stopScanning = () => {
    barcodeScanner.stopScanning();
    zxingReaderRef.current = null;
    setIsScanning(false);
    setFeedback('');
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
  };

  return (
    <>
      {isVisible && (
        <div className="scan-container">
          <video
            ref={videoRef}
            className="scan-video"
            autoPlay
            playsInline
            muted
            style={{ 
              width: '100%', 
              height: 'auto',
              maxHeight: '300px',
              objectFit: 'cover'
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="scan-overlay">
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '80%',
              height: '40%',
              transform: 'translate(-50%, -50%)',
              border: '2px dashed #2563eb',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              pointerEvents: 'none',
              zIndex: 2,
            }} />
          </div>
          <div className="text-center text-xs text-gray-700 mt-2">
            {feedback || 'Align the barcode inside the blue box for best results.'}
          </div>
          {showManualEntry && (
            <div className="mt-2 text-center">
              <button className="btn btn-secondary mr-2" onClick={() => alert('Manual entry not implemented yet.')}>Manual Entry</button>
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>Upload Photo</button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={() => setUploadError('Upload to Python backend not implemented yet.')} />
              {uploadError && <div className="text-red-500 text-xs mt-1">{uploadError}</div>}
            </div>
          )}
          
          <div className="flex gap-4 mt-4">
            {!isScanning ? (
              <button
                onClick={startScanning}
                className="btn btn-primary"
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
      )}
    </>
  );
};
