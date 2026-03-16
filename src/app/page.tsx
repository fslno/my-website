'use client';

import React from 'react';
import { BentoHero } from '@/components/storefront/BentoHero';
import { CategorySection } from '@/components/storefront/CategorySection';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getLivePath } from '@/lib/deployment';

/**
 * Authoritative Unified Home Page.
 * Orchestrates the full Studio experience from Hero to Catalog.
 */
export default function Home() {
  const db = useFirestore();
  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme, isLoading: themeLoading } = useDoc(themeRef);

  return (
    <div className="flex flex-col">
      <BentoHero 
        isLoading={themeLoading}
        heroImages={theme?.heroImages}
        headline={theme?.heroHeadline}
        subheadline={theme?.heroSubheadline}
        buttonText={theme?.heroButtonText}
        textAlign={theme?.heroTextAlign}
        verticalAlign={theme?.heroVerticalAlign}
      />
      
      <CategorySection />
      
      <div className="bg-white border-t">
        <div className="max-w-[1440px] mx-auto px-4 pt-12">
          <div className="space-y-2 mb-6">
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-muted-foreground">The Archive</span>
            <h2 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight">Featured Products</h2>
          </div>
        </div>
        <ProductGrid />
      </div>
    </div>
  );
}
