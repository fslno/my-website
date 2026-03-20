'use client';

import React from 'react';

/**
 * Authoritative Branded Loading Manifest.
 * Forensicly centers the textual identity signature to prevent broken media icons during transitions.
 * Synchronized with the boot overlay for a seamless archival experience.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <h1 className="font-headline font-bold text-6xl sm:text-8xl tracking-tighter uppercase text-black">
          FSLNO
        </h1>
        <div className="h-px w-16 bg-black/10" />
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.6em] font-bold text-gray-400 ml-2">
          Studio
        </span>
      </div>
    </div>
  );
}
