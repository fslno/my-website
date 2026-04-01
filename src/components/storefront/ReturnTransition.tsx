'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function ReturnTransition() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 1. Initial check for signal on mount (returning to homepage)
    const isReturning = sessionStorage.getItem('fslno_returning_to_product') === 'true';
    
    if (isReturning && (pathname === '/' || pathname === '/products')) {
      setIsVisible(true);
      
      // 2. Clear the trigger after we've caught it
      sessionStorage.removeItem('fslno_returning_to_product');
      
      // 3. Keep white screen for 600ms to allow grid scroll logic to settle
      const holdTimer = setTimeout(() => {
        setIsFadingOut(true);
        
        // 4. Fully remove after fade duration
        const fadeTimer = setTimeout(() => {
          setIsVisible(false);
          setIsFadingOut(false);
        }, 500);
        
        return () => clearTimeout(fadeTimer);
      }, 600);

      return () => clearTimeout(holdTimer);
    }
  }, [pathname]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[10000] bg-white transition-opacity duration-500 pointer-events-none ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    />
  );
}
