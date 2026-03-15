import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

/**
 * @fileOverview Stallion Express Rate Discovery API
 * Authoritatively calculates shipping costs using credentials from Firestore or environment variables.
 */

// Authoritatively initialize the Admin SDK for backend operations if not already active
if (!admin.apps.length) {
  admin.initializeApp();
}

const STALLION_BASE_URL = 'https://api.stallionexpress.ca/v1';

/**
 * Key Verification Protocol:
 * Logs critical warnings if required environment variables are not Manifested.
 */
function verifyEnvironmentKeys() {
  if (!process.env.STALLION_API_KEY) {
    console.warn("CRITICAL: STALLION_API_KEY Key Missing.");
  }
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    console.warn("CRITICAL: NEXT_PUBLIC_PAYPAL_CLIENT_ID Key Missing.");
  }
}

export async function POST(request: Request) {
  try {
    verifyEnvironmentKeys();
    
    const db = getFirestore();
    const body = await request.json();
    const { to_address, parcel } = body;

    // 1. Authoritative Credential Retrieval
    const shippingConfigDoc = await db.collection('config').doc('shipping').get();
    const shippingConfig = shippingConfigDoc.data();
    const carriers = shippingConfig?.carriers || [];
    
    const stallionCarrier = carriers.find((c: any) => 
      (typeof c === 'string' ? c === 'STALLION EXPRESS' : c.name === 'STALLION EXPRESS')
    );

    const stallionApiToken = stallionCarrier?.apiKey || process.env.STALLION_API_KEY;

    if (!stallionApiToken || stallionApiToken === 'pending' || stallionApiToken === 'fslno_sample_key') {
      return NextResponse.json({ error: 'Stallion API protocol not configured in Admin UI.' }, { status: 500 });
    }

    // 2. Stallion Express Rate Protocol Handshake
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
        weight: parcel.weight || 0.5,
        weight_unit: 'kg',
        length: parcel.length || 30,
        width: parcel.width || 20,
        height: parcel.height || 10,
        dimension_unit: 'cm'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[STALLION] API Error:', data);
      return NextResponse.json({ error: data.message || 'Logistics handshake failed.' }, { status: response.status });
    }

    // 3. Mapped Manifest for Storefront UI
    const mappedRates = (data.rates || []).map((rate: any) => {
      let label = 'Standard Shipping';
      let type = 'standard';

      const name = rate.service_name.toLowerCase();
      if (name.includes('express') || name.includes('fedex') || name.includes('ups')) {
        label = 'Express Delivery';
        type = 'express';
      } else if (name.includes('postnl') || name.includes('apc') || name.includes('economy')) {
        label = 'Economy Tracked';
        type = 'economy';
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
  } catch (error) {
    console.error('[STALLION] Internal Protocol Error:', error);
    return NextResponse.json({ error: 'Internal logistics error.' }, { status: 500 });
  }
}
