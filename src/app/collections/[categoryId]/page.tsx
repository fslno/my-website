'use client';

import React, { use, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { ProductCard } from '@/components/storefront/ProductCard';
import { TestimonialSection } from '@/components/storefront/TestimonialSection';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { getLivePath } from '@/lib/deployment';

interface PageProps {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function CollectionPage(props: PageProps) {
  const resolvedParams = React.use(props.params);
  const { categoryId } = resolvedParams;
  
  const db = useFirestore();

  // Global Review Config
  const reviewConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/reviews')) : null, [db]);
  const { data: reviewConfig } = useDoc(reviewConfigRef);

  // Fetch Category Details
  const categoryRef = useMemoFirebase(() => 
    db && categoryId !== 'all' ? doc(db, getLivePath(`categories/${categoryId}`)) : null, 
    [db, categoryId]
  );
  const { data: category, isLoading: categoryLoading } = useDoc(categoryRef);

  const categoriesQuery = useMemoFirebase(() => db ? collection(db, getLivePath('categories')) : null, [db]);
  const { data: allCategories } = useCollection(categoriesQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !categoryId) return null;
    const path = getLivePath('products');
    if (categoryId === 'all') return collection(db, path);
    return query(collection(db, path), where('categoryId', '==', categoryId));
  }, [db, categoryId]);

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

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

  if (categoryLoading || productsLoading) return <div className="min-h-screen bg-white" />;

  const reviewsEnabled = reviewConfig?.enabled !== false;

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-28 sm:pt-36 pb-12 border-b">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors w-fit">
              <ChevronLeft className="h-3 w-3" /> Home
            </Link>
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Collection</span>
              <h1 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight">
                {categoryId === 'all' ? 'All Products' : (category?.name || 'Collection')}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <section className="py-20">
        <div className="max-w-[1440px] mx-auto px-4">
          {!products || products.length === 0 ? (
            <div className="text-center py-32 border-2 border-dashed rounded-none bg-gray-50/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No products found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16">
              {products.map((product: any) => {
                const productCategory = category?.name || allCategories?.find(c => c.id === product.categoryId)?.name || 'Product';
                const ratingInfo = productRatings[product.id];
                return (
                  <ProductCard 
                    key={product.id} 
                    id={product.id}
                    name={product.name}
                    price={`C$${(Number(product.price) || 0).toFixed(2)}`}
                    comparedPrice={product.comparedPrice}
                    image={product.media?.[0]?.url || ''}
                    hoverImage={product.media?.[1]?.url}
                    category={productCategory}
                    sku={product.sku}
                    rating={reviewsEnabled && ratingInfo ? ratingInfo.sum / ratingInfo.count : 0}
                    reviewCount={reviewsEnabled && ratingInfo ? ratingInfo.count : 0}
                    isSoldOut={(Number(product.inventory) || 0) <= 0}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <TestimonialSection />
    </div>
  );
}
