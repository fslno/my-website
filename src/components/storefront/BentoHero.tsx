'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BentoHeroProps {
  isLoading: boolean;
  heroImageUrl?: string;
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  fallbackImageUrl?: string;
  textAlign?: string;
  verticalAlign?: string;
}

export function BentoHero({ 
  isLoading, 
  heroImageUrl, 
  headline = 'The Collection', 
  subheadline = 'Modern Silhouettes',
  buttonText = 'Shop the Drops',
  fallbackImageUrl,
  textAlign = 'center',
  verticalAlign = 'center'
}: BentoHeroProps) {
  if (isLoading) {
    return <section className="pt-24 pb-12"><div className="w-full h-[70vh] bg-gray-50" /></section>;
  }

  const imageSrc = heroImageUrl || fallbackImageUrl || "";

  return (
    <section className="pt-24 pb-12">
      <div className="w-full bg-primary overflow-hidden group shadow-2xl">
        <div className="relative h-[70vh] w-full">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={headline}
              fill
              className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-primary opacity-20" />
          )}
          <div className={cn(
            "absolute inset-0 p-12 flex flex-col text-primary-foreground bg-gradient-to-t from-black/60 via-transparent to-transparent hero-vertical-align"
          )}>
            <span className="text-[10px] uppercase tracking-[0.5em] font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {subheadline}
            </span>
            <span className="hero-headline-size font-headline mb-10 tracking-tighter uppercase font-bold leading-none animate-in fade-in slide-in-from-bottom-6 duration-1000 block">
              {headline}
            </span>
            <Link 
              href="/collections/all" 
              className="hero-button px-12 h-14 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] hover:opacity-90 transition-all duration-300 ease-in-out shadow-xl active:scale-95"
            >
              {buttonText} <ArrowRight className="ml-3 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}