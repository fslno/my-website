'use client';

import React from 'react';
import { CategorySection } from '@/components/storefront/CategorySection';
import { ProductGrid } from '@/components/storefront/ProductGrid';

/**
 * Authoritative Unified Home Page.
 * Orchestrates the full Studio experience from Collections to Featured Products.
 */
export default function Home() {
  return (
    <div className="flex flex-col">
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
