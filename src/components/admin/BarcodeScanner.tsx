'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<{ id: string, label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const regionId = 'barcode-scanner-region';

  useEffect(() => {
    // 1. Get available cameras
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameras(devices.map(d => ({ id: d.id, label: d.label })));
        // Default to back camera or first device
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
        setActiveCameraId(backCamera ? backCamera.id : devices[0].id);
      }
    }).catch(err => {
      console.error("Error getting cameras:", err);
      setIsInitializing(false);
    });

    return () => {
      stopScanning();
    };
  }, []);

  useEffect(() => {
    if (activeCameraId) {
      startScanning(activeCameraId);
    }
  }, [activeCameraId]);

  const startScanning = async (cameraId: string) => {
    setIsInitializing(true);
    
    // Stop any existing scanner
    await stopScanning();

    // Create new instance
    scannerRef.current = new Html5Qrcode(regionId);

    const config = {
      fps: 20, // Higher FPS for better tracking
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        // Optimized for typical shipping label barcodes (wide aspect ratio)
        const width = Math.min(viewfinderWidth * 0.8, 300);
        const height = Math.min(viewfinderHeight * 0.4, 150);
        return { width, height };
      },
      aspectRatio: 1.0,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.QR_CODE
      ]
    };

    try {
      await scannerRef.current.start(
        cameraId,
        config,
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {
          // Silent errors during scan cycles
        }
      );
      setIsInitializing(false);
    } catch (err) {
      console.error("Scanner start error:", err);
      setIsInitializing(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Scanner stop error:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md relative bg-white overflow-hidden shadow-2xl border border-gray-100">
        
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-white relative z-10">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-black" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Scanner Active</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-none hover:bg-gray-50">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Scanner Region */}
        <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
          <div id={regionId} className="w-full h-full" />
          
          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-3 transition-opacity">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Initializing Camera...</span>
            </div>
          )}

          {/* Viewfinder Overlay (Simplified implementation of QR box look) */}
          {!isInitializing && (
            <div className="absolute inset-0 pointer-events-none border-[12px] border-black/40">
               <div className="absolute inset-x-[15%] top-1/2 -translate-y-1/2 h-[35%] border-2 border-white/50 border-dashed rounded-sm shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]">
                  <div className="absolute inset-0 border-2 border-primary/40 animate-pulse" />
               </div>
            </div>
          )}
        </div>

        {/* Footer / Controls */}
        <div className="p-5 space-y-4 bg-white">
          {cameras.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Switch Camera</label>
              <Select value={activeCameraId || ''} onValueChange={setActiveCameraId}>
                <SelectTrigger className="h-9 rounded-none text-[10px] font-bold uppercase bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Select Camera" />
                </SelectTrigger>
                <SelectContent>
                  {cameras.map(camera => (
                    <SelectItem key={camera.id} value={camera.id} className="text-[10px] font-bold uppercase">
                      {camera.label || `Camera ${camera.id.slice(0, 4)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="text-center space-y-1.5 pt-1">
            <p className="text-[10px] font-bold uppercase tracking-tight text-black flex items-center justify-center gap-1.5">
              Target the barcode
            </p>
            <p className="text-[9px] text-gray-400 uppercase leading-tight font-medium max-w-[200px] mx-auto italic">
              Scanning occurs automatically. Avoid glare and hold steady for 1-2 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
