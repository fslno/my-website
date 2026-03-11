'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2 } from 'lucide-react';

interface BentoHeroProps {
  isLoading: boolean;
  heroImageUrl?: string;
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  fallbackImageUrl?: string;
}

export function BentoHero({ 
  isLoading, 
  heroImageUrl, 
  headline = 'The Collection', 
  subheadline = 'Modern Silhouettes',
  buttonText = 'Shop the Drops',
  fallbackImageUrl
}: BentoHeroProps) {
  if (isLoading) {
    return (
      <section className="pt-24 pb-12">
        <div className="w-full h-[600px] flex items-center justify-center bg-gray-50 border border-dashed">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Syncing Collection...</p>
          </div>
        </div>
      </section>
    );
  }

  const imageSrc = heroImageUrl || fallbackImageUrl || "https://picsum.photos/seed/hero/1200/800";

  return (
    <section className="pt-24 pb-12">
      <div className="w-full bg-primary overflow-hidden group shadow-2xl">
        <div className="relative h-[70vh] w-full">
          <Image
            src={imageSrc}
            alt={headline}
            fill
            className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
            priority
            data-ai-hint="fashion editorial"
          />
          <div className="absolute inset-0 p-12 flex flex-col items-center justify-center text-center text-primary-foreground bg-gradient-to-t from-black/60 via-transparent to-transparent">
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {subheadline}
            </span>
            <h2 className="text-5xl md:text-7xl font-headline mb-10 tracking-tighter uppercase font-bold leading-none animate-in fade-in slide-in-from-bottom-6 duration-1000">
              {headline}
            </h2>
            <Link 
              href="#featured-products" 
              className="bg-accent text-accent-foreground px-12 h-14 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#D3D3D3] transition-all duration-300 ease-in-out shadow-xl active:scale-95"
            >
              {buttonText} <ArrowRight className="ml-3 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
