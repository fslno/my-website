
import { NextResponse } from 'next/server';

/**
 * @fileOverview Stallion Express Rate Discovery API
 * Authoritatively calculates shipping costs based on parcel metrics and destination.
 */

const STALLION_API_KEY = process.env.STALLION_API_KEY;
const STALLION_BASE_URL = 'https://api.stallionexpress.ca/v1';

export async function POST(request: Request) {
  if (!STALLION_API_KEY) {
    return NextResponse.json({ error: 'Stallion API protocol not configured.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { to_address, parcel, from_address } = body;

    // Stallion Express Rate Protocol Handshake
    const response = await fetch(`${STALLION_BASE_URL}/rates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STALLION_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to_country: to_address.country_code || 'CA',
        to_postal_code: to_address.postal_code,
        to_city: to_address.city,
        to_province: to_address.province,
        weight: parcel.weight || 0.5, // kg
        weight_unit: 'kg',
        length: parcel.length || 30, // cm
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

    // Filter and Label for High-Fidelity Storefront UI
    const mappedRates = data.rates.map((rate: any) => {
      let label = 'Standard Shipping';
      let type = 'standard';

      const name = rate.service_name.toLowerCase();
      if (name.includes('express') || name.includes('fedex') || name.includes('ups')) {
        label = 'Express Delivery';
        type = 'express';
      } else if (name.includes('postnl') || name.includes('apc') || name.includes('economy')) {
        label = 'Economy Tracked';
        type = 'economy';
      } else if (name.includes('stallion u.s. tracked')) {
        label = 'Standard Shipping';
        type = 'standard';
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
