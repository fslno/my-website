'use client';

import React from 'react';

/**
 * Authoritative Branded Loading Manifest.
 * Forensicly manifests a typographic signature on a Pitch Black background.
 * Prevents "white flash" transactions and ensures a seamless archival experience.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <h1 className="font-headline font-bold text-6xl sm:text-8xl tracking-tighter uppercase text-white">
          FSLNO
        </h1>
        <div className="h-px w-16 bg-white/20" />
      </div>
    </div>
  );
}