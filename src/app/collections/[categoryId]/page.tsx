'use client';

import React, { use, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { ProductCard } from '@/components/storefront/ProductCard';
import { TestimonialSection } from '@/components/storefront/TestimonialSection';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ categoryId: string }>;
}

export default function CollectionPage(props: PageProps) {
  const { categoryId } = use(props.params);
  
  const db = useFirestore();

  // Global Review Config
  const reviewConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'reviews') : null, [db]);
  const { data: reviewConfig } = useDoc(reviewConfigRef);

  // Fetch Category Details - skip if 'all'
  const categoryRef = useMemoFirebase(() => 
    db && categoryId !== 'all' ? doc(db, 'categories', categoryId) : null, 
    [db, categoryId]
  );
  const { data: category, isLoading: categoryLoading } = useDoc(categoryRef);

  // If 'all', fetch all categories to map IDs to names for the cards
  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'categories');
  }, [db]);
  const { data: allCategories } = useCollection(categoriesQuery);

  // Fetch Products in this Category
  const productsQuery = useMemoFirebase(() => {
    if (!db || !categoryId) return null;
    if (categoryId === 'all') return collection(db, 'products');
    return query(collection(db, 'products'), where('categoryId', '==', categoryId));
  }, [db, categoryId]);

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  // Fetch reviews for rating aggregation
  const reviewsQuery = useMemoFirebase(() => db ? collection(db, 'reviews') : null, [db]);
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

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const isLoading = (categoryId !== 'all' && categoryLoading) || productsLoading;
  const reviewsEnabled = reviewConfig?.enabled !== false;

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-28 sm:pt-36 pb-12 border-b bg-white">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors w-fit">
              <ChevronLeft className="h-3 w-3" /> Back to Studio
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-[0.3em] font-bold text-muted-foreground">Studio Selection</span>
                <h1 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight">
                  {categoryId === 'all' ? 'All Studio Drops' : (category?.name || 'Collection')}
                </h1>
                {(category?.description || categoryId === 'all') && (
                  <p className="text-sm text-gray-500 max-w-2xl leading-relaxed uppercase tracking-tight">
                    {categoryId === 'all' 
                      ? 'Discover our sculptural silhouettes and technical studio pieces.' 
                      : category?.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="py-20">
        <div className="max-w-[1440px] mx-auto px-4">
          {!products || products.length === 0 ? (
            <div className="text-center py-32 border-2 border-dashed rounded-none bg-gray-50/50">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">The studio is currently empty for this drop.</p>
              <Button asChild variant="outline" className="mt-8 border-black font-bold uppercase tracking-[0.2em] text-[10px] h-14 px-10 rounded-none hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out">
                <Link href="/">Explore Featured Drops</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16">
              {products.map((product: any) => {
                const productCategory = category?.name || allCategories?.find(c => c.id === product.categoryId)?.name || 'Archive';
                const ratingInfo = productRatings[product.id];
                const avgRating = reviewsEnabled && ratingInfo ? ratingInfo.sum / ratingInfo.count : 0;
                const reviewCount = reviewsEnabled && ratingInfo ? ratingInfo.count : 0;
                const isSoldOut = (Number(product.inventory) || 0) <= 0;

                return (
                  <ProductCard 
                    key={product.id} 
                    id={product.id}
                    name={product.name}
                    price={`C$${formatCurrency(Number(product.price))}`}
                    comparedPrice={product.comparedPrice}
                    image={product.media?.[0]?.url || ''}
                    hoverImage={product.media?.[1]?.url}
                    category={productCategory}
                    rating={avgRating}
                    reviewCount={reviewCount}
                    isSoldOut={isSoldOut}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <TestimonialSection />

      <Footer />
    </main>
  );
}
