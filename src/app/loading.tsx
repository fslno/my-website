'use client';

import React from 'react';
import Image from 'next/image';

/**
 * Authoritative Startup Shield.
 * Forensicly manifests the brand identity during high-velocity transitions.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
      <div className="relative w-[120px] h-[120px] animate-in fade-in duration-500">
        <Image 
          src="https://i.ibb.co/RpXH0bMD/Diamond-FSLNO-logo-org-512x512.png" 
          alt="FSLNO Loading" 
          fill 
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}