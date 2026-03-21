'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { getLivePath } from '@/lib/deployment';
import { cn } from '@/lib/utils';

/**
 * Category section display.
 * Authoritatively removed loading spinners for peak velocity.
 */
export function CategorySection() {
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme } = useDoc(themeRef);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, getLivePath('categories')), orderBy('order', 'asc'));
  }, [db]);

  const { data: categories, isLoading } = useCollection(categoriesQuery);

  // Authoritative Flashback Purge: Render nothing until hydration is complete.
  if (!mounted || isLoading || !categories || categories.length === 0) {
    return null;
  }

  const getFlexAlign = (align: string) => 
    align === 'center' ? 'items-center text-center' : 
    align === 'right' ? 'items-end text-right' : 'items-start text-left';

  return (
    <section className="py-6 sm:py-12 bg-white border-b">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className={cn(
          "flex flex-col md:flex-row justify-between gap-4 sm:gap-6 mb-6 sm:mb-12",
          theme?.categoryTextAlign === 'center' ? 'items-center text-center' : 
          theme?.categoryTextAlign === 'right' ? 'items-end text-right' : 'items-end text-left'
        )}>
          <div className={cn(
            "space-y-1 sm:space-y-2 category-text-align",
            theme?.categoryTextAlign === 'center' ? 'mx-auto' : 
            theme?.categoryTextAlign === 'right' ? 'ml-auto' : ''
          )}>
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-muted-foreground">
              {theme?.categorySectionSubtitle || 'Browse Collections'}
            </span>
            <h2 className="font-headline font-bold uppercase tracking-tight category-title-size category-title-color">
              {theme?.categorySectionTitle || 'Shop by Category'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-2 md:gap-x-6 md:gap-y-12">
          {categories.map((cat) => (
            <div key={cat.id} className="flex flex-col gap-2 sm:gap-4 group">
              <Link 
                href={`/collections/${cat.id}`}
                className="relative aspect-square bg-gray-100 overflow-hidden rounded-sm border shadow-sm"
              >
                {cat.imageUrl ? (
                  <NextImage 
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Link>
              
              <div className={cn(
                "flex flex-col category-card-content",
                getFlexAlign(theme?.categoryCardTextAlign || 'left')
              )}>
                <Link href={`/collections/${cat.id}`} className="hover:underline">
                  <h3 className="font-headline font-bold uppercase tracking-tight category-card-title leading-tight">
                    {cat.name}
                  </h3>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
