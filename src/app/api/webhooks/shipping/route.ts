import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { queueNotificationServer } from '@/lib/notifications-server';
import * as admin from 'firebase-admin';

/**
 * @fileOverview Shipping Update Receiver.
 * This updates the website when a package is shipped or moves.
 * Works with: Stallion Express, AfterShip, and others.
 */

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('x-webhook-secret');
  const envSecret = process.env.WEBHOOK_SECRET || 'fslno_archival_key';

  // Check if the sender is allowed to send data.
  if (!secret || secret !== envSecret) {
    console.error('[WEBHOOK] Someone tried to access this without a key.');
    return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const db = getAdminDb();
    
    // Check if db is a mock
    if (db === null) {
      console.warn('[WEBHOOK] Firestore Admin not initialized.');
    }

    // Save the incoming data to our logs.
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
    if (body.event === 'tracking.update' && body.msg) {
      const msg = body.msg;
      trackingNumber = msg.tracking_number;
      carrierName = msg.carrier_name || msg.carrier || 'AfterShip';
      
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
      orderId = msg.order_id || msg.trackings?.custom_fields?.order_id;
      
      if (!orderId && trackingNumber) {
        const orderQuery = await db.collection('orders').where('trackingNumber', '==', trackingNumber).limit(1).get();
        if (!orderQuery.empty) {
          orderId = orderQuery.docs[0].id;
        }
      }
    }

    // Update the order in the database.
    if (orderId && newStatus) {
      const orderRef = db.collection('orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (orderDoc.exists) {
        const orderData = orderDoc.data();
        const oldStatus = orderData?.status;

        if (newStatus !== oldStatus) {
          await orderRef.update({
            status: newStatus,
            trackingNumber: trackingNumber || orderData?.trackingNumber || '',
            carrier: carrierName || orderData?.carrier || '',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`[WEBHOOK] Order ${orderId} updated: ${oldStatus} -> ${newStatus}`);

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
    console.error('[WEBHOOK] Error saving data:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
