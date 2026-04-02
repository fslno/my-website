import { MetadataRoute } from 'next';
import { LIVE_DOMAIN } from '@/lib/paths';
import { getAdminDb } from '@/lib/firebase-admin';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const adminDb = getAdminDb();
  const domainDoc = await adminDb.collection('config').doc('domain').get();
  const domainConfig = domainDoc.data();
  
  const domain = domainConfig?.primaryDomain || LIVE_DOMAIN;
  const isIndexingEnabled = domainConfig?.searchIndexingEnabled !== false;

  return {
    rules: {
      userAgent: '*',
      allow: isIndexingEnabled ? '/' : '',
      disallow: isIndexingEnabled 
        ? ['/admin/', '/checkout/success/', '/account/', '/api/'] 
        : '/',
    },
    sitemap: `https://${domain}/sitemap.xml`,
  };
}
