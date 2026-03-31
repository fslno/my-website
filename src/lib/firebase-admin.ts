import 'server-only';
import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

/**
 * @fileOverview Safe Firebase Admin Tool.
 * This is set up to only run when needed. 
 * This helps the website start up and build without crashing.
 */

// Global state holders for lazy instances
let cachedApp: any = null;
let cachedDb: any = null;
let cachedAuth: any = null;
let cachedMessaging: any = null;

/**
 * Returns the environment-appropriate Project ID.
 */
function getProjectId() {
  return process.env.PROJECT_ID || 
         process.env.GOOGLE_CLOUD_PROJECT || 
         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
         "studio-1858050787-6ff85";
}

/**
 * Robust check for credentials presence.
 */
function hasCredentials() {
  return !!(
    process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_CONFIG_JSON ||
    process.env.K_SERVICE ||
    process.env.VERCEL
  );
}

/**
 * Start the Firebase Admin App.
 * It waits until it is called to avoid errors while the website builds.
 */
export function getAdminApp() {
  if (cachedApp) return cachedApp;

  const projectId = getProjectId();
  
  // Ensure internal Google libraries can find the Project ID
  if (typeof process !== 'undefined') {
    process.env.GCLOUD_PROJECT = projectId;
    process.env.GOOGLE_CLOUD_PROJECT = projectId;
    process.env.PROJECT_ID = projectId;
  }

  const apps = getApps();
  if (apps.length > 0) {
    cachedApp = apps[0];
    return cachedApp;
  }

  try {
    cachedApp = initializeApp({ projectId });
    return cachedApp;
  } catch (e) {
    const error = e as any;
    // If it's already initialized (race condition), just get it
    if (error.code === 'app/duplicate-app') {
      cachedApp = getApp();
      return cachedApp;
    }
    
    console.warn("[FIREBASE_ADMIN] Initializing bare app (no credentials) for dev-mode isolation.");
    try {
      cachedApp = initializeApp({ projectId }, "fallback");
      return cachedApp;
    } catch (fallbackError) {
      console.error("[FIREBASE_ADMIN] Fatal initialization failure.");
      return null;
    }
  }
}

/**
 * This creates a fake database for testing. 
 * It helps the website run even if you aren't connected to the real database.
 */
const createFirestoreMock = (): any => {
  const dummy: any = {
    doc: () => dummy,
    collection: () => dummy,
    where: () => dummy,
    limit: () => dummy,
    orderBy: () => dummy,
    offset: () => dummy,
    select: () => dummy,
    startAt: () => dummy,
    startAfter: () => dummy,
    endAt: () => dummy,
    endBefore: () => dummy,
    onSnapshot: () => () => {},
    get: async () => ({ 
      exists: false, 
      id: "mock-id",
      data: () => ({}),
      docs: [],
      size: 0,
      empty: true,
      forEach: (cb: any) => {}
    }),
    update: async () => ({}),
    set: async () => ({}),
    add: async () => ({ id: 'mock-id' }),
    delete: async () => ({})
  };
  return dummy;
};

/**
 * Lazy getter for Admin Firestore.
 */
export function getAdminDb() {
  if (cachedDb) return cachedDb;

  if (!hasCredentials()) {
    cachedDb = createFirestoreMock();
    return cachedDb;
  }

  const app = getAdminApp();
  if (!app) return createFirestoreMock();

  try {
    cachedDb = getFirestore(app);
    return cachedDb;
  } catch (e) {
    console.warn("[FIREBASE_ADMIN] Real database failed. Using the fake database instead.");
    cachedDb = createFirestoreMock();
    return cachedDb;
  }
}

/**
 * Lazy getter for Admin Auth.
 */
export function getAdminAuth() {
  if (cachedAuth) return cachedAuth;
  const app = getAdminApp();
  if (!app) return null;
  cachedAuth = getAuth(app);
  return cachedAuth;
}

/**
 * Lazy getter for Admin Messaging.
 */
export function getAdminMessaging() {
  if (cachedMessaging) return cachedMessaging;
  const app = getAdminApp();
  if (!app) return null;
  cachedMessaging = getMessaging(app);
  return cachedMessaging;
}

/**
 * Lazy getter for Firestore FieldValue.
 */
export function getAdminFieldValue() {
  if (!hasCredentials() && process.env.NODE_ENV === 'development') {
    return {
      serverTimestamp: () => new Date(),
      increment: (n: number) => n,
      arrayUnion: (...args: any[]) => args,
      arrayRemove: (...args: any[]) => args,
    };
  }
  return FieldValue;
}
