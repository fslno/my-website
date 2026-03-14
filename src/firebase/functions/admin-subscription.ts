/**
 * @fileOverview Firebase Cloud Function for Admin FCM Topic Subscription.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getMessaging } from "firebase-admin/messaging";

// Authoritatively initialize the Admin SDK for backend operations
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Subscribes the current device token to the admin_orders topic.
 * Strictly limited to the master admin identity.
 */
export const subscribeAdminToOrders = onCall(async (request) => {
  // Security Guard: Check if the user is the master admin
  if (!request.auth || request.auth.token.email !== 'fslno.dev@gmail.com') {
    throw new HttpsError('permission-denied', 'Unauthorized identity for alarm protocol.');
  }

  const token = request.data.token;
  if (!token) {
    throw new HttpsError('invalid-argument', 'Missing FCM token manifest.');
  }

  try {
    const messaging = getMessaging();
    const response = await messaging.subscribeToTopic(token, "admin_orders");
    
    console.log(`[ALARM] Successfully subscribed token to admin_orders:`, response);
    
    return { 
      success: true, 
      message: "Protocol synchronized.",
      results: response.results 
    };
  } catch (error: any) {
    console.error("[ALARM] Subscription failure:", error);
    // Propagate a descriptive error back to the client interface
    throw new HttpsError('internal', `Handshake failed: ${error.message || 'Unknown protocol error'}`);
  }
});