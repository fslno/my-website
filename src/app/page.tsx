'use client';

import React from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { CategorySection } from '@/components/storefront/CategorySection';
import { BentoHero } from '@/components/storefront/BentoHero';
import { TestimonialSection } from '@/components/storefront/TestimonialSection';
import { getLivePath } from '@/lib/deployment';
import { cn } from '@/lib/utils';

/**
 * Main Home Page.
 * Forensicly purged of hardcoded placeholders for an opaque white start.
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
      
      <div className="bg-white">
        <div className="max-w-[1440px] mx-auto px-4 pt-12">
          <div className={cn(
            "mb-6 md:mb-12 archive-text-align",
            theme?.archiveTextAlign === 'center' ? 'mx-auto items-center' : 
            theme?.archiveTextAlign === 'right' ? 'ml-auto items-end' : 'items-start'
          )}>
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-muted-foreground block">
                {theme?.archiveSectionSubtitle || ''}
              </span>
              <h2 className="font-headline font-bold uppercase tracking-tight archive-title-size archive-title-color leading-tight">
                {theme?.archiveSectionTitle || ''}
              </h2>
            </div>
          </div>
        </div>
        <ProductGrid />
      </div>

      <TestimonialSection />
    </div>
  );
}