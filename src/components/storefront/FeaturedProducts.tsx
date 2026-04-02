'use client';

import React, { useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, where, doc } from 'firebase/firestore';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Loader2, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getLivePath } from '@/lib/paths';

/**
 * Featured Products section.
 * Shows the latest popular items.
 */
export function FeaturedProducts() {
  const db = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, getLivePath('products')), 
      orderBy('createdAt', 'desc'), 
      limit(4)
    );
  }, [db]);

  const { data: products, isLoading } = useCollection(productsQuery);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, getLivePath('categories'));
  }, [db]);
  const { data: categories } = useCollection(categoriesQuery);
  
  const reviewConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/reviews')) : null, [db]);
  const { data: reviewConfig } = useDoc(reviewConfigRef);

  const reviewsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'reviews');
  }, [db]);
  const { data: allReviews } = useCollection(reviewsQuery);

  const productRatings = useMemo(() => {
    const map: Record<string, { sum: number, count: number }> = {};
    if (!allReviews) return map;
    
    allReviews.forEach(r => {
      if (!r.published) return;
      if (!map[r.productId]) map[r.productId] = { sum: 0, count: 0 };
      map[r.productId].sum += (r.rating || 0);
      map[r.productId].count += 1;
    });
    return map;
  }, [allReviews]);

  const reviewsEnabled = reviewConfig?.enabled !== false;

  useEffect(() => {
    if (!isLoading && products?.length) {
      if (typeof window !== 'undefined') {
        const lastId = sessionStorage.getItem('lastProductId');
        if (lastId) {
          setTimeout(() => {
            const el = document.getElementById(`product-${lastId}`);
            if (el) {
              const y = el.getBoundingClientRect().top + window.scrollY - 150;
              window.scrollTo({ top: y, behavior: 'instant' });
              sessionStorage.removeItem('lastProductId');
            }
          }, 200);
        }
      }
    }
  }, [isLoading, products]);

  if (isLoading) {
    return (
      <section className="py-24 bg-background">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="text-center mb-20 space-y-4">
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-10 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="w-full aspect-square rounded-sm" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="py-24 bg-background">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="text-center mb-20 space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold">Spotlight</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight">Featured Products</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-16 max-w-[1095.6px] mx-auto">
          {products.map((product: any) => {
            const productCategory = categories?.find(c => c.id === product.categoryId)?.name || 'General';
            const ratingInfo = productRatings[product.id];
            const avgRating = reviewsEnabled && ratingInfo ? ratingInfo.sum / ratingInfo.count : 0;
            const reviewCount = reviewsEnabled && ratingInfo ? ratingInfo.count : 0;
            
            // Check total stock across all sizes
            const variants = product.variants || [];
            const totalStock = variants.length > 0 
                ? variants.reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0)
                : Number(product.inventory) || 0;

            const isSoldOut = totalStock <= 0;

            return (
              <ProductCard 
                key={product.id} 
                id={product.id}
                name={product.name}
                price={`C$${(Number(product.price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                comparedPrice={product.comparedPrice}
                image={product.media?.[0]?.url || ''}
                hoverImage={product.media?.[1]?.url}
                category={productCategory}
                sku={product.sku}
                rating={avgRating}
                reviewCount={reviewCount}
                isSoldOut={isSoldOut}
                inventory={totalStock}
                isCustomizable={product.customizable}
                preorderEnabled={product.preorderEnabled}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
