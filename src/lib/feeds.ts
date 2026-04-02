import { getAdminDb } from './firebase-admin';
import { LIVE_DOMAIN } from './paths';

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

/**
 * Generates an XML product feed compatible with Google, Meta, Pinterest, and others.
 */
export async function generateProductFeed(platform: 'google' | 'facebook' | 'pinterest' | 'rss' = 'google') {
  const adminDb = getAdminDb();
  
  // 1. Fetch Domain Config for the base URL
  const domainDoc = await adminDb.collection('config').doc('domain').get();
  const domainConfig = domainDoc.data();
  const domain = domainConfig?.primaryDomain || LIVE_DOMAIN;
  const baseUrl = `https://${domain}`;

  // 2. Fetch Active Products
  const productsSnapshot = await adminDb.collection('products').where('status', '==', 'active').get();
  const products = productsSnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  })) as any[];

  const feedTitles = {
    google: 'FSLNO Sport Google Catalog',
    facebook: 'FSLNO Sport Meta Catalog',
    pinterest: 'FSLNO Sport Pinterest Catalog',
    rss: 'FSLNO Sport Product RSS'
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${xmlEscape(feedTitles[platform] || feedTitles.google)}</title>
    <link>${xmlEscape(baseUrl)}</link>
    <description>${xmlEscape('Official archival product feed for FSLNO Sport Jerseys and Accessories.')}</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;

  products.forEach(product => {
    const price = product.price || 0;
    const salePrice = product.salePrice || null;
    const imageUrl = product.media?.[0]?.url || '';
    const productUrl = `${baseUrl}/products/${product.id}`;
    
    // Process description (Strip HTML and limit length for XML standards)
    let description = (product.description || product.name || '').replace(/<[^>]*>?/gm, '');
    if (description.length > 5000) description = description.substring(0, 4997) + '...';

    // Availability status according to Google/Social standards
    const availability = product.stock > 0 ? 'in stock' : 'out of stock';
    
    xml += `
    <item>
      <g:id>${xmlEscape(product.id)}</g:id>
      <g:title>${xmlEscape(product.name)}</g:title>
      <g:description>${xmlEscape(description)}</g:description>
      <g:link>${xmlEscape(productUrl)}</g:link>
      <g:image_link>${xmlEscape(imageUrl)}</g:image_link>
      <g:brand>FSLNO</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price} CAD</g:price>
      ${salePrice ? `<g:sale_price>${salePrice} CAD</g:sale_price>` : ''}
      <g:product_type>${xmlEscape(product.category || 'Apparel')}</g:product_type>
      <g:google_product_category>212</g:google_product_category>
      <g:shipping>
        <g:country>CA</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 CAD</g:price>
      </g:shipping>
    </item>`;
  });

  xml += `
  </channel>
</rss>`;

  return xml;
}
