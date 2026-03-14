'use client';

import React, { useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Header } from '@/components/storefront/Header';
import { BentoHero } from '@/components/storefront/BentoHero';
import { Footer } from '@/components/storefront/Footer';
import { ProductCard } from '@/components/storefront/ProductCard';
import { TestimonialSection } from '@/components/storefront/TestimonialSection';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function Home() {
  const db = useFirestore();

  useEffect(() => {
    // Authoritatively reset scroll position to the top on mount to ensure the viewport starts at the Hero Banner
    window.scrollTo(0, 0);
  }, []);

  // Fetch top categories for the collection grid - strictly ordered by curated 'order' field
  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), orderBy('order', 'asc'), limit(12));
  }, [db]);

  const { data: categories, isLoading: categoriesLoading } = useCollection(categoriesQuery);

  // Fetch top 8 products for "Featured Selection"
  const featuredQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(8));
  }, [db]);

  const { data: featuredProducts, isLoading: productsLoading } = useCollection(featuredQuery);

  // Global Review Config
  const reviewConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'reviews') : null, [db]);
  const { data: reviewConfig } = useDoc(reviewConfigRef);

  // Fetch all reviews for global rating aggregation (Zero-Error simple query)
  const reviewsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'reviews'));
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

  // Fetch theme for layout decisions
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: theme } = useDoc(themeRef);

  const isHeroLoading = categoriesLoading;
  const reviewsEnabled = reviewConfig?.enabled !== false;

  const heroImageSrc = theme?.heroImageUrl || categories?.[0]?.imageUrl || "";

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Selection based on Theme Config - Padding adjusted to pt-36 to clear fixed header/banner */}
      {theme?.homepageLayout === 'classic' ? (
        <section className="pt-36 pb-12">
          <div className="w-full overflow-hidden bg-primary shadow-2xl group border-b">
            <div className="relative h-[52.5vh] w-full">
              {heroImageSrc ? (
                <Image
                  src={heroImageSrc}
                  alt="Main Hero"
                  fill
                  className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-primary opacity-20" />
              )}
              <div className={cn(
                "absolute inset-0 flex flex-col text-primary-foreground p-12 bg-gradient-to-t from-black/60 via-transparent to-transparent hero-vertical-align"
              )}>
                <span className="text-[10px] uppercase tracking-[0.5em] font-bold mb-6">{theme?.heroSubheadline || "The Collection"}</span>
                <span className="hero-headline-size font-headline mb-10 tracking-tighter uppercase font-bold leading-none block">
                  {theme?.heroHeadline || "Modern Silhouettes"}
                </span>
                <Link href="/collections/all" className="hero-button px-12 h-14 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] hover:opacity-90 transition-all duration-300 ease-in-out shadow-xl active:scale-95">
                  {theme?.heroButtonText || "Shop All"}
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <BentoHero 
          isLoading={isHeroLoading} 
          heroImageUrl={theme?.heroImageUrl}
          headline={theme?.heroHeadline}
          subheadline={theme?.heroSubheadline}
          buttonText={theme?.heroButtonText}
          fallbackImageUrl={categories?.[0]?.imageUrl}
          textAlign={theme?.heroTextAlign}
          verticalAlign={theme?.heroVerticalAlign}
        />
      )}

      {/* Categories Selection - Reflects the curated sort order */}
      <section className="pt-24 pb-12 border-b bg-white">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex flex-col mb-16 gap-6 category-text-align">
            <div className="space-y-3">
              <h2 className="category-title-size category-title-color font-headline uppercase font-bold tracking-tighter">OUR CATEGORIES</h2>
            </div>
          </div>
          
          {categoriesLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-black/10" />
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-none bg-gray-50/50">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Collections coming soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {categories.map((cat: any) => (
                <div key={cat.id} className="group flex flex-col gap-4">
                  <Link 
                    href={`/collections/${cat.id}`} 
                    className="relative aspect-square overflow-hidden bg-gray-100 rounded-sm border shadow-sm"
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    {cat.imageUrl ? (
                      <Image 
                        src={cat.imageUrl} 
                        alt={cat.name} 
                        fill 
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-200" />
                    )}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </Link>
                  
                  <div className="space-y-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <h3 className="font-headline font-bold uppercase tracking-widest text-sm sm:text-lg leading-tight line-clamp-2">{cat.name}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Selection */}
      <section className="pt-12 pb-24 bg-background">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex flex-col mb-16 gap-6 featured-text-align">
            <div className="space-y-3">
              <h2 className="featured-title-size featured-title-color font-headline uppercase font-bold tracking-tighter">FEATURED PRODUCTS</h2>
            </div>
          </div>
          
          {productsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-black/10" />
            </div>
          ) : !featuredProducts || featuredProducts.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-none bg-gray-50/50">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Products coming soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16">
              {featuredProducts.map((product: any) => {
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
                    image={product.media?.[0]?.url || ''}
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
