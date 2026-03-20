'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Page Not Found component.
 */
export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 pt-32 pb-20">
      <div className="relative">
        <Compass className="h-24 w-24 text-gray-100 animate-[slow-orbit_12s_linear_infinite]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-headline font-bold text-4xl tracking-tighter">404</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <h1 className="text-2xl font-headline font-bold uppercase tracking-tight">Page Not Found</h1>
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground max-w-xs mx-auto leading-relaxed">
          The page you are looking for does not exist in our shop.
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs mx-auto pt-8">
        <Button asChild className="bg-black text-white h-14 font-bold uppercase tracking-[0.2em] text-[10px] rounded-none shadow-xl">
          <Link href="/">Back to Home</Link>
        </Button>
        <Button asChild variant="ghost" className="h-12 font-bold uppercase tracking-widest text-[9px]">
          <Link href="/collections/all" className="flex items-center gap-2">View All Products <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    </div>
  );
}
