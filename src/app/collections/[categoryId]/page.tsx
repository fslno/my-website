import React from 'react';
import { Metadata } from 'next';
import Script from 'next/script';
import { getAdminDb } from '@/lib/firebase-admin';
import { getLivePath } from '@/lib/paths';
import { CollectionPageContent } from './CollectionPageContent';

interface PageProps {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { categoryId } = await props.params;
  
  try {
    const adminDb = getAdminDb();
    const [categoryDoc, domainDoc] = await Promise.all([
      categoryId !== 'all' ? adminDb.doc(getLivePath(`categories/${categoryId}`)).get() : null,
      adminDb.doc('config/domain').get()
    ]);

    const category = categoryDoc?.data() || {};
    const domain = domainDoc?.data() || {};
    const primaryDomain = domain?.primaryDomain || "fslno.ca";

    const title = categoryId === 'all' ? "Shop All Products" : (category.name || "Collection");
    const description = category.description || `Explore our high-quality ${title} at Feiselino (FSLNO). Official sport jerseys and apparel.`;
    const canonical = `https://${primaryDomain}/collections/${categoryId}`;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        type: 'website',
        images: category.image ? [{ url: category.image }] : [],
      },
    };
  } catch (err) {
    return { title: 'Collection' };
  }
}

export default async function Page(props: PageProps) {
  const { categoryId } = await props.params;

  // Fetch data for structured data (JSON-LD)
  let products: any[] = [];
  let categoryName = "All Products";

  try {
    const adminDb = getAdminDb();
    const productsPath = getLivePath('products');
    let productsQuery;
    
    if (categoryId === 'all') {
      productsQuery = adminDb.collection(productsPath).limit(20);
    } else {
      productsQuery = adminDb.collection(productsPath).where('categoryId', '==', categoryId).limit(20);
      const catDoc = await adminDb.doc(getLivePath(`categories/${categoryId}`)).get();
      if (catDoc.exists) {
        categoryName = catDoc.data()?.name || categoryName;
      }
    }

    const snapshot = await productsQuery.get();
    products = snapshot.docs.map((doc: any) => ({ id: doc.id, ...JSON.parse(JSON.stringify(doc.data() || {})) }));
  } catch (err) {
    console.warn("[COLLECTION_SSR_FETCH_ERROR]", err);
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
          "name": categoryName,
          "item": `https://fslno.ca/collections/${categoryId}`
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": categoryName,
      "itemListElement": products.map((p, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://fslno.ca/products/${p.id}`,
        "name": p.name,
        "image": p.media?.[0]?.url || ""
      }))
    }
  ];

  return (
    <>
      <Script
        id="collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CollectionPageContent categoryId={categoryId} />
    </>
  );
}
