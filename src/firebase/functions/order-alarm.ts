/**
 * @fileOverview Firebase Cloud Function for High-Priority Order Alarms.
 *
 * Logic:
 * - Triggers on onCreate in 'orders' collection.
 * - Dispatches FCM notification to 'admin_orders' topic.
 */

import { onDocumentCreated } from "firebase-functions/v2/firestore";
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

  const payload: admin.messaging.MessagingPayload = {
    notification: {
      title: "🚨 NEW ORDER RECEIVED!",
      body: `Order #${orderId.substring(0, 8).toUpperCase()} - ${formattedTotal}`,
      sound: "alarm.mp3",
      clickAction: "/admin/orders",
      icon: "/icons/icon-192x192.png",
      tag: "order-alarm",
    },
    data: {
      orderId: orderId,
      total: total.toString(),
      type: "ORDER_ALARM"
    }
  };

  const options: admin.messaging.MessagingOptions = {
    priority: "high", // Android high priority
    timeToLive: 60 * 60 * 24, // 1 day
  };

  // Target the specific topic for admin alarms
  try {
    await admin.messaging().sendToTopic("admin_orders", payload, options);
    console.log(`[ALARM] High-priority notification dispatched for Order ${orderId}`);
  } catch (error) {
    console.error("[ALARM] Failed to dispatch FCM notification:", error);
  }
});
