'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import getCroppedImg from '@/lib/cropImage';
import { X, Crop, RotateCcw, ZoomIn } from 'lucide-react';

interface ImageCropperProps {
  image: string | null;
  open: boolean;
  onCropComplete: (croppedBlob: Blob | null) => void;
  onClose: () => void;
  aspectRatio?: number;
}

export function ImageCropper({ image, open, onCropComplete, onClose, aspectRatio = 1 }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    try {
      if (!image || !croppedAreaPixels) return;
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels, rotation);
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error(e);
      onCropComplete(null);
    }
  };

  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-4 bg-white border-none rounded-none shadow-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
            <Crop className="h-5 w-5" /> Crop Image
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 relative bg-gray-100 mt-4 overflow-hidden border border-black/5">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
            objectFit="contain"
          />
        </div>

        <div className="shrink-0 space-y-6 pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                <ZoomIn className="h-3 w-3" /> Zoom
              </span>
              <span className="text-[10px] font-mono text-gray-500">{(zoom * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(val) => setZoom(val[0])}
              className="py-2"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                <RotateCcw className="h-3 w-3" /> Rotation
              </span>
              <span className="text-[10px] font-mono text-gray-500">{rotation}°</span>
            </div>
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={(val) => setRotation(val[0])}
              className="py-2"
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 pt-6 flex flex-row gap-3">
          <Button variant="outline" onClick={() => onCropComplete(null)} className="flex-1 h-12 uppercase tracking-widest text-[10px] font-bold border-black/10">
            Skip / Keep Original
          </Button>
          <Button onClick={handleCrop} className="flex-1 h-12 bg-black text-white uppercase tracking-widest text-[10px] font-bold">
            <Save className="h-4 w-4 mr-2" /> Save & Use
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Save } from 'lucide-react';
