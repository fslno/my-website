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

  return (
    <section className="pt-24 pb-12">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="relative h-[70vh] w-full overflow-hidden bg-black group">
          <Image
            src={featuredCategory?.imageUrl || "https://picsum.photos/seed/hero/1200/800"}
            alt={featuredCategory?.name || "Featured Collection"}
            fill
            className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
            priority
            data-ai-hint="fashion editorial"
          />
          <div className="absolute inset-0 p-12 flex flex-col items-center justify-center text-center text-white bg-gradient-to-t from-black/40 to-transparent">
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold mb-6">The Collection</span>
            <h2 className="text-5xl md:text-7xl font-headline mb-10 tracking-tighter uppercase font-bold leading-none">
              {featuredCategory?.name || "THE ARCHIVE"}
            </h2>
            <Link 
              href={featuredCategory ? `/collections/${featuredCategory.id}` : "/collections/all"} 
              className="bg-white text-black px-12 h-14 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out"
            >
              Shop the Drops <ArrowRight className="ml-3 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
