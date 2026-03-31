/**
 * This file handles notifications for new orders.
 */

import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Sends a notification when a new order is made.
 */
export const onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const orderId = event.params.orderId;
  const total = data.total || 0;
  const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);

  const message = {
    topic: "admin_orders",
    notification: {
      title: `New Order - ${formattedTotal}`,
      body: `Order received. Status: ${data.status || 'pending'}`,
    },
    data: {
      orderId: orderId,
      total: total.toString(),
      click_action: "/admin/orders"
    },
    android: {
      priority: "high" as const,
      notification: {
        sound: "alarm.mp3",
      }
    },
    apns: {
      payload: {
        aps: {
          sound: "alarm.mp3",
        }
      }
    }
  };

  try {
    await admin.messaging().send(message);
  } catch (error) {
    console.error("Order notification failed:", error);
  }
});

/**
 * Sends a notification when an order is paid.
 */
export const onOrderPaid = onDocumentUpdated("orders/{orderId}", async (event) => {
  const beforeData = event.data?.before.data();
  const afterData = event.data?.after.data();

  if (!beforeData || !afterData) return;

  // Check if the order status changed to 'paid'
  if (beforeData.paymentStatus !== 'paid' && afterData.paymentStatus === 'paid') {
    const orderId = event.params.orderId;
    const total = afterData.total || 0;
    const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);

    const message = {
      topic: "admin_orders",
      notification: {
        title: `Payment Received - ${formattedTotal}`,
        body: `Order #${orderId.substring(0, 6)} has been paid.`,
      },
      data: {
        orderId: orderId,
        click_action: `/admin/orders/${orderId}`
      },
      android: {
        priority: "high" as const,
        notification: {
          sound: "alarm.mp3"
        }
      }
    };

    try {
      await admin.messaging().send(message);
    } catch (error) {
      console.error("Payment notification failed:", error);
    }
  }
});

/**
 * Sends a test notification.
 */
export const sendTestNotification = onCall(async (request) => {
  if (!request.auth || (request.auth.token.email?.endsWith('@example.com') === false && request.auth.uid !== 'cge90HsQLwgri3quh6VBIZs4wiP2')) {
    throw new HttpsError('permission-denied', 'Unauthorized access.');
  }

  const message = {
    topic: "admin_orders",
    notification: {
      title: "Test Notification",
      body: "This is a test alert.",
    },
    data: {
      click_action: "/admin/notifications"
    },
    android: {
      priority: "high" as const,
      notification: {
        sound: "alarm.mp3",
      }
    }
  };

  try {
    await admin.messaging().send(message);
    return { success: true, message: "Alarm sent." };
  } catch (error: any) {
    throw new HttpsError('internal', `Error: ${error.message}`);
  }
});
