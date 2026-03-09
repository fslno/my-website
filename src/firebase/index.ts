'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

let firebaseApp: FirebaseApp | undefined;
let firestore: Firestore | undefined;
let auth: Auth | undefined;

/**
 * Initializes Firebase App and services as singletons to prevent multiple initialization 
 * issues during development and HMR.
 */
export function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { app: null as any, firestore: null as any, auth: null as any };
  }

  if (!firebaseApp) {
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }

  if (!firestore) {
    firestore = getFirestore(firebaseApp);
  }

  if (!auth) {
    auth = getAuth(firebaseApp);
  }

  return { app: firebaseApp, firestore, auth };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './errors';
export * from './error-emitter';
