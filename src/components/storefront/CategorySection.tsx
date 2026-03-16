'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2, ArrowRight } from 'lucide-react';
import { getLivePath } from '@/lib/deployment';

/**
 * Authoritative Category Selection segment.
 * Manifests ALL archival collections from the admin manifest in a 1:1 grid.
 */
export function CategorySection() {
  const db = useFirestore();

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    // Removed limit to manifest all categories as requested
    return query(collection(db, getLivePath('categories')), orderBy('order', 'asc'));
  }, [db]);

  const { data: categories, isLoading } = useCollection(categoriesQuery);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black/10" />
      </div>
    );
  }

  if (!categories || categories.length === 0) return null;

  return (
    <section className="py-12 bg-white border-b">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-6">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-muted-foreground">The Collections</span>
            <h2 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight text-primary">Shop by Drop</h2>
          </div>
          <Link 
            href="/collections/all" 
            className="text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-60 transition-opacity flex items-center gap-2 group"
          >
            Explore All <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/collections/${cat.id}`}
              className="group relative aspect-square bg-gray-100 overflow-hidden rounded-sm border shadow-sm"
            >
              {cat.imageUrl ? (
                <Image 
                  src={cat.imageUrl} 
                  alt={cat.name} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-110" 
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-gray-300">
                  {cat.name}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-lg sm:text-xl font-headline font-bold text-white uppercase tracking-tight">{cat.name}</h3>
                <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mt-2">View Drop</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
