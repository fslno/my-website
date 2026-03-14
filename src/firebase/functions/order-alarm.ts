/**
 * @fileOverview Firebase Cloud Function for Order Alarms.
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Dispatches an alarm when a new order is created.
 */
export const onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const orderId = event.params.orderId;
  const total = data.total || 0;
  const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);

  const payload = {
    notification: {
      title: `New Order - ${formattedTotal}`,
      body: `Order received.`,
      sound: "alarm.mp3",
    },
    data: {
      orderId: orderId,
      total: total.toString(),
      type: "ORDER_ALARM",
      click_action: "/admin/orders"
    }
  };

  try {
    await admin.messaging().sendToTopic("admin_orders", payload, {
      priority: "high",
      timeToLive: 60 * 60 * 24
    });
  } catch (error) {
    console.error("[ALARM] Notification failed:", error);
  }
});

/**
 * Dispatches a test alarm.
 */
export const sendTestNotification = onCall(async (request) => {
  if (!request.auth || (request.auth.token.email !== 'fslno.dev@gmail.com' && request.auth.uid !== 'ulyu5w9XtYeVTmceUfOZLZwDQxF2')) {
    throw new HttpsError('permission-denied', 'Unauthorized access.');
  }

  const payload = {
    notification: {
      title: "Test Alarm - Diagnostic",
      body: "High-priority test alert.",
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
    return { success: true, message: "Alarm sent." };
  } catch (error: any) {
    throw new HttpsError('internal', `Diagnostic failure: ${error.message}`);
  }
});
