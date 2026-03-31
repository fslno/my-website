import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Unified Project ID Resolution
const projectId = process.env.PROJECT_ID || 
                  process.env.GOOGLE_CLOUD_PROJECT || 
                  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
                  "studio-1858050787-6ff85";

// Ensure ALL internal Google libraries can find the Project ID
process.env.GCLOUD_PROJECT = projectId;
process.env.GOOGLE_CLOUD_PROJECT = projectId;
process.env.PROJECT_ID = projectId;

let app: any;
try {
  if (getApps().length === 0) {
    // Attempt standard initialization (works in GCloud/App Hosting)
    app = initializeApp({
      projectId,
    });
  } else {
    app = getApp();
  }
} catch (e) {
  const errorMessage = e instanceof Error ? e.message : String(e);
  console.warn("[FIREBASE_ADMIN_APP_INIT_WARNING] Falling back to project-only initialization due to credential error:", errorMessage);
  
  // If standard init fails (e.g. locally without ADC), try project-only init if possible,
  // or use previous app if already initialized.
  if (getApps().length === 0) {
    try {
      app = initializeApp({ projectId }, "fallback");
    } catch (fallbackError) {
      console.error("[FIREBASE_ADMIN_FATAL_INIT_ERROR] Admin SDK cannot be initialized locally.");
    }
  } else {
    app = getApp();
  }
}

// Robust check for credentials presence
const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                       process.env.FIREBASE_SERVICE_ACCOUNT ||
                       process.env.FIREBASE_CONFIG_JSON ||
                       process.env.K_SERVICE; // Standard check for Cloud Run / App Hosting

let adminDb: any;
const createDummy = (): any => {
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
    get: async () => ({ 
      exists: false, 
      id: "mock-id",
      data: () => ({}), // Return empty object instead of null to prevent destructuring errors
      docs: [],
      size: 0,
      empty: true,
      forEach: (cb: any) => {}
    })
  };
  return dummy;
};

if (!hasCredentials && process.env.NODE_ENV === 'development') {
  console.warn("[FIREBASE_ADMIN_CREDENTIAL_WARNING] No Google Application Default Credentials found locally. SSR and Metadata indexing will use fallback values.");
  adminDb = createDummy();
} else {
  try {
    // Explicitly pass the app instance to getFirestore to avoid context issues
    adminDb = getFirestore(app);
  } catch (e) {
    console.warn("[FIREBASE_ADMIN_DB_INIT_WARNING] Could not initialize Firestore admin. Falling back to mock.");
    adminDb = createDummy();
  }
}

export { adminDb };
