'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Header } from '@/components/storefront/Header';
import { BentoHero } from '@/components/storefront/BentoHero';
import { Footer } from '@/components/storefront/Footer';
import { ProductCard } from '@/components/storefront/ProductCard';
import { TestimonialSection } from '@/components/storefront/TestimonialSection';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function Home() {
  const db = useFirestore();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 60;

  useEffect(() => {
    // Authoritatively reset scroll position to the top on mount
    window.scrollTo(0, 0);
  }, []);

  // Fetch top categories for the collection grid
  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), orderBy('order', 'asc'), limit(12));
  }, [db]);

  const { data: categories, isLoading: categoriesLoading } = useCollection(categoriesQuery);

  // Fetch products for "Featured Selection" - Increased limit to support pagination
  const featuredQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(300));
  }, [db]);

  const { data: featuredProducts, isLoading: productsLoading } = useCollection(featuredQuery);

  // Global Review Config
  const reviewConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'reviews') : null, [db]);
  const { data: reviewConfig } = useDoc(reviewConfigRef);

  // Fetch all reviews for global rating aggregation
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

  // Pagination Logic
  const paginatedProducts = useMemo(() => {
    if (!featuredProducts) return [];
    const start = (currentPage - 1) * pageSize;
    return featuredProducts.slice(start, start + pageSize);
  }, [featuredProducts, currentPage, pageSize]);

  const totalPages = Math.ceil((featuredProducts?.length || 0) / pageSize);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Smooth scroll back to the products section header
    const element = document.getElementById('featured-products-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Fetch theme for layout decisions
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: theme } = useDoc(themeRef);

  const isHeroLoading = categoriesLoading;
  const reviewsEnabled = reviewConfig?.enabled !== false;

  const heroImageSrc = theme?.heroImageUrl || categories?.[0]?.imageUrl || "";

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Selection based on Theme Config */}
      {theme?.homepageLayout === 'classic' ? (
        <section className="pt-28 sm:pt-36">
          <div className="w-full overflow-hidden bg-primary shadow-2xl group border-b">
            <div className="relative h-[52.5vh] w-full">
              {heroImageSrc ? (
                <Image
                  src={heroImageSrc}
                  alt="Main Hero"
                  fill
                  className="object-cover opacity-80"
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

      {/* Categories Selection */}
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
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-200" />
                    )}
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

      {/* Featured Products Selection with Pagination */}
      <section id="featured-products-section" className="pt-12 pb-24 bg-background">
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
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16">
                {paginatedProducts.map((product: any) => {
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
                      rating={avgRating}
                      reviewCount={reviewCount}
                      isSoldOut={isSoldOut}
                    />
                  );
                })}
              </div>

              {/* High-Fidelity Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-20 flex flex-col sm:flex-row justify-center items-center gap-8">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="outline" 
                      className="rounded-none border-black font-bold uppercase tracking-widest text-[10px] h-12 px-6 disabled:opacity-30 transition-all"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" /> Previous
                    </Button>
                    
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={cn(
                            "w-10 h-10 text-[10px] font-bold border transition-all duration-300",
                            currentPage === page 
                              ? "bg-black text-white border-black" 
                              : "bg-white text-primary border-gray-200 hover:border-black"
                          )}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <Button 
                      variant="outline" 
                      className="rounded-none border-black font-bold uppercase tracking-widest text-[10px] h-12 px-6 disabled:opacity-30 transition-all"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <TestimonialSection />

      <Footer />
    </main>
  );
}
