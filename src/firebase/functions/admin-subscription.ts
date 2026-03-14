/**
 * @fileOverview Firebase Cloud Function for Admin FCM Topic Subscription.
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

/**
 * Subscribes the current device token to the admin_orders topic.
 * Strictly limited to the master admin identity.
 */
export const subscribeAdminToOrders = onCall(async (request) => {
  // Security Guard: Check if the user is the master admin
  if (request.auth?.token.email !== 'fslno.dev@gmail.com') {
    throw new HttpsError('permission-denied', 'Unauthorized identity for alarm protocol.');
  }

  const token = request.data.token;
  if (!token) {
    throw new HttpsError('invalid-argument', 'Missing FCM token.');
  }

  try {
    const response = await admin.messaging().subscribeToTopic(token, "admin_orders");
    console.log(`[ALARM] Successfully subscribed token to admin_orders:`, response);
    return { success: true, message: "Protocol synchronized." };
  } catch (error) {
    console.error("[ALARM] Subscription failure:", error);
    throw new HttpsError('internal', 'Handshake failed.');
  }
});
