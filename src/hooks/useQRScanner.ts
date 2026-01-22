import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

interface UseQRScannerOptions {
  onScan?: (decodedText: string) => void;
  onError?: (error: string) => void;
}

export function useQRScanner(options: UseQRScannerOptions = {}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerIdRef = useRef<string>(`qr-reader-${Date.now()}`);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setScannedCode(null);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerIdRef.current);
      }

      const scanner = scannerRef.current;
      
      // Check if already scanning
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        return;
      }

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          setScannedCode(decodedText);
          options.onScan?.(decodedText);
          // Stop scanning after successful scan
          stopScanning();
        },
        (errorMessage) => {
          // Ignore errors during scanning (they happen frequently)
          console.debug("QR scan error:", errorMessage);
        }
      );
      setIsScanning(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Kunne ikke starte kamera";
      setError(errorMessage);
      options.onError?.(errorMessage);
      setIsScanning(false);
    }
  }, [options]);

  const stopScanning = useCallback(async () => {
    try {
      if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
        await scannerRef.current.stop();
      }
      setIsScanning(false);
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
  }, []);

  const resetScanner = useCallback(() => {
    setScannedCode(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
            scannerRef.current.stop().catch(console.error);
          }
        } catch (err) {
          console.error("Error cleaning up scanner:", err);
        }
      }
    };
  }, []);

  return {
    containerId: containerIdRef.current,
    isScanning,
    scannedCode,
    error,
    startScanning,
    stopScanning,
    resetScanner,
  };
}

// Helper to extract equipment ID from QR code
export function parseEquipmentQRCode(qrCode: string): string | null {
  // Format: crewplan://equipment/{equipment_id} or just the UUID
  if (qrCode.startsWith("crewplan://equipment/")) {
    return qrCode.replace("crewplan://equipment/", "");
  }
  // Check if it's a direct UUID or EQ-* format
  if (qrCode.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || qrCode.startsWith("EQ-")) {
    return qrCode;
  }
  return null;
}
