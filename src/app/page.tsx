'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Header } from '@/components/storefront/Header';
import { BentoHero } from '@/components/storefront/BentoHero';
import { Footer } from '@/components/storefront/Footer';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ArrowRight, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const db = useFirestore();

  // Fetch top 4 categories for the Archival Series
  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), limit(4));
  }, [db]);

  const { data: categories, isLoading: categoriesLoading } = useCollection(categoriesQuery);

  // Fetch top 8 products for "Featured Selection"
  const featuredQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(8));
  }, [db]);

  const { data: featuredProducts, isLoading: productsLoading } = useCollection(featuredQuery);

  // Fetch theme for layout decisions
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: theme } = useDoc(themeRef);

  const isHeroLoading = categoriesLoading;

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
                "absolute inset-0 flex flex-col text-primary-foreground p-12 bg-gradient-to-t from-black/60 via-transparent to-transparent hero-vertical-align"
              )}>
                <span className="text-[10px] uppercase tracking-[0.5em] font-bold mb-6">{theme?.heroSubheadline || "The Collection"}</span>
                <span className="hero-headline-size font-headline mb-10 tracking-tighter uppercase font-bold leading-none block">
                  {theme?.heroHeadline || "Modern Silhouettes"}
                </span>
                <Link href="/collections/all" className="hero-button px-12 h-14 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] hover:opacity-90 transition-all duration-300 ease-in-out shadow-xl active:scale-95">
                  {theme?.heroButtonText || "Shop All Archive"} <ArrowRight className="ml-3 h-4 w-4" />
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

      {/* Archival Series Manifest */}
      <section className="py-24 border-b bg-white">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 category-text-align">
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-muted-foreground">The Archive Manifest</span>
              <h2 className="category-title-size font-headline uppercase font-bold tracking-tighter text-primary">Archival Series</h2>
            </div>
            <Link href="/collections/all" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-60 transition-opacity flex items-center gap-2 pb-1 border-b border-black">
              Explore Full Archive <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          
          {!categories || categories.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-none bg-gray-50/50">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Archival Series pending dispatch.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {categories.map((cat: any, idx: number) => (
                <div key={cat.id} className="group flex flex-col gap-6">
                  <Link 
                    href={`/collections/${cat.id}`} 
                    className="relative aspect-[4/5] overflow-hidden bg-gray-100 rounded-none shadow-sm"
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
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-headline font-bold uppercase tracking-widest text-lg leading-none">{cat.name}</h3>
                      <span className="text-[9px] font-mono font-bold text-gray-400 mt-1">NO. 0{idx + 1}</span>
                    </div>
                    <Separator className="bg-black/5" />
                    <Link 
                      href={`/collections/${cat.id}`} 
                      className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                    >
                      View Series <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Selection Manifest */}
      <section className="py-24 bg-background">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-muted-foreground">The Selection</span>
              <h2 className="text-4xl md:text-6xl font-headline uppercase font-bold tracking-tighter text-primary">Featured Pieces</h2>
            </div>
            <Link href="/collections/all" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-60 transition-opacity flex items-center gap-2 pb-1 border-b border-black">
              View Entire Catalog <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          
          {productsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !featuredProducts || featuredProducts.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-none bg-gray-50/50">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">Inventory pending archival status.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16">
              {featuredProducts.map((product: any) => (
                <ProductCard 
                  key={product.id} 
                  id={product.id}
                  name={product.name}
                  price={`$${(Number(product.price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD`}
                  image={product.media?.[0]?.url || ''}
                  category={product.brand || 'FSLNO Archive'}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
