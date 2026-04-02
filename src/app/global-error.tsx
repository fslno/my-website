'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-white min-h-screen flex items-center justify-center p-8 font-sans">
        <div className="max-w-md w-full text-center space-y-8 flex flex-col items-center">
          <img 
            src="https://i.ibb.co/Ld5KV35V/fslno-icon-512-x-512.png" 
            alt="FSLNO Logo" 
            className="w-20 h-20 object-contain grayscale opacity-50 mb-4"
          />
          <div className="space-y-4">
            <h2 className="text-2xl font-black tracking-tighter uppercase font-headline">Something Went Wrong</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] leading-relaxed font-bold">
              We encountered an unexpected error loading the page.
            </p>
          </div>
          <button
            onClick={() => reset()}
            className="w-full bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-xs shadow-2xl"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
