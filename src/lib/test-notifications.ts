import { Firestore, getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { queueNotification } from './notifications';

// Note: This script is intended to be run in a Node environment (e.g., via tsx)
// It uses firebase-admin to bypass client-side restrictions and directly interact with Firestore.

if (!admin.apps.length) {
  admin.initializeApp();
}

async function runDiagnostic() {
  const db = getFirestore() as unknown as any; // Cast to bypass slight interface differences between client and admin SDKs in this context
  const targetEmail = 'goal@feiselinosportjerseys.ca';

  console.log('--- FSLNO EMAIL PIPELINE DIAGNOSTIC ---');
  console.log(`Target: ${targetEmail}`);
  console.log('Triggering "newsletterWelcome" template (Branded)...');

  try {
    await queueNotification(
      db,
      'newsletterWelcome',
      targetEmail,
      {
        customer_name: 'Diagnostic Tester',
      }
    );

    console.log('\nSUCCESS: Test email queued in Firestore "mail" collection.');
    console.log('NEXT STEPS:');
    console.log('1. Check Firestore "mail" collection for the new document.');
    console.log('2. Look for "delivery" fields (state, endTime, etc.).');
    console.log('3. If "delivery" block is missing after 30s, the extension is NOT running.');
  } catch (error) {
    console.error('FAILED:', error);
  }
}

runDiagnostic();
