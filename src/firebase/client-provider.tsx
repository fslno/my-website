'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

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
  const { isLoading: storeLoading } = useDoc(storeRef);

  if (themeLoading || storeLoading) {
    return (
      <div className="fixed inset-0 bg-white z-[1000] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <div className="w-12 h-12 bg-black rounded-sm flex items-center justify-center text-white font-headline font-bold text-xl">
            F
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
