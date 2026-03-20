'use client';

import React from 'react';
import Image from 'next/image';

/**
 * Authoritative Branded Loading Manifest.
 * Forensicly centers the 512x512 icon to prevent a blank void during transitions.
 * Synchronized with the boot overlay for a seamless archival experience.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center pointer-events-none">
      <div className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-[512px] lg:h-[512px] animate-pulse">
        <Image 
          src="https://placehold.co/512x512/transparent/000000?text=FSLNO" 
          alt="Loading" 
          fill 
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
