'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingCoverProps {
  className?: string;
  logoSize?: number;
  showLogo?: boolean;
}

export function LoadingCover({ className, logoSize = 120, showLogo = true }: LoadingCoverProps) {
  return (
    <div className={cn(
      "absolute inset-0 z-10 flex items-center justify-center bg-white border border-gray-100",
      className
    )}>
      {showLogo && (
        <img
          src="https://i.ibb.co/Ld5KV35V/fslno-icon-512-x-512.png"
          alt="FSLNO Loading"
          style={{ width: logoSize, height: logoSize }}
          className="max-w-[50%] object-contain animate-pulse duration-[2000ms] opacity-60 grayscale-[50%]"
        />
      )}
    </div>
  );
}
