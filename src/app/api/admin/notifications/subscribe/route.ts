import { NextRequest, NextResponse } from 'next/server';
import { getAdminMessaging } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const messaging = getAdminMessaging();
    if (!messaging) {
      throw new Error('Firebase Admin Messaging not initialized');
    }

    // Subscribe the token to the 'admin_orders' topic
    await messaging.subscribeToTopic(token, 'admin_orders');

    return NextResponse.json({ success: true, message: 'Subscribed to admin_orders' });
  } catch (error: any) {
    console.error('Error subscribing to topic:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
