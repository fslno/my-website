/**
 * @fileOverview Firebase Cloud Function for Order Alarms.
 */

import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
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
      body: `Order received. Status: ${data.status || 'pending'}`,
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
 * Dispatches an alarm when an order is paid.
 */
export const onOrderPaid = onDocumentUpdated("orders/{orderId}", async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  if (!beforeData || !afterData) return;

  // Authoritative Check: Detect transition to 'paid' status
  if (beforeData.paymentStatus !== 'paid' && afterData.paymentStatus === 'paid') {
    const orderId = event.params.orderId;
    const total = afterData.total || 0;
    const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);

    const payload = {
      notification: {
        title: `Payment Received - ${formattedTotal}`,
        body: `Order #${orderId.substring(0, 6)} has been paid.`,
        sound: "alarm.mp3",
      },
      data: {
        orderId: orderId,
        type: "PAID_ALARM",
        click_action: `/admin/orders/${orderId}`
      }
    };

    try {
      await admin.messaging().sendToTopic("admin_orders", payload, {
        priority: "high"
      });
    } catch (error) {
      console.error("[ALARM] Paid notification failed:", error);
    }
  }
});

/**
 * Dispatches a test alarm.
 */
export const sendTestNotification = onCall(async (request) => {
  if (!request.auth || (request.auth.token.email?.endsWith('@example.com') === false && request.auth.uid !== 'cge90HsQLwgri3quh6VBIZs4wiP2')) {
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
    throw new HttpsError('internal', `Error: ${error.message}`);
  }
});
