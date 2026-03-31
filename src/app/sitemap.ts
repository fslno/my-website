import { MetadataRoute } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';
import { LIVE_DOMAIN } from '@/lib/deployment';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = `https://${LIVE_DOMAIN}`;
  const adminDb = getAdminDb();

  // 1. Fetch Products
  const productsSnapshot = await adminDb.collection('products').where('status', '==', 'active').get();
  const productEntries = productsSnapshot.docs.map((doc: any) => ({
    url: `${baseUrl}/products/${doc.id}`,
    lastModified: doc.updateTime?.toDate() || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 2. Fetch Categories
  const categoriesSnapshot = await adminDb.collection('categories').get();
  const categoryEntries = categoriesSnapshot.docs.map((doc: any) => ({
    url: `${baseUrl}/collections/${doc.id}`,
    lastModified: doc.updateTime?.toDate() || new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // 3. Static Pages
  const staticPages = [
    '',
    '/collections/all',
    '/contact',
    '/about',
    '/shipping',
    '/returns',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.5,
  }));

  return [...staticPages, ...productEntries, ...categoryEntries];
}
