import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

/**
 * @fileOverview Stallion Express Rate Discovery API (Backend Layer)
 * Authoritatively calculates shipping costs using credentials from Firestore.
 * Implements a 15-second timeout and multi-service mapping protocol.
 */

if (!admin.apps.length) {
  admin.initializeApp();
}

const STALLION_BASE_URL = 'https://api.stallionexpress.ca/v1';

export async function POST(request: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout protocol

  try {
    const db = getFirestore();
    const body = await request.json();
    const { to_address, parcel } = body;

    // 1. Authoritative Configuration Check
    const shippingConfigDoc = await db.collection('config').doc('shipping').get();
    const shippingConfig = shippingConfigDoc.data();
    const carriers = shippingConfig?.carriers || [];
    
    const stallionCarrier = carriers.find((c: any) => 
      (typeof c === 'string' ? c === 'STALLION EXPRESS' : c.name === 'STALLION EXPRESS')
    );

    // 2. Security Gate: Verify active status and token manifest
    const stallionApiToken = stallionCarrier?.apiKey;
    const isActive = stallionCarrier?.active !== false;

    if (!isActive) {
      console.warn('CRITICAL: [Stallion Express] Protocol deactivated by administrator.');
      return NextResponse.json({ error: 'Stallion Express is currently deactivated.' }, { status: 503 });
    }

    if (!stallionApiToken || stallionApiToken === 'pending' || stallionApiToken === 'fslno_sample_key') {
      console.warn('CRITICAL: [Stallion Express] API Key Missing in Firestore Manifest.');
      return NextResponse.json({ error: 'Logistics provider configuration incomplete.' }, { status: 503 });
    }

    // 3. Stallion Express API Handshake with Timeout
    const response = await fetch(`${STALLION_BASE_URL}/rates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stallionApiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to_country: to_address.country_code || 'CA',
        to_postal_code: to_address.postal_code,
        to_city: to_address.city,
        to_province: to_address.province,
        weight: parcel.weight || 0.6,
        weight_unit: 'kg',
        length: parcel.length || 35,
        width: parcel.width || 25,
        height: parcel.height || 10,
        dimension_unit: 'cm'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      console.error('[STALLION] API Error Response:', data);
      return NextResponse.json({ error: data.message || 'Carrier service unavailable.' }, { status: response.status });
    }

    // 4. Multi-Service Mapped Manifest
    // Ensure we return ALL available rates to the frontend
    const mappedRates = (data.rates || []).map((rate: any) => {
      let label = 'Standard Shipping';
      let type = 'standard';

      const name = rate.service_name.toLowerCase();
      // Precise mapping based on service identity
      if (name.includes('express') || name.includes('fedex') || name.includes('ups') || name.includes('priority')) {
        label = 'Express Delivery';
        type = 'express';
      } else if (name.includes('postnl') || name.includes('apc') || name.includes('economy') || name.includes('packet')) {
        label = 'Economy Tracked';
        type = 'economy';
      } else if (name.includes('usps') || name.includes('usa tracked')) {
        label = 'Standard Shipping';
        type = 'standard';
      } else {
        label = rate.service_name;
      }

      return {
        id: rate.rate_id,
        service: rate.service_name,
        label: label,
        price: parseFloat(rate.total_price),
        currency: rate.currency,
        days: rate.delivery_days,
        type: type
      };
    });

    return NextResponse.json({ rates: mappedRates });
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('[STALLION] API Handshake timed out after 15 seconds.');
      return NextResponse.json({ error: 'Logistics discovery timeout.' }, { status: 504 });
    }
    console.error('[STALLION] Internal Protocol Error:', error);
    return NextResponse.json({ error: 'Internal logistics dispatch error.' }, { status: 500 });
  }
}
