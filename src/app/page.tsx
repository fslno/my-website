'use client';

import React from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { CategorySection } from '@/components/storefront/CategorySection';
import { BentoHero } from '@/components/storefront/BentoHero';
import { TestimonialSection } from '@/components/storefront/TestimonialSection';
import { getLivePath } from '@/lib/paths';
import { cn } from '@/lib/utils';

/**
 * Main Home Page.
 * All child components are already 'use client', so no ClientOnly wrappers needed.
 */
export default function Home() {
  const db = useFirestore();

  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme, isLoading: themeLoading } = useDoc(themeRef);

  // Robust Scroll-to-Top to ensure landing exactly on the Hero Banner
  React.useEffect(() => {
    // Disable browser scroll restoration to prevent jumping back to old position
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Immediate scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

    // Secondary scroll after a minor delay to handle any dynamic layout shifts or late image renders
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }, 50);

    return () => {
      clearTimeout(timer);
      // Re-enable on unmount if needed, though manual is often safer for this app
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

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
        bannerEnabled={theme?.bannerEnabled}
        heroAspectRatio={theme?.heroAspectRatio || 5.4}
      />

      <CategorySection />

      <div className="bg-white">
        <div className="max-w-[1440px] mx-auto px-4 pt-12">
          <div className={cn(
            "mb-6 md:mb-12 archive-text-align",
            theme?.archiveTextAlign === 'center' ? 'mx-auto items-center text-center' :
              theme?.archiveTextAlign === 'right' ? 'ml-auto items-end text-right' : 'items-start text-left'
          )}>
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-muted-foreground block">
                {theme?.archiveSectionSubtitle || 'Our Collection'}
              </span>
              <h2 className="font-headline font-bold uppercase tracking-tight archive-title-size archive-title-color leading-tight">
                {theme?.archiveSectionTitle || 'Shop All Products'}
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
