import React from 'react';
import { getAdminDb } from '@/lib/firebase-admin';
import { serializeData } from '@/lib/utils';
import HomeClient from '@/components/storefront/HomeClient';
import { getLivePath } from '@/lib/paths';

/**
 * Main Home Page - RECONSTRUCTED as a Server Component.
 * Fetches initial content (Theme, Categories, Products) server-side 
 * to ensure zero-flicker transitions and instant initial load.
 */
export default async function Home() {
  const adminDb = getAdminDb();
  
  // 1. Fetch Theme Config
  const themeDoc = await adminDb.doc(getLivePath('config/theme')).get();
  const theme = serializeData(themeDoc.data()) || {};

  // 2. Fetch Categories (all active ones, usually < 20)
  const categoriesSnapshot = await adminDb.collection(getLivePath('categories'))
    .orderBy('order', 'asc')
    .get();
  const categories = categoriesSnapshot.docs.map((doc: any) => serializeData({ ...doc.data(), id: doc.id }));

  // 3. Fetch Initial Products (first batch of 20)
  const productsSnapshot = await adminDb.collection(getLivePath('products'))
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();
  const products = productsSnapshot.docs.map((doc: any) => serializeData({ ...doc.data(), id: doc.id }));

  return (
    <HomeClient 
      initialTheme={theme} 
      initialCategories={categories}
      initialProducts={products}
    />
  );
}
