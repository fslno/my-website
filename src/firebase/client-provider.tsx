'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, limit } from 'firebase/firestore';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Authoritative ConfigGate Protocol
 * Strictly locks the UI until all critical archival data and primary visuals are manifested.
 */
function ConfigGate({ children }: { children: ReactNode }) {
  const db = useFirestore();
  
  // Data Dependency Manifest
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const storeRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const categoriesRef = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);
  const productsQuery = useMemoFirebase(() => db ? query(collection(db, 'products'), limit(1)) : null, [db]);

  const { data: theme, isLoading: themeLoading } = useDoc(themeRef);
  const { isLoading: storeLoading } = useDoc(storeRef);
  const { isLoading: categoriesLoading } = useCollection(categoriesRef);
  const { isLoading: productsLoading } = useCollection(productsQuery);

  const [imageReady, setImageReady] = useState(false);
  const [isSystemReady, setIsSystemReady] = useState(false);

  // High-Fidelity Image Pre-loading Engine
  useEffect(() => {
    if (!themeLoading && theme) {
      const heroUrl = theme.heroImageUrl;
      if (heroUrl) {
        const img = new window.Image();
        img.src = heroUrl;
        img.onload = () => setImageReady(true);
        img.onerror = () => setImageReady(true); // Proceed even if visual fails to maintain uptime
      } else {
        setImageReady(true);
      }
    } else if (!themeLoading && !theme) {
      setImageReady(true); // Protocol fallback: Proceed without theme
    }
  }, [theme, themeLoading]);

  // Combined Gate Logic
  useEffect(() => {
    const allDataLoaded = !themeLoading && !storeLoading && !categoriesLoading && !productsLoading;
    if (allDataLoaded && imageReady) {
      // Temporal buffer for visual stability
      const timer = setTimeout(() => setIsSystemReady(true), 800);
      return () => clearTimeout(timer);
    }
  }, [themeLoading, storeLoading, categoriesLoading, productsLoading, imageReady]);

  return (
    <>
      {/* Loading Lock Viewport */}
      <div 
        className={cn(
          "fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-1000 ease-in-out",
          isSystemReady ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <div className="flex flex-col items-center gap-10">
          <div className="relative w-32 h-32 animate-in zoom-in duration-1000">
            <Image 
              src="https://i.ibb.co/Ld5KV35V/fslno-icon-512-x-512.png" 
              alt="FSLNO Archive" 
              fill 
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary animate-pulse">Initializing Studio</p>
            <div className="w-48 h-[1px] bg-gray-100 relative overflow-hidden">
              <div className="absolute inset-0 bg-primary animate-[drift_2s_infinite] w-1/3" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout Snapshot */}
      <div 
        className={cn(
          "transition-opacity duration-1000 ease-in-out min-h-screen",
          isSystemReady ? "opacity-100" : "opacity-0"
        )}
      >
        {children}
      </div>
    </>
  );
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      <ConfigGate>
        {children}
      </ConfigGate>
    </FirebaseProvider>
  );
}