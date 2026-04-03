import React from 'react';
import { Metadata } from 'next';
import Script from 'next/script';
import { CollectionPageContent } from '../collections/[categoryId]/CollectionPageContent';
import { getAdminDb } from '@/lib/firebase-admin';
import { getLivePath } from '@/lib/paths';

export async function generateMetadata(): Promise<Metadata> {
  const adminDb = getAdminDb();
  const domainDoc = await adminDb.doc('config/domain').get();
  const domain = domainDoc?.data() || {};
  const primaryDomain = domain?.primaryDomain || "fslno.ca";
  
  return {
    title: "Shop All Products",
    description: "Browse our complete collection of high-quality Teams and apparel. Feiselino (FSLNO) Official Store.",
    alternates: {
      canonical: `https://${primaryDomain}/products`,
    },
    openGraph: {
      title: "Shop All Products | Feiselino (FSLNO)",
      description: "Official store catalog for high-quality jerseys and apparel.",
      url: `https://${primaryDomain}/products`,
      type: 'website',
    }
  };
}

export default async function ProductsPage() {
  // Structured Data for Google
  let products: any[] = [];
  try {
    const adminDb = getAdminDb();
    const productsPath = getLivePath('products');
    const snapshot = await adminDb.collection(productsPath).limit(30).get();
    
    if (snapshot && snapshot.docs) {
      products = snapshot.docs.map((doc: any) => {
        const data = JSON.parse(JSON.stringify(doc.data() || {}));
        return { id: doc.id, ...data };
      });
    }
  } catch (err) {
    console.error("[PRODUCTS_FETCH_FAIL]", err);
  }

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://fslno.ca"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Products",
          "item": "https://fslno.ca/products"
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Feiselino (FSLNO) Product Catalog",
      "itemListElement": products.map((p, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://fslno.ca/products/${p?.id || 'id'}`,
        "name": p?.name || "Product",
        "image": p?.media?.[0]?.url || ""
      }))
    }
  ];

  return (
    <>
      <Script
        id="all-products-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CollectionPageContent categoryId="all" />
    </>
  );
}
