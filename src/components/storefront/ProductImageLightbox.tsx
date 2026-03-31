"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ChevronLeft } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { ZoomIn } from "lucide-react";
import { ZoomOut } from "lucide-react";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

interface ProductImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: { url: string; type: string }[];
  initialIndex: number;
}

export function ProductImageLightbox({
  isOpen,
  onClose,
  images,
  initialIndex,
}: ProductImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);
  const transformComponentRef = useRef<ReactZoomPanPinchRef>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, initialIndex]);

  // Reset zoom when image changes
  useEffect(() => {
    if (transformComponentRef.current) {
      transformComponentRef.current.resetTransform();
    }
  }, [currentIndex]);

  if (!isOpen || !mounted) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const content = (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 z-20 w-full bg-black/40 backdrop-blur-sm shadow-xl">
        <div className="text-white/80 text-[10px] font-black uppercase tracking-[0.3em] px-4">
          {currentIndex + 1} <span className="opacity-40 px-1">/</span> {images.length}
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom Controls (Desktop/Tablet) */}
          <div className="hidden sm:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10 mr-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-full h-8 w-8"
              onClick={() => transformComponentRef.current?.zoomOut()}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-full h-8 w-8"
              onClick={() => transformComponentRef.current?.resetTransform()}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 rounded-full h-8 w-8"
              onClick={() => transformComponentRef.current?.zoomIn()}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 rounded-full transition-transform active:scale-95"
            onClick={onClose}
          >
            <X className="h-7 w-7" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing">
        {/* Navigation Buttons (Desktop) */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:block">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 text-white hover:bg-white/10 rounded-full backdrop-blur-sm border border-white/5"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:block">
          <Button
            variant="ghost"
            size="icon"
            className="w-12 h-12 text-white hover:bg-white/10 rounded-full backdrop-blur-sm border border-white/5"
            onClick={handleNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>

        {/* Zoomable Image View */}
        <TransformWrapper
          ref={transformComponentRef}
          initialScale={1}
          minScale={0.8}
          maxScale={4}
          centerOnInit={true}
          alignmentAnimation={{ velocityAlignmentTime: 400 }}
        >
          <TransformComponent
            wrapperClass="!w-full !h-full flex items-center justify-center"
            contentClass="!w-full !h-full flex items-center justify-center"
          >
            <div className="relative w-[95vw] h-[75vh] md:w-[90vw] md:h-[85vh] flex items-center justify-center select-none">
              <Image
                src={images[currentIndex].url}
                alt={`Product image ${currentIndex + 1}`}
                fill
                className="object-contain animate-in zoom-in-95 duration-500 will-change-transform"
                sizes="100vw"
                priority
              />
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Footer / Thumbnails (Mobile Swipe optimization) */}
      <div className="p-6 flex justify-center gap-3 z-20 bg-black/40 backdrop-blur-sm">
        {images.map((_, idx) => (
          <button
            key={idx}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              currentIndex === idx ? "bg-white w-6" : "bg-white/10 hover:bg-white/30"
            )}
            onClick={() => {
              setCurrentIndex(idx);
            }}
          />
        ))}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
