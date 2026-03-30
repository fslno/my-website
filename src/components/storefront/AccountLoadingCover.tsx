'use client';

import React from 'react';

/**
 * Premium Full-Page Loading Cover for Account Area.
 * Provides a seamless white overlay with a pulsing logo to mask data hydration/refreshes.
 */
export function AccountLoadingCover() {
  return (
    <div className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden transition-opacity duration-300">
      <img 
        src="/icon.png" 
        alt="Loading" 
        className="w-24 h-24 sm:w-32 sm:h-32 object-contain animate-pulse" 
      />
    </div>
  );
}
