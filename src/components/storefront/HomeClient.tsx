'use client';

import React, { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { CategorySection } from '@/components/storefront/CategorySection';
import { BentoHero } from '@/components/storefront/BentoHero';
import { TestimonialSection } from '@/components/storefront/TestimonialSection';
import { getLivePath } from '@/lib/paths';
import { cn } from '@/lib/utils';

export default function HomeClient({ 
  initialTheme,
  initialCategories,
  initialProducts
}: { 
  initialTheme: any,
  initialCategories?: any[],
  initialProducts?: any[]
}) {
  const db = useFirestore();

  // Subscription for real-time updates, seeded with initial server data
  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme, isLoading: themeLoading } = useDoc(themeRef, { initialData: initialTheme });

  // Robust Scroll-to-Top to ensure landing exactly on the Hero Banner
  useEffect(() => {
    // Check if we are returning to a product to allow the ProductGrid to handle restoration
    const isReturningToProduct = typeof window !== 'undefined' && !!sessionStorage.getItem('lastProductId');

    // Disable browser scroll restoration to prevent jumping back to old position
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (!isReturningToProduct) {
      // Immediate scroll on Mount
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

      // Secondary scroll after a minor delay to handle any dynamic layout shifts
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      }, 50);

      return () => {
        clearTimeout(timer);
        if ('scrollRestoration' in window.history) {
          window.history.scrollRestoration = 'auto';
        }
      };
    }
  }, []);

  // Use the freshest data (either server-side initial or live firestore updates)
  const activeTheme = theme || initialTheme;

  return (
    <div className="flex flex-col">
      <BentoHero
        isLoading={false} // Force false because we have initialTheme or activeTheme
        heroImages={activeTheme?.heroImages}
        headline={activeTheme?.heroHeadline}
        subheadline={activeTheme?.heroSubheadline}
        buttonText={activeTheme?.heroButtonText}
        textAlign={activeTheme?.heroTextAlign}
        verticalAlign={activeTheme?.heroVerticalAlign}
        bannerEnabled={activeTheme?.bannerEnabled}
        heroAspectRatio={activeTheme?.heroAspectRatio || 3.5}
      />

      <CategorySection initialCategories={initialCategories} />

      <div className="bg-white">
        <div className="max-w-[1440px] mx-auto px-4 pt-8">
          <div className={cn(
            "mb-4 md:mb-8 archive-text-align",
            activeTheme?.archiveTextAlign === 'center' ? 'mx-auto items-center text-center' :
              activeTheme?.archiveTextAlign === 'right' ? 'ml-auto items-end text-right' : 'items-start text-left'
          )}>
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-muted-foreground block">
                {activeTheme?.archiveSectionSubtitle || 'Our Collection'}
              </span>
              <h2 className="font-headline font-bold uppercase tracking-tight archive-title-size archive-title-color leading-tight">
                {activeTheme?.archiveSectionTitle || 'Shop All Products'}
              </h2>
            </div>
          </div>
        </div>
        <ProductGrid initialProducts={initialProducts} />
      </div>

      <TestimonialSection />
    </div>
  );
}
