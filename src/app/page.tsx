'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Header } from '@/components/storefront/Header';
import { BentoHero } from '@/components/storefront/BentoHero';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const db = useFirestore();

  // Fetch the latest 8 products from the archive
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'products'),
      orderBy('createdAt', 'desc'),
      limit(8)
    );
  }, [db]);

  const { data: products, loading } = useCollection(productsQuery);

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <BentoHero />
      
      <section className="py-20">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] font-bold">The Archive</span>
              <h2 className="text-4xl font-headline mt-2">LATEST RELEASES</h2>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-xl bg-gray-50/50">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Archive is currently closed for curation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product: any) => (
                <ProductCard 
                  key={product.id} 
                  id={product.id}
                  name={product.name}
                  price={`$${Number(product.price).toLocaleString()}`}
                  image={product.media?.[0]?.url || 'https://picsum.photos/seed/placeholder/600/800'}
                  category={product.brand || 'FSLNO Archive'}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-black text-white py-20 mt-20">
        <div className="max-w-[1440px] mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-4xl font-headline font-bold mb-6">FSLNO</h2>
            <p className="text-white/60 max-w-sm text-sm leading-relaxed mb-8">
              Redefining luxury through minimalist architecture and sculpted fabrics. A testament to timeless design and modern silhouettes.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-xs uppercase tracking-widest font-bold border-b border-white/20 hover:border-white transition-all">Instagram</a>
              <a href="#" className="text-xs uppercase tracking-widest font-bold border-b border-white/20 hover:border-white transition-all">TikTok</a>
              <a href="#" className="text-xs uppercase tracking-widest font-bold border-b border-white/20 hover:border-white transition-all">Vogue Business</a>
            </div>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Support</h4>
            <ul className="flex flex-col gap-3 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Size Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sustainability</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Legal</h4>
            <ul className="flex flex-col gap-3 text-sm text-white/60">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto px-4 border-t border-white/10 mt-20 pt-8 flex justify-between items-center text-[10px] uppercase tracking-widest opacity-40">
          <p>© 2024 FSLNO ARCHIVES. ALL RIGHTS RESERVED.</p>
          <p>DESIGNED IN LONDON.</p>
        </div>
      </footer>
    </main>
  );
}
