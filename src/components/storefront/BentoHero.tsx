
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export function BentoHero() {
  return (
    <section className="pt-24 pb-12">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="bento-grid">
          {/* Main Hero Card */}
          <div className="col-span-1 lg:col-span-2 row-span-2 relative group overflow-hidden bg-black">
            <Image
              src="https://picsum.photos/seed/lux1/1200/800"
              alt="Main Hero"
              fill
              className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
              data-ai-hint="fashion editorial"
            />
            <div className="absolute inset-0 p-8 flex flex-col justify-end text-white bg-gradient-to-t from-black/60 to-transparent">
              <span className="text-xs uppercase tracking-[0.2em] mb-4">Spring/Summer 2024</span>
              <h2 className="text-5xl font-headline mb-6 max-w-md leading-tight">THE SCULPTED ARCHIVE</h2>
              <Link href="/collections/main" className="flex items-center gap-2 group/link text-sm uppercase tracking-widest font-bold">
                Shop Collection <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* New Drops */}
          <div className="col-span-1 relative group overflow-hidden bg-gray-100 h-[400px] lg:h-auto">
            <Image
              src="https://picsum.photos/seed/lux2/600/800"
              alt="New Drops"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              data-ai-hint="minimalist accessory"
            />
            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
              <h3 className="text-2xl font-headline mb-2">NEW DROPS</h3>
              <Link href="/new" className="text-xs uppercase tracking-widest font-bold underline underline-offset-4">Explore</Link>
            </div>
          </div>

          {/* Video / Visual card */}
          <div className="col-span-1 relative group overflow-hidden bg-white h-[400px] lg:h-auto">
            <Image
              src="https://picsum.photos/seed/lux3/600/800"
              alt="Visual"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              data-ai-hint="luxury fabric"
            />
            <div className="absolute inset-0 p-6 flex flex-col justify-end bg-black/10">
              <h3 className="text-2xl font-headline text-white mb-2">CRAFTMANSHIP</h3>
              <p className="text-white/80 text-xs tracking-wide">Behind the seams of FSLNO.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
