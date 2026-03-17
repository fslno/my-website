'use client';

import React from 'react';
import NextImage from 'next/image';

/**
 * Authoritative Studio Loading Manifest.
 * Overlaying a high-index centered div with a professional pulse effect.
 * Implements priority loading for the primary brand asset.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center pointer-events-none">
      <div className="relative w-24 h-24 animate-pulse">
        <NextImage 
          src="https://i.ibb.co/Ld5KV35V/fslno-icon-512-x-512.png" 
          alt="FSLNO" 
          fill 
          className="object-contain"
          priority 
        />
      </div>
    </div>
  );
}
