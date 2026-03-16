'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// Unified Initialization Protocol
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    
    // Explicit Validation Loop
    if (!firebaseConfig.apiKey) {
      console.error("CRITICAL: [FIREBASE] API Key missing. Verify environment manifest.");
    }

    try {
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      console.error('Firebase initialization failed.', e);
      throw e;
    }

    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
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

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
