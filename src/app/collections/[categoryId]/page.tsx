'use client';

import React, { use } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CollectionPage(props: { params: Promise<{ categoryId: string }> }) {
  const resolvedParams = use(props.params);
  const categoryId = resolvedParams.categoryId;
  
  const db = useFirestore();

  // Fetch Category Details - skip if 'all'
  const categoryRef = useMemoFirebase(() => 
    db && categoryId !== 'all' ? doc(db, 'categories', categoryId) : null, 
    [db, categoryId]
  );
  const { data: category, isLoading: categoryLoading } = useDoc(categoryRef);

  // Fetch Products in this Category
  const productsQuery = useMemoFirebase(() => {
    if (!db || !categoryId) return null;
    if (categoryId === 'all') return collection(db, 'products');
    return query(collection(db, 'products'), where('categoryId', '==', categoryId));
  }, [db, categoryId]);

  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const isLoading = (categoryId !== 'all' && categoryLoading) || productsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-36 pb-12 border-b bg-white">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors w-fit">
              <ChevronLeft className="h-3 w-3" /> Back to Archive
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-[0.3em] font-bold text-gray-400">Archive Selection</span>
                <h1 className="text-4xl md:text-6xl font-headline font-bold uppercase tracking-tight">
                  {categoryId === 'all' ? 'All Archive Drops' : (category?.name || 'Collection')}
                </h1>
                {(category?.description || categoryId === 'all') && (
                  <p className="text-sm text-gray-500 max-w-2xl leading-relaxed uppercase tracking-tight">
                    {categoryId === 'all' 
                      ? 'Discover the full breadth of our sculptural silhouettes and technical archive pieces.' 
                      : category?.description}
                  </p>
                )}
              </div>
              <div className="bg-black text-white px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] rounded-none shrink-0 shadow-lg">
                {products?.length || 0} Pieces Cataloged
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="py-20">
        <div className="max-w-[1440px] mx-auto px-4">
          {!products || products.length === 0 ? (
            <div className="text-center py-32 border-2 border-dashed rounded-none bg-gray-50/50">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">The archive is currently empty for this drop.</p>
              <Button asChild variant="outline" className="mt-8 border-black font-bold uppercase tracking-[0.2em] text-[10px] h-14 px-10 rounded-none hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out">
                <Link href="/">Explore Featured Drops</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-16">
              {products.map((product: any) => (
                <ProductCard 
                  key={product.id} 
                  id={product.id}
                  name={product.name}
                  price={`$${formatCurrency(Number(product.price))} CAD`}
                  image={product.media?.[0]?.url || 'https://picsum.photos/seed/placeholder/600/800'}
                  category={category?.name || product.brand || 'FSLNO Archive'}
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
