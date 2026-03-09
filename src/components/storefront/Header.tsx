
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Menu, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-20 flex items-center',
        isScrolled ? 'bg-white shadow-sm border-b' : 'bg-transparent'
      )}
    >
      <div className="max-w-[1440px] mx-auto w-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] bg-white">
              <nav className="flex flex-col gap-6 mt-12">
                <Link href="/collections/new" className="text-xl font-headline">New Drops</Link>
                <Link href="/collections/women" className="text-xl font-headline">Women</Link>
                <Link href="/collections/men" className="text-xl font-headline">Men</Link>
                <Link href="/collections/accessories" className="text-xl font-headline">Accessories</Link>
              </nav>
            </SheetContent>
          </Sheet>

          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/collections/new" className="text-sm font-medium tracking-widest uppercase hover:opacity-60 transition-opacity">Collections</Link>
            <Link href="/collections/about" className="text-sm font-medium tracking-widest uppercase hover:opacity-60 transition-opacity">Archive</Link>
          </nav>
        </div>

        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-3xl font-headline font-bold tracking-tighter">FSLNO</h1>
        </Link>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">0</span>
          </Button>
          <Link href="/admin" className="text-xs uppercase tracking-widest font-semibold border-b border-transparent hover:border-black transition-all hidden md:inline">Admin</Link>
        </div>
      </div>
    </header>
  );
}
