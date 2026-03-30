import React from 'react';
import { adminDb } from '@/lib/firebase-admin';
import { ProductDetail } from '@/components/storefront/ProductDetail';
import { Metadata } from 'next';
import { getLivePath } from '@/lib/deployment';

interface PageProps {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const resolvedParams = await props.params;
  const { productId } = resolvedParams;

  try {
    const [productDoc, themeDoc] = await Promise.all([
      adminDb.doc(`products/${productId}`).get(),
      adminDb.doc('config/theme').get()
    ]);

    const product = productDoc.data();
    const theme = themeDoc.data();

    if (!product) {
      return {
        title: "Product Not Found",
      };
    }

    const title = `${product.name} | ${product.brand || theme?.businessName || 'FSLNO'}`;
    const description = product.description?.substring(0, 160) || `Buy ${product.name} at our store. High-quality jerseys and apparel.`;
    const image = product.media?.[0]?.url || "";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: image ? [{ url: image }] : [],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : [],
      },
    };
  } catch (error: any) {
    console.warn("Product metadata error silenced:", error?.message || "Internal error");
    return {
      title: "Product Details",
    };
  }
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  media?: { url: string }[];
  sku?: string;
  brand?: string;
  variants?: { size: string; stock: number }[];
  categoryId?: string;
  customizationEnabled?: boolean;
  customizationFee?: number;
}

export default async function ProductDetailPage(props: PageProps) {
  const resolvedParams = await props.params;
  const { productId } = resolvedParams;

  let product: Product | null = null;
  let reviewsData = { sum: 0, count: 0 };
  let categoryName = "Jerseys";

  try {
    const productDoc = await adminDb.doc(`products/${productId}`).get();
    product = productDoc.exists ? { id: productDoc.id, ...(productDoc.data() as any) } as Product : null;

    if (product) {
      // Fetch aggregate ratings
      const reviewsSnapshot = await adminDb.collection('reviews')
        .where('productId', '==', productId)
        .where('published', '==', true)
        .get();
      
      reviewsSnapshot.docs.forEach((doc: any) => {
        reviewsData.sum += (doc.data().rating || 0);
        reviewsData.count += 1;
      });

      // Try to get category name
      if (product.categoryId) {
        const catDoc = await adminDb.doc(getLivePath(`categories/${product.categoryId}`)).get();
        categoryName = catDoc.data()?.name || categoryName;
      }
    }
  } catch (error: any) {
    console.warn("Error fetching product details in page:", error?.message || error);
  }

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://fslno.ca" },
      { 
        "@type": "ListItem", 
        "position": 2, 
        "name": categoryName, 
        "item": product?.categoryId ? `https://fslno.ca/collections/${product.categoryId}` : "https://fslno.ca/collections/all" 
      },
      { "@type": "ListItem", "position": 3, "name": product?.name, "item": `https://fslno.ca/products/${productId}` }
    ]
  };

  const productSchema = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.media?.map((m: any) => m.url) || [],
    "description": product.description,
    "sku": product.sku,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "FSLNO"
    },
    ...(reviewsData.count > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": (reviewsData.sum / reviewsData.count).toFixed(1),
        "reviewCount": reviewsData.count
      }
    } : {
      // Default social proof if no reviews yet (optional, but keep it authentic if possible)
      // "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "12" }
    }),
    "offers": {
      "@type": "Offer",
      "url": `https://fslno.ca/products/${product.id}`,
      "priceCurrency": "CAD",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": (product.variants?.some((v: any) => v.stock > 0)) 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock"
    }
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      <ProductDetail productId={productId} initialProduct={product} />
    </>
  );
}
