'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Menu, Search, X, Trash2, ArrowRight, Heart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { cart, cartCount, cartSubtotal, removeFromCart, thresholdProgress, THRESHOLD_VALUE } = useCart();
  const { wishlist, wishlistCount, toggleWishlist } = useWishlist();
  
  const db = useFirestore();
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: theme } = useDoc(themeRef);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const remainingForThreshold = Math.max(0, THRESHOLD_VALUE - cartSubtotal);

  return (
    <>
      {theme?.bannerEnabled && (
        <div 
          className="fixed top-0 left-0 right-0 z-[60] h-10 flex items-center justify-center text-[10px] uppercase tracking-[0.3em] font-bold text-white px-4 text-center"
          style={{ backgroundColor: theme.bannerBgColor || '#000' }}
        >
          {theme.bannerText}
        </div>
      )}
      <header
        className={cn(
          'fixed left-0 right-0 z-50 transition-all duration-300 h-20 flex items-center bg-white border-b shadow-sm',
          theme?.bannerEnabled ? 'top-10' : 'top-0'
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
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-6 mt-12">
                  <Link href="/collections/new" className="text-xl font-headline">New Arrivals</Link>
                  <Link href="/collections/women" className="text-xl font-headline">Women</Link>
                  <Link href="/collections/men" className="text-xl font-headline">Men</Link>
                </nav>
              </SheetContent>
            </Sheet>

            <nav className="hidden lg:flex items-center gap-8">
              <Link href="/collections/new" className="text-sm font-medium tracking-widest uppercase hover:opacity-60 transition-opacity">Collections</Link>
              <Link href="/collections/about" className="text-sm font-medium tracking-widest uppercase hover:opacity-60 transition-opacity">About</Link>
            </nav>
          </div>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-3xl font-headline font-bold tracking-tighter">FSLNO</h1>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
              <Search className="h-5 w-5" />
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                      {wishlistCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-white border-l p-0 flex flex-col">
                <SheetHeader className="p-6 border-b shrink-0">
                  <SheetTitle className="text-xl font-headline font-bold tracking-tight uppercase text-center">Wishlist ({wishlistCount})</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1">
                  {wishlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
                      <Heart className="h-12 w-12 text-gray-200 mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Save your favorite items here.</p>
                    </div>
                  ) : (
                    <div className="p-6 space-y-8">
                      {wishlist.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <Link href={`/products/${item.id}`} className="w-20 h-20 relative bg-gray-100 border shrink-0">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          </Link>
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div className="space-y-1">
                              <h3 className="text-xs font-bold uppercase tracking-tight leading-tight">{item.name}</h3>
                              <p className="text-sm font-bold">${item.price.toLocaleString()} CAD</p>
                            </div>
                            <button 
                              onClick={() => toggleWishlist(item)}
                              className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:underline text-left"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-white border-l p-0 flex flex-col">
                <SheetHeader className="p-6 border-b shrink-0 space-y-4">
                  <SheetTitle className="text-xl font-headline font-bold tracking-tight uppercase">Your Cart ({cartCount})</SheetTitle>
                  
                  {cartSubtotal > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <Zap className={cn("h-3 w-3", thresholdProgress >= 100 ? "text-yellow-500 fill-current" : "text-gray-300")} />
                          {thresholdProgress >= 100 ? "Discount Unlocked" : `$${remainingForThreshold.toLocaleString()} more for $100 off`}
                        </span>
                        <span>{Math.round(thresholdProgress)}%</span>
                      </div>
                      <Progress value={thresholdProgress} className="h-1.5 bg-gray-100" />
                    </div>
                  )}
                </SheetHeader>

                <ScrollArea className="flex-1">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
                      <ShoppingBag className="h-12 w-12 text-gray-200 mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Your cart is empty.</p>
                      <Button asChild variant="outline" className="mt-6 border-black text-black font-bold uppercase tracking-widest text-[10px] h-12 px-8 rounded-none">
                        <Link href="/">Shop Now</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="p-6 space-y-8">
                      {cart.map((item) => (
                        <div key={item.variantId} className="flex gap-4">
                          <div className="w-24 h-24 relative bg-gray-100 overflow-hidden border shrink-0">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div className="space-y-1">
                              <div className="flex justify-between items-start">
                                <h3 className="text-xs font-bold uppercase tracking-tight leading-tight max-w-[180px]">{item.name}</h3>
                                <p className="text-sm font-bold">
                                  {item.price === 0 ? 'FREE' : `$${(item.price * item.quantity).toLocaleString()} CAD`}
                                </p>
                              </div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Size: {item.size}</p>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                              <p className="text-[10px] font-bold uppercase text-gray-400">Qty: {item.quantity}</p>
                              {!item.isPromo && (
                                <button 
                                  onClick={() => removeFromCart(item.variantId)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {cart.length > 0 && (
                  <SheetFooter className="p-6 border-t bg-gray-50/50 flex-col sm:flex-col items-stretch gap-4 shrink-0">
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Subtotal</span>
                        <span className="text-xl font-bold">${cartSubtotal.toLocaleString()} CAD</span>
                      </div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest">
                        Tax and shipping calculated at checkout.
                      </p>
                    </div>
                    <Button asChild className="w-full h-14 bg-black text-white font-bold uppercase tracking-[0.2em] text-[11px] rounded-none hover:bg-black/90 transition-all flex items-center justify-center gap-3">
                      <Link href="/checkout">Checkout <ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>

            <Link href="/admin" className="text-xs uppercase tracking-widest font-semibold border-b border-transparent hover:border-black transition-all hidden md:inline ml-2">Admin</Link>
          </div>
        </div>
      </header>
    </>
  );
}
