
import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

/**
 * @fileOverview High-Velocity Shipping Webhook Endpoint.
 * Forensicly synchronizes external carrier signals with the archival order manifest.
 */

if (!admin.apps.length) {
  admin.initializeApp();
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
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
      type: 'shipping_sync',
      status: 'success'
    });

    // 03. STATE_SYNC: Authoritatively update order or product manifest
    // Expects payload: { orderId: string, status: string, trackingNumber?: string }
    if (body.orderId && body.status) {
      const orderRef = db.collection('orders').doc(body.orderId);
      const orderDoc = await orderRef.get();

      if (orderDoc.exists) {
        await orderRef.update({
          status: body.status,
          trackingNumber: body.trackingNumber || orderDoc.data()?.trackingNumber || '',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[WEBHOOK] Order ${body.orderId} forensicly synchronized to ${body.status}.`);
      }
    }

    return NextResponse.json({ success: true, message: 'Protocol Synchronized' });
  } catch (error: any) {
    console.error('[WEBHOOK] Forensic Failure:', error);
    return NextResponse.json({ error: 'Internal Signal Error' }, { status: 500 });
  }
}
