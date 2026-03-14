'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Authoritative Archival Config Gate.
 * Strictly prevents the manifestation of unstyled content (FOUC)
 * by waiting for the global theme and store manifests to be ingested.
 */
function ConfigGate({ children }: { children: ReactNode }) {
  const db = useFirestore();
  
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { isLoading: themeLoading } = useDoc(themeRef);

  const storeRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: storeData, isLoading: storeLoading } = useDoc(storeRef);

  // Authoritatively set the curated brand asset as the fallback for the loading screen
  const fallbackLogo = "https://i.ibb.co/Ld5KV35V/fslno-icon-512-x-512.png";

  if (themeLoading || storeLoading) {
    return (
      <div className="fixed inset-0 bg-white z-[1000] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <div className="relative w-20 h-20">
            <Image 
              src={storeData?.logoUrl || fallbackLogo} 
              alt="FSLNO Loading" 
              fill 
              className="object-contain"
              priority 
            />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-black/20" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      <ConfigGate>
        {children}
      </ConfigGate>
    </FirebaseProvider>
  );
}
