import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getLivePath } from '@/lib/deployment';

const STALLION_BASE_URL = 'https://stallionexpress.ca/api/v1';
const SYNC_API_KEY = '4disCJPKssZQwxz5fHzN532w4Y0WW3eZGWXDQ0VJ9e7rbgiUz0qIswiH568H';

/**
 * Stallion Express Automated Fulfillment Protocol
 * Purpose: Transmute Storefront Orders into Live Carrier Shipments.
 * Authoritative Endpoint: POST /api/shipping/stallion/shipments
 */
export async function POST(request: Request) {
  try {
    const { orderId, rateId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required for fulfillment.' }, { status: 400 });
    }

    // 01. Context Extraction: Order & Configuration
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Logistics Target (Order) not found.' }, { status: 404 });
    }

    const order = orderDoc.data();
    const shippingConfig = (await adminDb.doc(getLivePath('config/shipping')).get()).data();
    const storeConfig = (await adminDb.doc(getLivePath('config/store')).get()).data();

    // 02. Credential Verification
    const stallionCarrier = shippingConfig?.carriers?.find((c: any) => 
      (typeof c === 'string' ? c === 'STALLION EXPRESS' : c.name === 'STALLION EXPRESS')
    );

    let stallionApiToken = stallionCarrier?.apiKey;
    if (!stallionApiToken || stallionApiToken === 'pending' || stallionApiToken === 'fslno_sample_key') {
      stallionApiToken = SYNC_API_KEY;
    }

    const isSimulation = stallionApiToken === 'fslno_sample_key';

    if (isSimulation) {
      console.warn('[STALLION] Operating in LOGISTICS SIMULATION mode. No live label created.');
      
      const mockTracking = `FSLNO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      // Update Order with Simulation Data
      await adminDb.collection('orders').doc(orderId).update({
        status: 'shipped',
        trackingNumber: mockTracking,
        courier: 'Stallion Express (Simulated)',
        shippedAt: new Date().toISOString(),
        fulfillmentMethod: 'automated-simulation'
      });

      return NextResponse.json({
        success: true,
        message: 'Simulation fulfillment successful.',
        trackingNumber: mockTracking,
        carrier: 'Stallion Express (Simulated)'
      });
    }

    // 03. Live Payload Construction
    // Note: Reconstructing to_address from order data
    const ship = order?.customer?.shipping;
    if (!ship || !ship.address || !ship.postalCode) {
      return NextResponse.json({ error: 'Incomplete shipping manifest (address missing).' }, { status: 400 });
    }

    // Mapping rateId to service code (if applicable)
    // Common Stallion service codes: 'usps_first_class', 'canada_post_expedited', etc.
    const serviceCode = rateId?.includes('manual') ? 'standard' : (rateId || 'standard');

    const payload = {
      from_address: storeConfig?.originAddress || '',
      from_city: storeConfig?.originCity || '',
      from_province: storeConfig?.originProvince || '',
      from_postal_code: storeConfig?.originPostalCode || '',
      from_country_code: storeConfig?.originCountryCode || 'CA',
      
      to_name: order?.customer?.name || 'Customer',
      to_address: ship.address,
      to_city: ship.city,
      to_province: ship.province,
      to_postal_code: ship.postalCode,
      to_country: ship.country === 'Canada' ? 'CA' : 'US',
      to_phone: order?.customer?.phone || '',
      to_email: order?.email || '',
      
      // Package details from order or defaults
      weight: Number(order?.shippingWeight || 0.6),
      weight_unit: 'kg',
      length: 35,
      width: 25,
      height: 10,
      dimension_unit: 'cm',
      
      description: `Order #${orderId.substring(0, 8)}`,
      value: Number(order?.total || 1),
      currency: 'CAD',
      
      // Reference
      reference: orderId,
      
      // Force selected service if provided
      service: serviceCode
    };

    // 04. API Transmission
    const response = await fetch(`${STALLION_BASE_URL}/shipments/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stallionApiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[STALLION] Shipment Creation Refused:', result);
      return NextResponse.json({ 
        error: 'Stallion API Error: ' + (result.message || 'Unknown protocol failure.'),
        details: result
      }, { status: 502 });
    }

    // 05. Success Logic: Update Firestore
    const trackingNumber = result.shipment?.tracking_number || result.tracking_number;
    
    await adminDb.collection('orders').doc(orderId).update({
      status: 'shipped',
      trackingNumber: trackingNumber,
      courier: 'Stallion Express',
      shippedAt: new Date().toISOString(),
      stallionShipmentId: result.shipment?.id || result.id,
      fulfillmentMethod: 'automated-api'
    });

    return NextResponse.json({
      success: true,
      trackingNumber,
      carrier: 'Stallion Express',
      shipment: result.shipment || result
    });

  } catch (error: any) {
    console.error('[STALLION] Fulfillment Exception:', error);
    return NextResponse.json({ error: 'Logistics stack failure: ' + error.message }, { status: 500 });
  }
}
