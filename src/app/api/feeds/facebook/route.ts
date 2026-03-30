import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const xmlEscape = (str: any) => {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return m;
    }
  });
};

export async function GET() {
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const productsSnapshot = await getDocs(
      query(collection(db, 'products'), where('status', '==', 'active'))
    );

    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fslno.vercel.app';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${xmlEscape('FSLNO Sport Catalog')}</title>
    <link>${xmlEscape(baseUrl)}</link>
    <description>${xmlEscape('Official product feed for FSLNO Sport Jerseys and Accessories.')}</description>`;

    products.forEach(product => {
      const price = product.price || 0;
      const salePrice = product.salePrice || null;
      const imageUrl = product.media?.[0]?.url || '';
      const productUrl = `${baseUrl}/products/${product.id}`;
      const description = (product.description || product.name || '').replace(/<[^>]*>?/gm, ''); // Strip HTML
      
      xml += `
    <item>
      <g:id>${xmlEscape(product.id)}</g:id>
      <g:title>${xmlEscape(product.name)}</g:title>
      <g:description>${xmlEscape(description)}</g:description>
      <g:link>${xmlEscape(productUrl)}</g:link>
      <g:image_link>${xmlEscape(imageUrl)}</g:image_link>
      <g:brand>FSLNO</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${product.stock > 0 ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${price} CAD</g:price>
      ${salePrice ? `<g:sale_price>${salePrice} CAD</g:sale_price>` : ''}
    </item>`;
    });

    xml += `
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[FEED_GEN_ERROR]', error);
    return new NextResponse(`Error generating feed: ${error?.message || 'Unknown error'}`, { status: 500 });
  }
}
