'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Header } from '@/components/storefront/Header';
import { BentoHero } from '@/components/storefront/BentoHero';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Footer } from '@/components/storefront/Footer';
import { ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function Home() {
  const db = useFirestore();

  // Fetch the latest 8 products
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc'),
      limit(8)
    );
  }, [db]);

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  // Fetch top 4 categories
  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), limit(4));
  }, [db]);

  const { data: categories, isLoading: categoriesLoading } = useCollection(categoriesQuery);

  // Fetch theme for layout decisions
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: theme } = useDoc(themeRef);

  const isHeroLoading = productsLoading || categoriesLoading;

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const heroImageSrc = theme?.heroImageUrl || categories?.[0]?.imageUrl || "";

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Selection based on Theme Config */}
      {theme?.homepageLayout === 'classic' ? (
        <section className="pt-24 pb-12">
          <div className="w-full overflow-hidden bg-primary shadow-2xl group">
            <div className="relative h-[70vh] w-full">
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
                "absolute inset-0 flex flex-col text-primary-foreground p-12 bg-gradient-to-t from-black/60 via-transparent to-transparent hero-text-align hero-vertical-align",
                theme?.heroTextAlign === 'left' ? 'items-start' : theme?.heroTextAlign === 'right' ? 'items-end' : 'items-center'
              )}>
                <span className="text-[10px] uppercase tracking-[0.5em] font-bold mb-6">{theme?.heroSubheadline || "The Collection"}</span>
                <span className="hero-headline-size font-headline mb-10 tracking-tighter uppercase font-bold leading-none block">
                  {theme?.heroHeadline || "Modern Silhouettes"}
                </span>
                <Link href="#featured-products" className="hero-button px-12 h-14 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] hover:opacity-90 transition-all duration-300 ease-in-out shadow-xl active:scale-95">
                  {theme?.heroButtonText || "Shop All"} <ArrowRight className="ml-3 h-4 w-4" />
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

      {/* Shop by Category Section */}
      <section className="py-20 border-b bg-white">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="mb-12 category-text-align">
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-muted-foreground">Discover</span>
            <h2 className="category-title-size font-headline mt-2 uppercase font-bold tracking-tight text-primary">Shop by Category</h2>
          </div>
          
          {!categories || categories.length === 0 ? (
            <div className="py-10 text-center border border-dashed rounded bg-gray-50">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Categories coming soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((cat: any) => (
                <Link 
                  key={cat.id} 
                  href={`/collections/${cat.id}`} 
                  className="group relative aspect-[4/5] overflow-hidden bg-gray-100 rounded-sm"
                >
                  {cat.imageUrl ? (
                    <Image 
                      src={cat.imageUrl} 
                      alt={cat.name} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gray-200" />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                  <div 
                    className="absolute inset-0 flex flex-col p-6 text-white category-text-align"
                    style={{ 
                      justifyContent: 'var(--category-vertical-align)',
                      alignItems: 'var(--category-flex-align)'
                    }}
                  >
                    <h3 className="font-headline font-bold uppercase tracking-widest category-title-size">{cat.name}</h3>
                    <span className="mt-4 text-[10px] uppercase font-bold tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-300 flex items-center gap-2 border-b border-white pb-1">
                      Explore <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Featured Products Section */}
      <section id="featured-products" className="py-20">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="mb-12 featured-text-align">
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-muted-foreground">Curated Selection</span>
            <h2 className="featured-title-size font-headline mt-2 uppercase font-bold tracking-tight text-primary">Featured Products</h2>
          </div>
          
          {!products || products.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-xl bg-gray-50/50">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Our store is currently being updated.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {products.map((product: any) => {
                const category = categories?.find((c: any) => c.id === product.categoryId);
                return (
                  <ProductCard 
                    key={product.id} 
                    id={product.id}
                    name={product.name}
                    price={`$${formatCurrency(Number(product.price))} CAD`}
                    image={product.media?.[0]?.url || ''}
                    category={category?.name || product.brand || 'Featured Piece'}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
