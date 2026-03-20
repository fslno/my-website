'use client';

import React from 'react';
import Image from 'next/image';

/**
 * Authoritative Branded Loading Manifest.
 * Forensicly centers the 512x512 icon signature to prevent visual flickering during transitions.
 * Synchronized with the boot overlay for a seamless archival experience.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center pointer-events-none">
      <div className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-[512px] lg:h-[512px] animate-pulse">
        <Image 
          src="https://placehold.co/512x512/000000/FFFFFF/png?text=FSLNO"
          alt="FSLNO"
          fill
          className="object-contain"
        />
      </div>
    </div>
  );
}
