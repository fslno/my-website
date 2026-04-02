import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminMessaging } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { orderId, customerName, total } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const db = getAdminDb();
    const messaging = getAdminMessaging();

    // 1. Verify order exists (Basic security)
    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderSnap.data();

    // 2. Prepare FCM Message
    const message = {
      notification: {
        title: '🚨 NEW ORDER RECEIVED',
        body: `${customerName || 'A customer'} just placed an order for ${total || 'C$' + orderData?.total}.`,
      },
      data: {
        orderId: orderId,
        type: 'new_order',
        click_action: '/admin/orders/' + orderId
      },
      topic: 'admin_orders'
    };

    // 3. Send FCM
    await messaging.send(message);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[NOTIFY-API] Failure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
