'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// Unified Initialization Protocol
let cachedSdks: any = null;

export function initializeFirebase() {
  if (cachedSdks) return cachedSdks;

  const apps = getApps();
  if (apps.length > 0) {
    const app = apps[0];
    cachedSdks = {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
      storage: getStorage(app)
    };
    return cachedSdks;
  }

  // Explicit Validation Loop
  if (!firebaseConfig.apiKey) {
    console.error("CRITICAL: [FIREBASE] API Key missing. Verify environment manifest.");
  }

  try {
    const firebaseApp = initializeApp(firebaseConfig);
    // Initialize Firestore with modern persistent cache and stability settings
    const firestore = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      ignoreUndefinedProperties: true
    });

    cachedSdks = {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore,
      storage: getStorage(firebaseApp)
    };

    return cachedSdks;
  } catch (e) {
    console.error('Firebase initialization failed.', e);
    throw e;
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

/**
 * Returns a Firebase Messaging instance if supported.
 */
export async function getMessagingInstance(firebaseApp: FirebaseApp) {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getMessaging(firebaseApp);
  }
  return null;
}

export * from './hooks';
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
