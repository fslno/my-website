/**
 * @fileOverview Firebase Cloud Function for High-Priority Order Alarms and Diagnostics.
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Authoritatively initialize the Admin SDK for messaging triggers
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Dispatches a high-priority alarm when a new order is manifested.
 */
export const onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const orderId = event.params.orderId;
  const total = data.total || 0;
  const formattedTotal = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(total);

  const payload = {
    notification: {
      title: "🚨 NEW ORDER RECEIVED!",
      body: `Order #${orderId.substring(0, 8).toUpperCase()} - ${formattedTotal}`,
      sound: "alarm.mp3",
    },
    data: {
      orderId: orderId,
      total: total.toString(),
      type: "ORDER_ALARM",
      click_action: "/admin/orders"
    }
  };

  // Target the specific topic for admin alarms
  try {
    await admin.messaging().sendToTopic("admin_orders", payload, {
      priority: "high",
      timeToLive: 60 * 60 * 24
    });
    console.log(`[ALARM] High-priority notification dispatched for Order ${orderId}`);
  } catch (error) {
    console.error("[ALARM] Failed to dispatch FCM notification:", error);
  }
});

/**
 * Authoritatively dispatches a test alarm to the admin topic for diagnostic verification.
 */
export const sendTestNotification = onCall(async (request) => {
  // Security Guard: Check if the user is an admin
  if (!request.auth || (request.auth.token.email !== 'fslno.dev@gmail.com' && request.auth.uid !== 'ulyu5w9XtYeVTmceUfOZLZwDQxF2')) {
    throw new HttpsError('permission-denied', 'Unauthorized diagnostic attempt.');
  }

  const payload = {
    notification: {
      title: "🚨 TEST ALARM RECEIVED",
      body: "This is a high-priority diagnostic trigger from the FSLNO Studio.",
      sound: "alarm.mp3",
    },
    data: {
      type: "TEST_ALARM",
      click_action: "/admin/notifications"
    }
  };

  try {
    await admin.messaging().sendToTopic("admin_orders", payload, {
      priority: "high"
    });
    return { success: true, message: "Diagnostic alarm dispatched." };
  } catch (error: any) {
    console.error("[DIAGNOSTIC] Failed to send test:", error);
    throw new HttpsError('internal', `Diagnostic failure: ${error.message}`);
  }
});
