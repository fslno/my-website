'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Heart, 
  User as UserIcon,
  LogOut,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import NextImage from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useAuth } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthDialog } from '@/components/storefront/AuthDialog';
import { useToast } from '@/hooks/use-toast';
import { getLivePath } from '@/lib/deployment';
import { ReviewSystem } from '@/components/storefront/ReviewSystem';

/**
 * Authoritative Header Manifest.
 * Forensicly purged of search and menu interaction points for an opaque white start.
 * Thumbnails recalibrated to 1:1 geometric ratio.
 * Cart items optimized for mobile-first visual density.
 */
export function Header() {
  const { cart, cartCount, cartSubtotal, removeFromCart, discountTotal } = useCart();
  const { wishlist, wishlistCount, toggleWishlist } = useWishlist();
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const db = useFirestore();
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: theme } = useDoc(themeRef);

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/store')) : null, [db]);
  const { data: storeConfig } = useDoc(storeConfigRef);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = useMemo(() => pathname?.startsWith('/admin'), [pathname]);
  const isProductPage = useMemo(() => pathname?.includes('/products/'), [pathname]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await auth.signOut();
      toast({ title: "Signed out", description: "You have been signed out." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Sign out failed." });
    }
  };

  const formatCurrency = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getBadgePositionStyle = () => {
    if (!theme) return { right: '1rem', top: '100%' };
    const offset = `${theme.ratingBadgeVerticalOffset || 0}px`;
    const pos = theme.ratingBadgePosition || 'right';
    if (pos === 'left') return { left: '1rem', top: `calc(100% - 1px + ${offset})`, position: 'absolute' as const };
    if (pos === 'center') return { left: '50%', transform: 'translateX(-50%)', top: `calc(100% - 1px + ${offset})`, position: 'absolute' as const };
    if (pos === 'right') return { right: '1rem', top: `calc(100% - 1px + ${offset})`, position: 'absolute' as const };
    if (pos === 'bottom-left') return { left: '1rem', bottom: `calc(1rem + ${offset})`, position: 'fixed' as const, top: 'auto' };
    if (pos === 'bottom-center') return { left: '50%', transform: 'translateX(-50%)', bottom: `calc(1rem + ${offset})`, position: 'fixed' as const, top: 'auto' };
    if (pos === 'bottom-right') return { right: '1rem', bottom: `calc(1rem + ${offset})`, position: 'fixed' as const, top: 'auto' };
    return { right: '1rem', top: `calc(100% - 1px + ${offset})`, position: 'absolute' as const };
  };

  return (
    <>
      {theme?.bannerEnabled && (
        <div 
          className="fixed top-0 left-0 right-0 z-[60] h-7 sm:h-10 flex items-center justify-center uppercase tracking-[0.3em] font-bold text-white px-4 text-center"
          style={{ backgroundColor: theme.bannerBgColor || '#000000' }}
        >
          <span className="text-[7px] sm:text-[10px]">{theme.bannerText || ''}</span>
        </div>
      )}
      <header
        className={cn(
          'fixed left-0 right-0 z-50 transition-all duration-300 h-12 sm:h-16 flex items-center bg-white',
          theme?.bannerEnabled ? 'top-7 sm:top-10' : 'top-0'
        )}
      >
        <div className="max-w-[1440px] mx-auto w-full px-4 flex items-center justify-between relative h-full">
          <div className="flex items-center gap-1 sm:gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              {storeConfig?.logoUrl && (
                <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-sm overflow-hidden">
                  <NextImage src={storeConfig.logoUrl} alt="Logo" fill className="object-cover" />
                </div>
              )}
              <h1 className="text-sm sm:text-xl md:text-2xl font-headline font-bold tracking-tighter text-primary truncate max-w-[120px] xs:max-w-none">
                {storeConfig?.businessName || ""}
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex" onClick={() => user ? null : setIsAuthOpen(true)}>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><UserIcon className="h-4 w-4" /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-none">
                      <DropdownMenuItem asChild><Link href="/account/orders" className="text-[10px] font-bold uppercase tracking-widest">My Orders</Link></DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="text-[10px] font-bold uppercase tracking-widest text-destructive">Sign Out</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : <UserIcon className="h-4 w-4" />}
              </Button>

              <Sheet open={isWishlistOpen} onOpenChange={setIsWishlistOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Heart className="h-4 w-4" />
                    {wishlistCount > 0 && <span className="absolute top-1.5 right-1.5 bg-black text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center">{wishlistCount}</span>}
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  className={cn(
                    "w-full sm:max-w-md bg-white p-0 flex flex-col border-none shadow-2xl transition-all duration-500",
                    theme?.bannerEnabled ? "top-7 sm:top-10 h-[calc(100vh-theme(spacing.7))] sm:h-[calc(100vh-theme(spacing.10))]" : "h-full"
                  )}
                >
                  <SheetHeader className="p-6 border-b shrink-0"><SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight text-left">Wishlist ({wishlistCount})</SheetTitle></SheetHeader>
                  <ScrollArea className="flex-1 p-6">
                    {wishlist.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <Heart className="h-10 w-10 text-gray-200" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Your wishlist is empty.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {wishlist.map((item) => (
                          <div key={item.id} className="flex gap-4">
                            <Link href={`/products/${item.id}`} onClick={() => setIsWishlistOpen(false)} className="w-20 h-20 relative bg-gray-100 border shrink-0">{item.image && <NextImage src={item.image} alt="" fill className="object-cover" />}</Link>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div className="text-left">
                                <h3 className="text-[10px] font-bold uppercase leading-tight">{item.name}</h3>
                                <p className="text-[10px] font-bold mt-1">C${item.price.toFixed(2)}</p>
                              </div>
                              <button onClick={() => toggleWishlist(item)} className="text-[8px] font-bold uppercase tracking-widest text-destructive text-left hover:underline">Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <ShoppingBag className="h-4 w-4" />
                    {cartCount > 0 && <span className="absolute top-1.5 right-1.5 bg-black text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center">{cartCount}</span>}
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  className={cn(
                    "w-full sm:max-w-md bg-white p-0 flex flex-col border-none shadow-2xl transition-all duration-500",
                    theme?.bannerEnabled ? "top-7 sm:top-10 h-[calc(100dvh-theme(spacing.7))] sm:h-[calc(100dvh-theme(spacing.10))]" : "h-[100dvh]"
                  )}
                >
                  <SheetHeader className="p-6 border-b shrink-0">
                    <SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight text-left">Cart ({cartCount})</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="flex-1 p-6">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <ShoppingBag className="h-10 w-10 text-gray-200" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Your cart is empty.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {cart.map((item) => (
                          <div key={item.variantId} className="flex gap-3 sm:gap-4 group border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 relative bg-gray-50 border shrink-0 overflow-hidden rounded-sm">
                              {item.image && <NextImage src={item.image} alt="" fill className="object-cover" />}
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                              <div className="text-left">
                                <div className="flex justify-between items-start gap-2">
                                  <h3 className="text-[10px] font-bold uppercase leading-tight line-clamp-2 flex-1">{item.name}</h3>
                                  <p className="text-[10px] font-bold whitespace-nowrap">C${formatCurrency(item.price * item.quantity)}</p>
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <p className="text-[8px] font-bold text-gray-400 uppercase">Size: {item.size}</p>
                                  <p className="text-[8px] font-bold text-primary uppercase">Qty: {item.quantity}</p>
                                </div>
                              </div>
                              <button onClick={() => removeFromCart(item.variantId)} className="text-[8px] font-bold uppercase tracking-widest text-destructive text-left hover:underline mt-2">Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  {cart.length > 0 && (
                    <div className="p-6 pb-10 sm:pb-8 border-t bg-white flex flex-col gap-6 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Subtotal</span>
                          <span className="text-sm font-bold">C${formatCurrency(cartSubtotal)}</span>
                        </div>
                        {discountTotal > 0 && (
                          <div className="flex justify-between items-end text-emerald-600">
                            <span className="text-[10px] font-bold uppercase tracking-widest">Savings Applied</span>
                            <span className="text-sm font-bold">-C${formatCurrency(discountTotal)}</span>
                          </div>
                        )}
                      </div>
                      <Button asChild className="w-full h-14 bg-black text-white font-bold uppercase tracking-[0.3em] text-[11px] rounded-none hover:bg-black shadow-xl transition-none active:scale-100">
                        <Link href="/checkout" onClick={() => setIsCartOpen(false)}>Checkout</Link>
                      </Button>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {!isAdmin && !isProductPage && theme && mounted && (
            <div 
              className="z-[60] hidden sm:flex items-center gap-1"
              style={getBadgePositionStyle()}
            >
              <ReviewSystem productId="global" />
            </div>
          )}
        </div>
      </header>
      <AuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </>
  );
}
