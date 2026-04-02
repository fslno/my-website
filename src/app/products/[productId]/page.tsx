import { getCachedProduct, getCachedTheme, getCachedDomain, getCachedCategories } from '@/lib/firebase-admin';
import { ProductDetail } from '@/components/storefront/ProductDetail';
import { Metadata } from 'next';
import Script from 'next/script';

interface PageProps {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const resolvedParams = await props.params;
  const { productId } = resolvedParams;

  try {
    const [product, domain] = await Promise.all([
      getCachedProduct(productId),
      getCachedDomain()
    ]);

    if (!product) {
      return {
        title: "Product Details",
      };
    }

    const title = product.name || "Product Details";
    const description = product.description?.substring(0, 160) || `Buy ${product.name} at FSLNO. High-quality jerseys and apparel.`;
    const image = product.media?.[0]?.url || "";
    const primaryDomain = (domain?.primaryDomain || "fslno.ca").trim();
    const baseUrl = `https://${primaryDomain}`;

    return {
      title,
      description,
      alternates: {
        canonical: `/products/${productId}`,
      },
      openGraph: {
        title,
        description,
        url: `${baseUrl}/products/${productId}`,
        images: image ? [{ url: image, alt: title }] : [],
        type: 'website', // Article is also fine, but breadcrumbs handle the rest
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

export const revalidate = 3600; // Cache for 1 hour

export default async function ProductDetailPage(props: PageProps) {
  const resolvedParams = await props.params;
  const { productId } = resolvedParams;

  let product: any = null;
  let categoryName = "Jerseys";
  let domain: any = null;
  let reviewsData = { sum: 0, count: 0 };

  try {
    const [productData, domainData, categories] = await Promise.all([
      getCachedProduct(productId),
      getCachedDomain(),
      getCachedCategories()
    ]);

    product = productData;
    domain = domainData;

    if (product) {
      const adminDb = (await import('@/lib/firebase-admin')).getAdminDb();
      const reviewsSnapshot = await adminDb.collection('reviews')
        .where('productId', '==', productId)
        .where('published', '==', true)
        .get();
      
      reviewsSnapshot.docs?.forEach((doc: any) => {
        reviewsData.sum += (Number(doc.data()?.rating) || 0);
        reviewsData.count += 1;
      });

      if (product.categoryId) {
        const cat = categories.find((c: any) => c.id === product.categoryId);
        if (cat) {
          categoryName = cat.name;
        }
      }
    }
  } catch (error: any) {
    console.warn("[PRODUCT_PAGE_DATA_ERROR]", error?.message || error);
  }

  const primaryDomain = (domain?.primaryDomain || "fslno.ca").trim();
  const siteUrl = `https://${primaryDomain}`;
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
      { 
        "@type": "ListItem", 
        "position": 2, 
        "name": categoryName, 
        "item": product?.categoryId ? `${siteUrl}/collections/${product.categoryId}` : `${siteUrl}/collections/all` 
      },
      { "@type": "ListItem", "position": 3, "name": product?.name || 'Product', "item": `${siteUrl}/products/${productId}` }
    ]
  };

  const productSchema = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.media?.map((m: any) => m.url) || [],
    "description": product.description || `Buy ${product.name} at FSLNO.`,
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
    } : {}),
    "offers": {
      "@type": "Offer",
      "url": `${siteUrl}/products/${product.id}`,
      "priceCurrency": "CAD",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": (product.variants?.some((v: any) => Number(v.stock) > 0)) 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock"
    }
  } : null;

  return (
    <div className="min-h-screen bg-white">
      <Script
        id="product-breadcrumbs"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {productSchema && (
        <Script
          id="product-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      <ProductDetail productId={productId} initialProduct={product} />
    </div>
  );
}
