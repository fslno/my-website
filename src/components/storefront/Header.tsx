'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Menu, 
  Search, 
  X, 
  Heart, 
  User as UserIcon,
  LogOut,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import NextImage from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useAuth } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthDialog } from '@/components/storefront/AuthDialog';
import { useToast } from '@/hooks/use-toast';
import { getLivePath } from '@/lib/deployment';
import { Separator } from '@/components/ui/separator';
import { ReviewSystem } from '@/components/storefront/ReviewSystem';

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

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: storeConfig, isLoading: storeLoading } = useDoc(storeConfigRef);

  const categoriesQuery = useMemoFirebase(() => db ? collection(db, getLivePath('categories')) : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const productsQuery = useMemoFirebase(() => db ? collection(db, getLivePath('products')) : null, [db]);
  const { data: allProducts } = useCollection(productsQuery);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = useMemo(() => pathname?.startsWith('/admin'), [pathname]);
  const isProductPage = useMemo(() => pathname?.includes('/products/'), [pathname]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return allProducts?.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6) || [];
  }, [allProducts, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    
    // Header-relative positions
    if (pos === 'left') return { left: '1rem', top: `calc(100% + ${offset})`, position: 'absolute' as const };
    if (pos === 'center') return { left: '50%', transform: 'translateX(-50%) translateY(100%)', top: `calc(100% + ${offset})`, position: 'absolute' as const };
    if (pos === 'right') return { right: '1rem', top: `calc(100% + ${offset})`, position: 'absolute' as const };

    // Viewport-fixed bottom positions
    if (pos === 'bottom-left') return { left: '1rem', bottom: `calc(1rem + ${offset})`, position: 'fixed' as const, top: 'auto' };
    if (pos === 'bottom-center') return { left: '50%', transform: 'translateX(-50%)', bottom: `calc(1rem + ${offset})`, position: 'fixed' as const, top: 'auto' };
    if (pos === 'bottom-right') return { right: '1rem', bottom: `calc(1rem + ${offset})`, position: 'fixed' as const, top: 'auto' };
    
    // Split handled in main render
    if (pos === 'split') return { display: 'none' };

    return { right: '1rem', top: `calc(100% + ${offset})`, position: 'absolute' as const };
  };

  return (
    <>
      {mounted && theme?.bannerEnabled && (
        <div 
          className="fixed top-0 left-0 right-0 z-[60] h-7 sm:h-10 flex items-center justify-center uppercase tracking-[0.3em] font-bold text-white px-4 text-center"
          style={{ backgroundColor: theme.bannerBgColor || '#000000' }}
        >
          <span className="text-[7px] sm:text-[10px]">{theme.bannerText}</span>
        </div>
      )}
      <header
        className={cn(
          'fixed left-0 right-0 z-50 transition-all duration-300 h-12 sm:h-16 flex items-center bg-white border-b shadow-sm',
          mounted && theme?.bannerEnabled ? 'top-7 sm:top-10' : 'top-0'
        )}
      >
        <div className="max-w-[1440px] mx-auto w-full px-4 flex items-center justify-between relative h-full">
          <div className="flex items-center gap-2 sm:gap-4">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-primary h-10 w-10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] bg-white border-none p-0 flex flex-col">
                <SheetHeader className="pt-12 px-8 pb-8 border-b shrink-0">
                  <SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight text-primary">
                    {mounted ? storeConfig?.businessName : ""}
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 p-8">
                  <nav className="flex flex-col gap-4">
                    {categories?.map((cat: any) => (
                      <Link 
                        key={cat.id} 
                        href={`/collections/${cat.id}`} 
                        onClick={() => setIsMenuOpen(false)} 
                        className="text-lg font-headline uppercase text-primary hover:opacity-60"
                      >
                        {cat.name}
                      </Link>
                    ))}
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-4">
                      {user ? (
                        <>
                          <Link 
                            href="/account/orders" 
                            onClick={() => setIsMenuOpen(false)} 
                            className="text-lg font-headline uppercase text-primary hover:opacity-60 flex items-center gap-3"
                          >
                            <Package className="h-5 w-5" /> My Orders
                          </Link>
                          <button 
                            onClick={() => { handleLogout(); setIsMenuOpen(false); }} 
                            className="text-lg font-headline uppercase text-destructive hover:opacity-60 flex items-center gap-3 w-full text-left"
                          >
                            <LogOut className="h-5 w-5" /> Sign Out
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => { setIsAuthOpen(true); setIsMenuOpen(false); }} 
                          className="text-lg font-headline uppercase text-primary hover:opacity-60 flex items-center gap-3 w-full text-left"
                        >
                          <UserIcon className="h-5 w-5" /> Account / Sign In
                        </button>
                      )}
                    </div>
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2 group">
              {mounted && storeConfig?.logoUrl && (
                <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-sm overflow-hidden">
                  <NextImage src={storeConfig.logoUrl} alt="Logo" fill className="object-cover" />
                </div>
              )}
              <h1 className="text-lg sm:text-2xl font-headline font-bold tracking-tighter text-primary hidden sm:block">
                {mounted ? (storeConfig?.businessName || "") : ""}
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex items-center" ref={searchRef}>
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input 
                placeholder="SEARCH" 
                className="pl-8 h-8 sm:h-9 w-24 sm:w-40 md:w-56 bg-gray-50 border-none text-[9px] font-bold uppercase tracking-widest rounded-none focus-visible:ring-1 focus-visible:ring-black"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setIsSearching(true); }}
                onFocus={() => setIsSearching(true)}
              />
              {isSearching && searchQuery.length >= 2 && (
                <div className="absolute top-full right-0 mt-2 w-[280px] md:w-[400px] bg-white border shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2">
                  <ScrollArea className="max-h-[50vh]">
                    {filteredProducts.length === 0 ? (
                      <div className="p-8 text-center text-[10px] font-bold text-gray-400">No products found.</div>
                    ) : (
                      <div className="divide-y">
                        {filteredProducts.map((p: any) => (
                          <Link key={p.id} href={`/products/${p.id}`} onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="flex gap-4 p-4 hover:bg-gray-50 transition-colors">
                            <div className="w-12 h-12 relative bg-gray-100 border shrink-0">{p.media?.[0]?.url && <NextImage src={p.media[0].url} alt="" fill className="object-cover" />}</div>
                            <div className="flex flex-col justify-center overflow-hidden">
                              <h3 className="text-[10px] font-bold uppercase truncate">{p.name}</h3>
                              <p className="text-[9px] font-bold text-gray-400">C${Number(p.price).toFixed(2)}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>

            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-9 w-9 hidden lg:flex" onClick={() => user ? null : setIsAuthOpen(true)}>
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
                    mounted && theme?.bannerEnabled ? "top-7 sm:top-10 h-[calc(100vh-theme(spacing.7))] sm:h-[calc(100vh-theme(spacing.10))]" : "h-full"
                  )}
                >
                  <SheetHeader className="p-6 border-b shrink-0"><SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight">Wishlist ({wishlistCount})</SheetTitle></SheetHeader>
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
                              <div>
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
                    mounted && theme?.bannerEnabled ? "top-7 sm:top-10 h-[calc(100vh-theme(spacing.7))] sm:h-[calc(100vh-theme(spacing.10))]" : "h-full"
                  )}
                >
                  <SheetHeader className="p-3 border-b shrink-0"><SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight">Cart ({cartCount})</SheetTitle></SheetHeader>
                  <ScrollArea className="flex-1 p-6">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <ShoppingBag className="h-10 w-10 text-gray-200" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Your cart is empty.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {cart.map((item) => (
                          <div key={item.variantId} className="flex gap-4">
                            <div className="w-20 h-20 relative bg-gray-50 border shrink-0">{item.image && <NextImage src={item.image} alt="" fill className="object-cover" />}</div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <h3 className="text-[10px] font-bold uppercase leading-tight truncate max-w-[180px]">{item.name}</h3>
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
                    <SheetFooter className="p-4 border-t bg-gray-50 flex flex-col gap-4 shrink-0">
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold uppercase text-gray-400">Subtotal</span>
                          <span className="text-[11px] font-bold">C${formatCurrency(cartSubtotal)}</span>
                        </div>
                        {discountTotal > 0 && (
                          <div className="flex justify-between items-end text-emerald-600">
                            <span className="text-[10px] font-bold uppercase">Savings Applied</span>
                            <span className="text-[11px] font-bold">-C${formatCurrency(discountTotal)}</span>
                          </div>
                        )}
                      </div>
                      <Button asChild className="w-full h-11 bg-black text-white font-bold uppercase tracking-[0.2em] text-[10px] rounded-none">
                        <Link href="/checkout" onClick={() => setIsCartOpen(false)}>Checkout</Link>
                      </Button>
                    </SheetFooter>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {mounted && !isAdmin && !isProductPage && (
            <>
              {theme?.ratingBadgePosition === 'split' ? (
                <>
                  <div className="fixed bottom-4 left-4 z-[60] flex items-center gap-1" style={{ bottom: `calc(1rem + ${theme.ratingBadgeVerticalOffset || 0}px)` }}>
                    <ReviewSystem productId="global" />
                  </div>
                  <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-1" style={{ bottom: `calc(1rem + ${theme.ratingBadgeVerticalOffset || 0}px)` }}>
                    <ReviewSystem productId="global" />
                  </div>
                </>
              ) : (
                <div 
                  className="z-[60] flex items-center gap-1"
                  style={getBadgePositionStyle()}
                >
                  <ReviewSystem productId="global" />
                </div>
              )}
            </>
          )}
        </div>
      </header>
      <AuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </>
  );
}
