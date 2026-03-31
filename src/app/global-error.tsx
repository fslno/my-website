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
        <div className="max-w-md w-full text-center space-y-6">
          <h2 className="text-2xl font-bold tracking-tighter uppercase">Something Went Wrong</h2>
          <p className="text-sm text-gray-500 uppercase tracking-widest leading-relaxed">
            We encountered an unexpected error loading the page.
          </p>
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
