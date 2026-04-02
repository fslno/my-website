'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  isVisible: boolean;
  onComplete?: () => void;
}

/**
 * Enhanced SplashScreen Component
 * Handles the handoff from the static HTML splash to the dynamic React splash.
 */
export function SplashScreen({ isVisible, onComplete }: SplashScreenProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Instant handoff: Hide the static splash screen as soon as this component mounts
    if (typeof window !== 'undefined') {
      const initialSplash = document.getElementById('initial-splash-screen');
      if (initialSplash) {
        initialSplash.style.display = 'none';
      }
    }

    if (!isVisible) {
      // Trigger fade out transition when the app/route is ready
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        if (onComplete) onComplete();
      }, 500); // Duration matches transition-opacity class
      return () => clearTimeout(timer);
    } else {
      // Re-enable rendering if it becomes visible again (e.g. route change)
      setShouldRender(true);
      setIsFadingOut(false);
    }
  }, [isVisible, onComplete]);

  if (!shouldRender && !isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100000] flex items-center justify-center bg-white transition-opacity duration-500 ease-in-out",
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="flex items-center justify-center">
        <img
          src="https://i.ibb.co/Ld5KV35V/fslno-icon-512-x-512.png"
          alt="FSLNO Logo"
          className="w-[120px] h-[120px] max-w-[50vw] object-contain animate-pulse duration-[2000ms]"
        />
      </div>
    </div>
  );
}
