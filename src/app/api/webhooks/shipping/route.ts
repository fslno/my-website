
import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import { queueNotificationServer } from '@/lib/notifications-server';

/**
 * @fileOverview High-Velocity Shipping Webhook Endpoint.
 * Forensicly synchronizes external carrier signals with the archival order manifest.
 * Supports: Stallion Express (direct), AfterShip (webhook), and manual triggers.
 */

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-1858050787-6ff85'
  });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-webhook-secret');
  const envSecret = process.env.WEBHOOK_SECRET || 'fslno_archival_key';

  // 01. SECURE_VALIDATION Protocol
  if (!secret || secret !== envSecret) {
    console.error('[WEBHOOK] Unauthorized access attempt detected.');
    return NextResponse.json({ error: 'Unauthorized Protocol' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const db = getFirestore();

    // 02. ASYNC_LOGGING: Ingest event into the audit vault
    await db.collection('webhook_events').add({
      payload: body,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      type: body.event ? `aftership_${body.event}` : 'shipping_sync',
      status: 'received'
    });

    let orderId = body.orderId;
    let newStatus = body.status;
    let trackingNumber = body.trackingNumber;
    let carrierName = body.carrier;

    // 03. AFTERSHIP_DECRYPTION: Handle AfterShip specific payload structure
    // AfterShip sends event: 'tracking.update' and data in 'msg'
    if (body.event === 'tracking.update' && body.msg) {
      const msg = body.msg;
      trackingNumber = msg.tracking_number;
      carrierName = msg.carrier_name || msg.carrier || 'AfterShip';
      
      // Status Mapping
      const statusMap: Record<string, string> = {
        'Pending': 'Order Placed',
        'InfoReceived': 'Order Placed',
        'InTransit': 'Shipped',
        'OutForDelivery': 'Out for Delivery',
        'Delivered': 'Delivered',
        'Exception': 'Issue',
        'Expired': 'Issue',
        'AwaitingCollection': 'Ready for Pickup',
        'AttemptFail': 'Issue',
        'Pickup': 'Ready for Pickup',
        'InWarehouse': 'Shipped',
        'AvailableForPickup': 'Ready for Pickup'
      };
      
      newStatus = statusMap[msg.tag] || statusMap[msg.status] || msg.status;
      
      // Try to find Order ID in custom fields or msg
      orderId = msg.order_id || msg.trackings?.custom_fields?.order_id;
      
      if (!orderId && trackingNumber) {
        const orderQuery = await db.collection('orders').where('trackingNumber', '==', trackingNumber).limit(1).get();
        if (!orderQuery.empty) {
          orderId = orderQuery.docs[0].id;
        }
      }
    }

    // 04. STATE_SYNC: Authoritatively update order
    if (orderId && newStatus) {
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (orderDoc.exists) {
        const orderData = orderDoc.data();
        const oldStatus = orderData?.status;

        // Only update if status changed
        if (newStatus !== oldStatus) {
          await orderRef.update({
            status: newStatus,
            trackingNumber: trackingNumber || orderData?.trackingNumber || '',
            carrier: carrierName || orderData?.carrier || '',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`[WEBHOOK] Order ${orderId} synchronized: ${oldStatus} -> ${newStatus}`);

          // 05. NOTIFICATION_TRIGGER: Queue customer alerts
          const notificationType = newStatus === 'Shipped' ? 'shipped' : 'statusChanged';
          
          await queueNotificationServer(
            db,
            notificationType,
            orderData?.email,
            {
              order_id: orderId.substring(0, 8).toUpperCase(),
              customer_name: orderData?.customer?.name || 'Customer',
              status: newStatus,
              courier: carrierName || 'Courier',
              tracking_number: trackingNumber || orderData?.trackingNumber || 'N/A',
              shipping_address: orderData?.customer?.shipping 
                ? `${orderData.customer.shipping.address}, ${orderData.customer.shipping.city}`
                : 'See order details'
            }
          );
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Protocol Synchronized' });
  } catch (error: any) {
    console.error('[WEBHOOK] Forensic Failure:', error);
    return NextResponse.json({ error: 'Internal Signal Error' }, { status: 500 });
  }
}
