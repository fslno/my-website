import { NextResponse } from 'next/server';
import { getAdminDb, getAdminFieldValue } from '@/lib/firebase-admin';
import { ClickShipClient, ClickShipOrder } from '@/lib/shipping/clickship';

export async function POST(request: Request) {
  try {
    const adminDb = getAdminDb();
    const FieldValue = getAdminFieldValue();

    // 1. Fetch Shipping Config to find ClickShip SFTP credentials
    const shippingConfigDoc = await adminDb.doc('config/shipping').get();
    if (!shippingConfigDoc.exists) {
      return NextResponse.json({ error: 'Shipping configuration not found.' }, { status: 404 });
    }

    const config = shippingConfigDoc.data();
    const carriers = config?.carriers || [];
    const clickShipCarrier = carriers.find((c: any) => 
      c.type === 'SFTP' && c.active === true && (c.name.includes('CLICKSIP') || c.name.includes('CLICKSHIP'))
    );

    if (!clickShipCarrier || !clickShipCarrier.sftp) {
      return NextResponse.json({ error: 'Active Clicksip SFTP carrier not configured.' }, { status: 400 });
    }

    // 2. Fetch Pending Orders for ClickShip synchronization
    // Optimization: We only fetch orders that are 'awaiting_processing' and have deliveryMethod 'shipping'
    const ordersSnapshot = await adminDb.collection('orders')
      .where('status', '==', 'awaiting_processing')
      .where('deliveryMethod', '==', 'shipping')
      .get();

    if (ordersSnapshot.empty) {
      return NextResponse.json({ message: 'No pending orders for Clicksip synchronization.' });
    }

    const ordersToSync: ClickShipOrder[] = ordersSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      const shipping = data.customer?.shipping || data.customer?.billing || {};
      
      return {
        id: doc.id,
        orderNumber: data.orderNumber || doc.id.slice(-8).toUpperCase(),
        customerName: data.customer?.name || 'Guest',
        addressLine1: shipping.address || '',
        city: shipping.city || '',
        provinceCode: shipping.province || '',
        postalCode: shipping.postalCode || '',
        countryCode: shipping.countryCode || 'CA',
        phoneNumber: data.customer?.phone || '',
        items: (data.items || []).map((item: any) => ({
          sku: item.sku || 'N/A',
          description: item.name + (item.size ? ` (${item.size})` : ''),
          quantity: item.quantity || 1,
          weight: item.weight || 0.5, // Default weight metric if missing
          value: item.price || 0
        }))
      };
    });

    // 3. Initialize ClickShip Client and upload XML manifest
    const client = new ClickShipClient(clickShipCarrier.sftp);
    const xmlManifest = client.generateManifest(ordersToSync);
    const filename = `fslno-manifest-${new Date().toISOString().replace(/[:.]/g, '-')}.xml`;

    const uploadSuccess = await client.uploadManifest(filename, xmlManifest);

    if (!uploadSuccess) {
      throw new Error('SFTP Upload failed without specific error.');
    }

    // 4. Update Order Statuses to 'processing' with a sync flag
    const batch = adminDb.batch();
    ordersSnapshot.docs.forEach((doc: any) => {
      batch.update(doc.ref, {
        status: 'processing',
        clickship_synced_at: FieldValue.serverTimestamp(),
        clickship_manifest: filename,
        updatedAt: FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      ordersProcessed: ordersToSync.length,
      manifest: filename
    });

  } catch (error: any) {
    console.error('[CLICKSHIP_SYNC_ROUTE_ERROR]', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Internal server error during Clicksip synchronization.' 
    }, { status: 500 });
  }
}
