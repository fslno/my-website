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
  Sparkles,
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
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useAuth, useIsAdmin } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthDialog } from '@/context/AuthDialogContext';
import { useToast } from '@/hooks/use-toast';
import { getLivePath } from '@/lib/deployment';
import { Separator } from '@/components/ui/separator';
import { ReviewSystem } from '@/components/storefront/ReviewSystem';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const { cart, cartCount, cartSubtotal, removeFromCart, discountTotal, totalBeforeTax } = useCart();
  const { wishlist, wishlistCount, toggleWishlist } = useWishlist();
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();

  const db = useFirestore();
  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme } = useDoc(themeRef);

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/store')) : null, [db]);
  const { data: storeConfig, isLoading: storeLoading } = useDoc(storeConfigRef);

  const categoriesQuery = useMemoFirebase(() => db ? collection(db, getLivePath('categories')) : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const productsQuery = useMemoFirebase(() => db ? collection(db, getLivePath('products')) : null, [db]);
  const { data: allProducts, isLoading: productsLoading } = useCollection(productsQuery);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { openAuth } = useAuthDialog();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return allProducts?.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6) || [];
  }, [allProducts, searchQuery]);

  const currentProductId = useMemo(() => {
    const match = pathname?.match(/\/products\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const isAdmin = useIsAdmin();

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) return null;

  return (
    <>
      {theme?.bannerEnabled && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] h-7 sm:h-10 flex items-center justify-center uppercase tracking-[0.3em] font-bold text-white px-4 text-center"
          style={{ backgroundColor: theme.bannerBgColor || '#000000' }}
        >
          <span className="text-[7px] sm:text-[10px]">{theme.bannerText}</span>
        </div>
      )}
      <header
        className={cn(
          'fixed left-0 right-0 z-50 transition-all duration-300 h-12 sm:h-16 flex items-center bg-white border-b shadow-none',
          theme?.bannerEnabled ? 'top-7 sm:top-10' : 'top-0'
        )}
      >
        <div className="max-w-[1440px] mx-auto w-full px-4 flex items-center justify-between relative h-full">
          <div className="flex items-center gap-2 sm:gap-4">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-black h-10 w-10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] bg-white border-r p-0 flex flex-col">
                <SheetHeader className="pt-12 px-8 pb-8 border-b shrink-0">
                  <SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight text-black">
                    {!storeLoading && (storeConfig?.businessName || "HOME")}
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 p-8">
                  <nav className="flex flex-col gap-4">
                    {categories?.map((cat: any) => (
                      <Link
                        key={cat.id}
                        href={`/collections/${cat.id}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="text-lg font-headline uppercase text-black hover:opacity-60"
                      >
                        {cat.name}
                      </Link>
                    ))}

                    <Separator className="my-4" />

                    <div className="space-y-4">
                      <Link
                        href="/account"
                        onClick={() => setIsMenuOpen(false)}
                        className="text-lg font-headline uppercase text-black hover:opacity-60 flex items-center gap-3 w-full text-left"
                      >
                        <UserIcon className="h-5 w-5" /> My Account
                      </Link>
                    </div>
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2 group">
              {storeConfig?.logoUrl && (
                <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-sm overflow-hidden flex items-center justify-center">
                  <NextImage src={storeConfig.logoUrl} alt="Logo" fill className="object-contain" />
                </div>
              )}
              <h1 className="text-lg sm:text-2xl font-headline font-bold tracking-tighter text-black hidden sm:block">
                {!storeLoading && (storeConfig?.businessName || "Feiselino (FSLNO)")}
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex items-center" ref={searchRef}>
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <Input
                placeholder="SEARCH"
                className="pl-8 h-8 sm:h-9 w-24 sm:w-40 md:w-56 bg-gray-100 border-none text-black text-[9px] font-bold uppercase tracking-widest rounded-none focus-visible:ring-1 focus-visible:ring-black/20"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setIsSearching(true); }}
                onFocus={() => setIsSearching(true)}
              />
              {isSearching && searchQuery.length >= 2 && (
                <div className="absolute top-full right-0 mt-2 w-[280px] md:w-[400px] bg-white border shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2">
                  <ScrollArea className="max-h-[50vh]">
                    {filteredProducts.length === 0 ? (
                      <div className="p-8 text-center text-[10px] font-bold text-black/40">No products found.</div>
                    ) : (
                      <div className="divide-y">
                        {filteredProducts.map((p: any) => (
                          <Link key={p.id} href={`/products/${p.id}`} onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="flex gap-4 p-4 hover:bg-gray-50 transition-colors">
                            <div className="w-12 h-12 relative bg-gray-100 border shrink-0">{p.media?.[0]?.url && <NextImage src={p.media[0].url} alt="" fill className="object-cover" />}</div>
                            <div className="flex flex-col justify-center overflow-hidden">
                              <h3 className="text-[10px] text-black font-bold uppercase truncate">{p.name}</h3>
                              <p className="text-[9px] font-bold text-black/40">C${Number(p.price).toFixed(2)}</p>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 text-black focus-visible:ring-0 focus-visible:ring-offset-0">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border rounded-none shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  {!user ? (
                    <DropdownMenuItem onClick={openAuth} className="font-headline font-bold uppercase text-[10px] tracking-widest p-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:text-black rounded-none">
                      <UserIcon className="h-3.5 w-3.5 mr-2" /> Sign In / Create Account
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <div className="px-3 py-2 mb-2">
                        <p className="text-[8px] font-bold text-black/40 uppercase tracking-widest">Account Status</p>
                        <p className="text-[10px] font-bold text-black truncate mt-0.5">{user.email}</p>
                      </div>
                      <DropdownMenuItem asChild className="font-headline font-bold uppercase text-[10px] tracking-widest p-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:text-black rounded-none">
                        <Link href="/account" className="flex items-center">
                          <Package className="h-3.5 w-3.5 mr-2" /> My Orders
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="font-headline font-bold uppercase text-[10px] tracking-widest p-3 cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600 focus:text-red-700 rounded-none mt-1">
                        <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Sheet open={isWishlistOpen} onOpenChange={setIsWishlistOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 text-black">
                    <Heart className="h-4 w-4" />
                    {wishlistCount > 0 && <span className="absolute top-1.5 right-1.5 bg-black text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center font-bold">{wishlistCount}</span>}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className={cn(
                    "w-full sm:max-w-md bg-white text-black p-0 flex flex-col border-l border-border shadow-2xl transition-all duration-500",
                    theme?.bannerEnabled ? "top-7 sm:top-10 h-[calc(100vh-theme(spacing.7))] sm:h-[calc(100vh-theme(spacing.10))]" : "h-full"
                  )}
                >
                  <SheetHeader className="p-6 border-b border-border shrink-0"><SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight text-black">Wishlist ({wishlistCount})</SheetTitle></SheetHeader>
                  <ScrollArea className="flex-1 p-6">
                    {wishlist.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <Heart className="h-10 w-10 text-black/10" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your wishlist is empty.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {wishlist.map((item) => (
                          <div key={item.id} className="flex gap-4">
                            <Link href={`/products/${item.id}`} onClick={() => setIsWishlistOpen(false)} className="w-20 h-20 relative bg-gray-50 border border-gray-100 shrink-0">{item.image && <NextImage src={item.image} alt="" fill className="object-cover" />}</Link>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <h3 className="text-[10px] font-bold uppercase leading-tight text-black">{item.name}</h3>
                                <p className="text-[10px] font-bold mt-1 text-black">C${item.price.toFixed(2)}</p>
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
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 text-black">
                    <ShoppingBag className="h-4 w-4" />
                    {cartCount > 0 && <span className="absolute top-1.5 right-1.5 bg-black text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center font-bold">{cartCount}</span>}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className={cn(
                    "w-full sm:max-w-md bg-white text-black p-0 flex flex-col border-none sm:border-l border-border shadow-none sm:shadow-2xl transition-all duration-500",
                    theme?.bannerEnabled
                      ? "top-0 sm:top-10 h-[100dvh] sm:h-[calc(100dvh-theme(spacing.10))]"
                      : "h-[100dvh]"
                  )}
                >
                  <SheetHeader className="p-6 border-b border-border shrink-0"><SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight text-black">Cart ({cartCount})</SheetTitle></SheetHeader>
                  <ScrollArea className="flex-1 p-6">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <ShoppingBag className="h-10 w-10 text-black/10" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your cart is empty.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {cart.map((item) => (
                          <div key={item.variantId} className="flex gap-4">
                            <div className="w-20 h-20 relative bg-gray-50 border border-gray-100 shrink-0">{item.image && <NextImage src={item.image} alt="" fill className="object-cover" />}</div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <h3 className="text-[10px] font-bold uppercase leading-tight truncate max-w-[180px] text-black">{item.name}</h3>
                                  <p className="text-[10px] font-bold whitespace-nowrap text-black">C${formatCurrency(item.price * item.quantity)}</p>
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <p className="text-[8px] font-bold text-muted-foreground uppercase">Size: {item.size}</p>
                                  <p className="text-[8px] font-bold text-black/80 uppercase">Qty: {item.quantity}</p>
                                </div>

                                {(item.customName || item.customNumber || item.specialNote) && (
                                  <div className="mt-2 space-y-0.5 border-t border-dashed border-gray-100 pt-1">
                                    {(item.customName || item.customNumber) && (
                                      <p className="text-[8px] font-bold text-blue-600 uppercase flex items-center gap-1">
                                        <Sparkles className="h-2 w-2" /> {item.customName} {item.customNumber && `#${item.customNumber}`}
                                      </p>
                                    )}
                                    {item.specialNote && (
                                      <p className="text-[8px] text-gray-400 italic leading-tight">"{item.specialNote}"</p>
                                    )}
                                  </div>
                                )}
                              </div>
                              <button onClick={() => removeFromCart(item.variantId)} className="text-[8px] font-bold uppercase tracking-widest text-destructive text-left hover:underline mt-2">Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  {cart.length > 0 && (
                    <SheetFooter className="p-6 pb-20 sm:pb-6 border-t border-gray-100 bg-white flex flex-col gap-4 shrink-0 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-50">
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">Subtotal</span>
                          <span className="text-[11px] font-bold text-black">C${formatCurrency(cartSubtotal)}</span>
                        </div>
                        {discountTotal > 0 && (
                          <div className="flex justify-between items-end text-emerald-600">
                            <span className="text-[10px] font-bold uppercase">Savings Applied</span>
                            <span className="text-[11px] font-bold">-C${formatCurrency(discountTotal)}</span>
                          </div>
                        )}
                      </div>
                      <Button asChild className="w-full h-14 bg-black text-white hover:bg-black/90 font-bold uppercase tracking-[0.3em] text-[10px] rounded-none shadow-xl transition-all active:scale-[0.98]">
                        <Link href="/checkout" onClick={() => setIsCartOpen(false)}>Checkout</Link>
                      </Button>
                    </SheetFooter>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {!isAdmin && !productsLoading && (
            <div className="absolute right-4 bottom-0 translate-y-full z-[60] flex items-center gap-1">
              {!currentProductId && <ReviewSystem productId="global" />}
            </div>
          )}
        </div>
      </header>
    </>
  );
}
