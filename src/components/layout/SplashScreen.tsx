'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export function SplashScreen({ isVisible, onComplete }: SplashScreenProps) {
  const [shouldRender, setShouldRender] = useState(true); // Default to true for SSR/Initial mount
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialSplash = document.getElementById('initial-splash-screen');
      if (initialSplash) {
        initialSplash.style.display = 'none';
        // DO NOT use .remove() here. React expects the node to be present in the 
        // DOM if it was rendered by the layout, or it will crash with 'insertBefore' error.
      }
    }

    if (!isVisible) {
      // Trigger fade out
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        if (onComplete) onComplete();
      }, 500); // Match with transition duration
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100000] flex items-center justify-center bg-white transition-opacity duration-500 ease-in-out",
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100",
        !shouldRender && "hidden"
      )}
    >
      <div className="flex items-center justify-center">
        <img
          src="https://i.ibb.co/Ld5KV35V/fslno-icon-512-x-512.png"
          alt="FSLNO Logo"
          className="w-[120px] h-[120px] max-width-[50vw] object-contain animate-pulse duration-[2000ms]"
        />
      </div>
    </div>
  );
}
