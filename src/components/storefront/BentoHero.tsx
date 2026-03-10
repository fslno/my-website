'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2 } from 'lucide-react';

interface BentoHeroProps {
  categories: any[] | null;
  products: any[] | null;
  isLoading: boolean;
}

export function BentoHero({ categories, products, isLoading }: BentoHeroProps) {
  if (isLoading) {
    return (
      <section className="pt-24 pb-12">
        <div className="max-w-[1440px] mx-auto px-4 h-[600px] flex items-center justify-center bg-gray-50 border border-dashed rounded-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-gray-200" />
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-300">Syncing Collection...</p>
          </div>
        </div>
      </section>
    );
  }

  const featuredCategory = categories?.[0];
  const secondaryCategory = categories?.[1];
  const featuredProduct = products?.[0];

  return (
    <section className="pt-24 pb-12">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="bento-grid">
          {/* Main Hero Card - Featured Category */}
          <div className="col-span-1 lg:col-span-2 row-span-2 relative group overflow-hidden bg-black">
            <Image
              src={featuredCategory?.imageUrl || "https://picsum.photos/seed/hero/1200/800"}
              alt={featuredCategory?.name || "Featured Collection"}
              fill
              className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
              priority
              data-ai-hint="fashion editorial"
            />
            <div className="absolute inset-0 p-8 flex flex-col justify-end text-white bg-gradient-to-t from-black/60 to-transparent">
              <span className="text-xs uppercase tracking-[0.2em] mb-4">Current Collection</span>
              <h2 className="text-5xl font-headline mb-6 max-w-md leading-tight uppercase font-bold">
                {featuredCategory?.name || "THE ARCHIVE"}
              </h2>
              <Link href={featuredCategory ? `/collections/${featuredCategory.id}` : "/collections/all"} className="flex items-center gap-2 group/link text-sm uppercase tracking-widest font-bold">
                Shop the Drops <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* New Drops - Featured Product */}
          <div className="col-span-1 relative group overflow-hidden bg-gray-100 h-[400px] lg:h-auto">
            <Image
              src={featuredProduct?.media?.[0]?.url || "https://picsum.photos/seed/product/600/800"}
              alt={featuredProduct?.name || "Featured Product"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              data-ai-hint="minimalist product"
            />
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white bg-black/20 group-hover:bg-black/40 transition-colors">
              <span className="text-[10px] uppercase font-bold tracking-widest mb-1">Latest Release</span>
              <h3 className="text-2xl font-headline mb-2 uppercase font-bold">
                {featuredProduct?.name || "NEW DROPS"}
              </h3>
              <Link href={featuredProduct ? `/products/${featuredProduct.id}` : "/collections/all"} className="text-xs uppercase tracking-widest font-bold underline underline-offset-4">Explore</Link>
            </div>
          </div>

          {/* Secondary Category / Spotlight */}
          <div className="col-span-1 relative group overflow-hidden bg-white h-[400px] lg:h-auto">
            <Image
              src={secondaryCategory?.imageUrl || "https://picsum.photos/seed/secondary/600/800"}
              alt={secondaryCategory?.name || "Curated Pieces"}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              data-ai-hint="luxury fabric"
            />
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white bg-black/20 group-hover:bg-black/40 transition-colors">
              <h3 className="text-2xl font-headline mb-2 uppercase font-bold">
                {secondaryCategory?.name || "CURATED PIECES"}
              </h3>
              <Link href={secondaryCategory ? `/collections/${secondaryCategory.id}` : "/collections/all"} className="text-xs uppercase tracking-widest font-bold underline underline-offset-4">Discover</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
