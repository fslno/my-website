'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Sparkles } from 'lucide-react';
import { getLivePath } from '@/lib/deployment';

/**
 * Curated Featured Products segment.
 * Authoritatively removed loading spinners for peak velocity.
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

  if (isLoading || !products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-background">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="text-center mb-20 space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold">Spotlight</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight">Featured Silhouettes</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16">
          {products.map((product: any) => {
            const productCategory = categories?.find(c => c.id === product.categoryId)?.name || 'Archive';
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
                isSoldOut={isSoldOut}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}