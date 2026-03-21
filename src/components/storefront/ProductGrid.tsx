'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { ProductCard } from '@/components/storefront/ProductCard';
import { getLivePath } from '@/lib/deployment';

/**
 * Unified Product Grid Manifest.
 * Authoritatively manifests all studio drops in a high-fidelity responsive grid.
 * Optimized for mobile-first visual density and high-velocity conversion.
 */
export function ProductGrid() {
  const db = useFirestore();

  // 01. Catalog Ingestion
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, getLivePath('products')), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  // 02. Metadata Synchronization
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

  // Forensic Constant for grid classes to ensure zero hydration mismatch
  // Optimized for mobile-first density: 2 columns on small screens, 4 on desktop
  const gridClasses = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-8 sm:gap-y-16";

  if (productsLoading) {
    return null;
  }

  const reviewsEnabled = reviewConfig?.enabled !== false;

  return (
    <div className="max-w-[1440px] mx-auto px-4 pt-0 pb-24">
      <div className={gridClasses}>
        {products?.map((product: any, idx: number) => {
          const productCategory = categories?.find(c => c.id === product.categoryId)?.name || 'Archive';
          const ratingInfo = productRatings[product.id];
          const avgRating = reviewsEnabled && ratingInfo ? ratingInfo.sum / ratingInfo.count : 0;
          const reviewCount = reviewsEnabled && ratingInfo ? ratingInfo.count : 0;
          const isSoldOut = (Number(product.inventory) || 0) <= 0;

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
              priority={idx < 4}
            />
          );
        })}
      </div>
    </div>
  );
}
