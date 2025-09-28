class BarcodeScanner {
    private videoElement: HTMLVideoElement | null = null;
    private isScanning: boolean = false;
    private barcodeDetector: any | null = null;
    private lastDetectedValue: string | null = null;
    private lastEmitTimeMs: number = 0;

    async initializeScanner(videoElement: HTMLVideoElement) {
      this.videoElement = videoElement;

      try {
        // Prefer built-in BarcodeDetector when available (fast on mobile Chrome)
        const isBarcodeDetectorSupported = typeof (window as any).BarcodeDetector !== 'undefined';
        if (isBarcodeDetectorSupported) {
          const supportedFormats = ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'itf'];
          this.barcodeDetector = new (window as any).BarcodeDetector({ formats: supportedFormats });
        }

        // Optimize video settings for faster processing
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
          }
        });
        
        videoElement.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          videoElement.onloadedmetadata = () => resolve(true);
        });
        
        return true;
      } catch (error) {
        console.error('Error accessing camera:', error);
        throw new Error('Camera permission denied or not available');
      }
    }

    startScanning(onBarcodeDetected: (barcode: string) => void) {
      if (!this.videoElement) {
        throw new Error('Scanner not initialized');
      }

      this.isScanning = true;
      this.scanFrame(onBarcodeDetected);
    }

    stopScanning() {
      this.isScanning = false;
      if (this.videoElement && this.videoElement.srcObject) {
        const stream = this.videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        this.videoElement.srcObject = null;
      }
    }

    private async scanFrame(onBarcodeDetected: (barcode: string) => void) {
      if (!this.isScanning || !this.videoElement) return;

      try {
        if (this.barcodeDetector) {
          const detections = await this.barcodeDetector.detect(this.videoElement);
          if (detections && detections.length > 0) {
            const value: string = detections[0].rawValue || detections[0].value || '';
            const now = Date.now();
            // Reduced debounce to 200ms for faster response
            if (value && (value !== this.lastDetectedValue || now - this.lastEmitTimeMs > 200)) {
              this.lastDetectedValue = value;
              this.lastEmitTimeMs = now;
              onBarcodeDetected(value);
            }
          }
        }
      } catch (e) {
        // Ignore detection errors and continue frames
      }

      // Use requestAnimationFrame for smooth scanning
      if (this.isScanning) {
        requestAnimationFrame(() => this.scanFrame(onBarcodeDetected));
      }
    }
  }

  export const barcodeScanner = new BarcodeScanner();
