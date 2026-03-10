'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Header } from '@/components/storefront/Header';
import { BentoHero } from '@/components/storefront/BentoHero';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Loader2, ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Selection based on Theme Config */}
      {theme?.homepageLayout === 'classic' ? (
        <section className="pt-24 pb-12">
          <div className="max-w-[1440px] mx-auto px-4">
            <div className="relative h-[70vh] w-full overflow-hidden bg-black">
              <Image
                src="https://picsum.photos/seed/classic/1920/1080"
                alt="Main Hero"
                fill
                className="object-cover opacity-80"
                priority
                data-ai-hint="luxury landscape"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                <span className="text-[10px] uppercase tracking-[0.5em] font-bold mb-6">The Collection</span>
                <h2 className="text-5xl md:text-7xl font-headline mb-10 tracking-tighter uppercase font-bold leading-none">Modern Silhouettes</h2>
                <Link href="#featured-products" className="bg-white text-black px-12 h-14 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out">
                  Shop All <ArrowRight className="ml-3 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <BentoHero 
          categories={categories} 
          products={products} 
          isLoading={isHeroLoading} 
        />
      )}

      {/* Shop by Category Section - Positioned above featured products */}
      <section className="py-20 border-b bg-white">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="mb-12">
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-gray-400">Discover</span>
            <h2 className="text-4xl font-headline mt-2 uppercase font-bold tracking-tight">Shop by Category</h2>
          </div>
          
          {categoriesLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-200" />
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="py-10 text-center border border-dashed rounded bg-gray-50">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Categories coming soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((cat: any) => (
                <Link 
                  key={cat.id} 
                  href={`/collections/${cat.id}`} 
                  className="group relative aspect-[4/5] overflow-hidden bg-gray-100 rounded-sm"
                >
                  <Image 
                    src={cat.imageUrl || 'https://picsum.photos/seed/cat/600/800'} 
                    alt={cat.name} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    data-ai-hint="fashion category"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                    <h3 className="text-xl font-headline font-bold uppercase tracking-widest">{cat.name}</h3>
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
      
      {/* Featured Products Section - High density responsive grid */}
      <section id="featured-products" className="py-20">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] font-bold text-gray-400">Curated Selection</span>
              <h2 className="text-4xl font-headline mt-2 uppercase font-bold tracking-tight">Featured Products</h2>
            </div>
          </div>
          
          {productsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-200" />
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-xl bg-gray-50/50">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Our store is currently being updated.</p>
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
                    image={product.media?.[0]?.url || 'https://picsum.photos/seed/placeholder/600/800'}
                    category={category?.name || product.brand || 'Featured Piece'}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-black text-white py-24 mt-20">
        <div className="max-w-[1440px] mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-2 space-y-8">
            <h2 className="text-4xl font-headline font-bold tracking-tighter">FSLNO</h2>
            <p className="text-white/40 max-w-sm text-sm leading-relaxed uppercase tracking-tight">
              Redefining luxury through minimalist design and high-quality fabrics. All prices in CAD.
            </p>
            <div className="flex gap-8">
              <a href="#" className="text-[10px] uppercase tracking-widest font-bold border-b border-white/10 hover:border-white transition-all pb-1">Instagram</a>
              <a href="#" className="text-[10px] uppercase tracking-widest font-bold border-b border-white/10 hover:border-white transition-all pb-1">TikTok</a>
            </div>
          </div>
          <div className="space-y-8">
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Support</h4>
            <ul className="flex flex-col gap-4 text-[11px] font-bold uppercase tracking-widest text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Size Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
          <div className="space-y-8">
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Legal</h4>
            <ul className="flex flex-col gap-4 text-[11px] font-bold uppercase tracking-widest text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-4 border-t border-white/5 mt-24 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] uppercase tracking-[0.2em] text-white/20">
          <p>© 2024 FSLNO. All Rights Reserved.</p>
          <p>Designed in London.</p>
        </div>
      </footer>
    </main>
  );
}
