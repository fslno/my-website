'use client';

import React, { useEffect } from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Forensic error logging
    console.error('Production Error Catch:', error?.message || error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 pt-32 pb-20">
      <div className="relative">
        <AlertCircle className="h-24 w-24 text-red-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-headline font-bold text-4xl tracking-tighter text-red-600">!</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <h1 className="text-2xl font-headline font-bold uppercase tracking-tight">System Deviation</h1>
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground max-w-xs mx-auto leading-relaxed">
          An unexpected architectural interruption occurred. Our systems have logged the event.
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs mx-auto pt-8">
        <Button 
          onClick={() => reset()}
          className="bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[10px] rounded-none shadow-xl gap-3"
        >
          <RotateCcw className="h-4 w-4" /> Synchronize State
        </Button>
        <Button asChild variant="ghost" className="h-12 font-bold uppercase tracking-widest text-[9px]">
          <a href="/">Return to Home</a>
        </Button>
      </div>
      
      {error.digest && (
        <p className="text-[8px] font-mono font-bold text-gray-300 uppercase tracking-widest">
          Manifest ID: {error.digest}
        </p>
      )}
    </div>
  );
}
