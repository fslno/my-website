import React from 'react';

/**
 * Global Storefront Loading Component
 * Replaces skeletons with a premium white splash screen matches the initial load.
 */
export default function StorefrontLoading() {
  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-white">
      <div className="flex items-center justify-center">
        <img
          src="https://i.ibb.co/Ld5KV35V/fslno-icon-512-x-512.png"
          alt="FSLNO Loading"
          className="w-[120px] h-[120px] max-width-[50vw] object-contain animate-pulse duration-[2000ms]"
        />
      </div>
    </div>
  );
}
