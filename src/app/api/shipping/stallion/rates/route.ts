import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

/**
 * @fileOverview Stallion Express Rate Discovery API (Backend Layer)
 * Authoritatively calculates shipping costs using credentials from Firestore.
 * Implements a 15-second timeout and multi-service mapping protocol.
 * Features a Forensic Fallback Protocol to ensure checkout restoration during API latency.
 */

if (!admin.apps.length) {
  admin.initializeApp();
}

const STALLION_BASE_URL = 'https://api.stallionexpress.ca/v1';
// Authoritative API Token Sync: Verified manifest key for restoration
const SYNC_API_KEY = '4disCJPKssZQwxz5fHzN532w4Y0WW3eZGWXDQ0VJ9e7rbgiUz0qIswiH568H';

export async function POST(request: Request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout protocol

  try {
    const db = getFirestore();
    
    // 01. PAYLOAD_VALIDATION Protocol
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[STALLION] Payload Parsing Failure:', parseError);
      return NextResponse.json({ error: 'Malformed request body manifest.' }, { status: 400 });
    }

    const { to_address, parcel } = body;

    if (!to_address || !parcel) {
      console.warn('[STALLION] Incomplete logistics metadata ingested.');
      return NextResponse.json({ error: 'Logistics metadata incomplete.' }, { status: 400 });
    }

    // 02. API_KEY_SYNC Protocol
    const shippingConfigDoc = await db.collection('config').doc('shipping').get();
    const shippingConfig = shippingConfigDoc.data();
    const carriers = shippingConfig?.carriers || [];
    
    const stallionCarrier = carriers.find((c: any) => 
      (typeof c === 'string' ? c === 'STALLION EXPRESS' : c.name === 'STALLION EXPRESS')
    );

    // Prioritize SYNC_API_KEY if Firestore manifest is pending or default
    let stallionApiToken = stallionCarrier?.apiKey;
    if (!stallionApiToken || stallionApiToken === 'pending' || stallionApiToken === 'fslno_sample_key') {
      stallionApiToken = SYNC_API_KEY;
    }

    const isActive = stallionCarrier?.active !== false;

    if (!isActive) {
      console.warn('CRITICAL: [Stallion Express] Protocol deactivated by administrator.');
      return NextResponse.json({ error: 'Stallion Express is currently deactivated.' }, { status: 503 });
    }

    // Fetch origin address for carrier identification
    const origin = shippingConfig?.originAddress || {};

    // 03. Stallion Express API Handshake with Timeout
    const response = await fetch(`${STALLION_BASE_URL}/rates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stallionApiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        from_country_code: origin.countryCode || 'CA',
        from_postal_code: origin.postalCode,
        from_city: origin.city,
        from_province: origin.province,
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
    
    if (!response.ok) {
      const errorData = await response.json();
      // LOG_REFINEMENT: Surfacing granular failure data to Google Cloud Logs
      console.error('[STALLION] Carrier API Refusal:', {
        status: response.status,
        message: errorData.message || 'Unknown carrier error',
        requestPostal: to_address.postal_code
      });
      
      // FALLBACK_PROTOCOL: Return standard rate to prevent checkout crash
      return NextResponse.json({ rates: getFallbackRates() });
    }

    const data = await response.json();

    // 04. Multi-Service Mapped Manifest
    const mappedRates = (data.rates || []).map((rate: any) => {
      let label = 'Standard Shipping';
      let type = 'standard';

      const name = rate.service_name.toLowerCase();
      if (name.includes('express') || name.includes('fedex') || name.includes('ups') || name.includes('priority')) {
        label = 'Express Delivery';
        type = 'express';
      } else if (name.includes('postnl') || name.includes('apc') || name.includes('economy') || name.includes('packet')) {
        label = 'Economy Tracked';
        type = 'economy';
      } else {
        label = rate.service_name;
      }

      return {
        id: rate.rate_id,
        service: rate.service_name,
        label: label,
        price: parseFloat(rate.total_price) || 0,
        currency: rate.currency || 'CAD',
        days: rate.delivery_days || 'N/A',
        type: type
      };
    });

    return NextResponse.json({ rates: mappedRates });
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // LOG_REFINEMENT: Surface actual error message instead of generic 500
    if (error.name === 'AbortError') {
      console.error('[STALLION] API Timeout: Handshake aborted after 15s.');
    } else {
      console.error('[STALLION] Internal Protocol Error:', error.message || error);
    }

    // FALLBACK_PROTOCOL: Ensure checkout flow persists despite internal failure
    return NextResponse.json({ rates: getFallbackRates() });
  }
}

/**
 * Returns hard-coded archival rates to ensure flow continuity.
 */
function getFallbackRates() {
  return [{
    id: 'restoration-fallback',
    service: 'Standard Logistics',
    label: 'Standard Shipping',
    price: 0, // Handling fee and threshold applied by frontend component
    currency: 'CAD',
    days: '4-7',
    type: 'standard'
  }];
}
