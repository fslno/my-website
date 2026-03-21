'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Heart, 
  User as UserIcon,
  LogOut,
  Package,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Tag,
  Sparkles,
  Search as SearchIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import NextImage from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useAuth } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { AuthDialog } from '@/components/storefront/AuthDialog';
import { useToast } from '@/hooks/use-toast';
import { getLivePath } from '@/lib/deployment';
import { ReviewSystem } from '@/components/storefront/ReviewSystem';
import { Separator } from '@/components/ui/separator';

/**
 * Authoritative Header Manifest.
 * Recalibrated for hydration stability and zero-latency mobile fitting.
 * High-density cart scaling (w-14) implemented for mobile real estate.
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

  const categoriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, getLivePath('categories')), orderBy('order', 'asc'));
  }, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, getLivePath('products'));
  }, [db]);
  const { data: allProducts } = useCollection(productsQuery);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = useMemo(() => pathname?.startsWith('/admin'), [pathname]);
  const isProductPage = useMemo(() => pathname?.includes('/products/'), [pathname]);

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2 || !allProducts) return [];
    return allProducts.filter(p => 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10);
  }, [searchQuery, allProducts]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await auth.signOut();
      toast({ title: "Signed out", description: "You have been signed out." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Sign out failed." });
    }
  };

  const formatCurrency = (val: number) => (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  if (isAdmin) return null;

  // Hydration Shield: Strictly return null until mounted to ensure server/client tree parity.
  if (!mounted) return null;

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
          'fixed left-0 right-0 z-50 transition-all duration-300 h-12 sm:h-16 flex items-center bg-white border-b border-black/5',
          theme?.bannerEnabled ? 'top-7 sm:top-10' : 'top-0'
        )}
      >
        <div className="max-w-[1440px] mx-auto w-full px-4 flex items-center justify-between relative h-full">
          
          <div className="flex items-center gap-2 lg:gap-8">
            {/* MOBILE MENU TRIGGER */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:max-w-sm p-0 bg-white flex flex-col border-none shadow-2xl">
                <SheetHeader className="p-6 border-b shrink-0">
                  <SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight text-left">Navigation</SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Shop Archive</h3>
                      <div className="flex flex-col gap-4">
                        <Link href="/collections/all" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest hover:pl-2 transition-all flex items-center justify-between group">
                          All Products <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        {categories?.map((cat: any) => (
                          <Link key={cat.id} href={`/collections/${cat.id}`} onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest hover:pl-2 transition-all flex items-center justify-between group">
                            {cat.name} <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Account</h3>
                      <div className="flex flex-col gap-4">
                        {user ? (
                          <>
                            <Link href="/account/orders" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest flex items-center gap-3">
                              <Package className="h-4 w-4" /> My Orders
                            </Link>
                            <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="text-sm font-bold uppercase tracking-widest text-destructive flex items-center gap-3">
                              <LogOut className="h-4 w-4" /> Sign Out
                            </button>
                          </>
                        ) : (
                          <button onClick={() => { setIsAuthOpen(true); setIsMenuOpen(false); }} className="text-sm font-bold uppercase tracking-widest flex items-center gap-3">
                            <UserIcon className="h-4 w-4" /> Sign In / Join
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <div className="p-6 border-t bg-gray-50/50">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 text-center">FSLNO STUDIO v1.0</p>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2 group">
              {storeConfig?.logoUrl && (
                <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-sm overflow-hidden">
                  <NextImage src={storeConfig.logoUrl} alt="Logo" fill className="object-cover" />
                </div>
              )}
              <h1 className="text-sm sm:text-xl md:text-2xl font-headline font-bold tracking-tighter text-primary truncate">
                {storeConfig?.businessName || ""}
              </h1>
            </Link>

            {/* DESKTOP CATEGORY LINKS - DROPDOWN MANIFEST */}
            <nav className="hidden lg:flex items-center gap-6 ml-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-[10px] font-bold uppercase tracking-widest hover:text-gray-400 transition-colors flex items-center gap-1.5 outline-none">
                    Shop <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 rounded-none p-1 border-black/10 shadow-2xl bg-white mt-2">
                  <DropdownMenuItem asChild className="focus:bg-black focus:text-white rounded-none cursor-pointer">
                    <Link href="/collections/all" className="text-[10px] font-bold uppercase tracking-widest w-full py-2.5">All Products</Link>
                  </DropdownMenuItem>
                  <Separator className="my-1 opacity-50" />
                  {categories?.map((cat: any) => (
                    <DropdownMenuItem key={cat.id} asChild className="focus:bg-black focus:text-white rounded-none cursor-pointer">
                      <Link href={`/collections/${cat.id}`} className="text-[10px] font-bold uppercase tracking-widest w-full py-2.5">{cat.name}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsSearchOpen(true)}>
                <SearchIcon className="h-4 w-4" />
              </Button>

              {/* DESKTOP AUTH BUTTON */}
              <Button variant="ghost" size="icon" className="h-9 w-9 hidden lg:flex" onClick={() => user ? null : setIsAuthOpen(true)}>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><UserIcon className="h-4 w-4" /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-none p-1 border-black/10 shadow-xl bg-white">
                      <DropdownMenuItem asChild className="focus:bg-black focus:text-white rounded-none cursor-pointer">
                        <Link href="/account/orders" className="text-[10px] font-bold uppercase tracking-widest w-full py-2">My Orders</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="focus:bg-red-50 focus:text-destructive rounded-none cursor-pointer text-destructive">
                        <span className="text-[10px] font-bold uppercase tracking-widest w-full py-2">Sign Out</span>
                      </DropdownMenuItem>
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
                            <Link href={`/products/${item.id}`} onClick={() => setIsWishlistOpen(false)} className="w-20 h-20 relative bg-gray-100 border shrink-0 overflow-hidden rounded-sm">
                              {item.image && <NextImage src={item.image} alt="" fill className="object-cover" />}
                            </Link>
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
                          <div key={item.variantId} className="flex gap-2 group border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                            <div className="w-14 h-14 relative bg-gray-50 border shrink-0 overflow-hidden rounded-sm">
                              {item.image && <NextImage src={item.image} alt="" fill className="object-cover" />}
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                              <div className="text-left">
                                <div className="flex justify-between items-start gap-1.5">
                                  <h3 className="text-[10px] font-bold uppercase leading-tight line-clamp-2 flex-1">{item.name}</h3>
                                  <p className="text-[10px] font-bold whitespace-nowrap shrink-0 ml-2">C${formatCurrency(item.price * item.quantity)}</p>
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <p className="text-[8px] font-bold text-gray-400 uppercase">Size: {item.size}</p>
                                  <p className="text-[8px] font-bold text-primary uppercase">Qty: {item.quantity}</p>
                                </div>
                                
                                {/* Customization and Special Instructions Manifest */}
                                {(item.customName || item.customNumber || item.specialNote) && (
                                  <div className="mt-2 pl-2 border-l-2 border-blue-50 space-y-1">
                                    {(item.customName || item.customNumber) && (
                                      <p className="text-[8px] font-bold text-blue-600 uppercase flex items-center gap-1">
                                        <Sparkles className="h-2 w-2" /> {item.customName} {item.customNumber && `#${item.customNumber}`}
                                      </p>
                                    )}
                                    {item.specialNote && (
                                      <p className="text-[8px] text-gray-400 italic">"{item.specialNote}"</p>
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

      {/* SEARCH DIALOG */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-2xl bg-white border-none rounded-none p-0 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>Search Archive</DialogTitle>
            <DialogDescription>Search through the collection by name or SKU.</DialogDescription>
          </DialogHeader>
          <div className="p-6 border-b flex items-center gap-4">
            <SearchIcon className="h-5 w-5 text-gray-400" />
            <Input 
              placeholder="SEARCH THE ARCHIVE..." 
              className="border-none shadow-none focus-visible:ring-0 text-lg font-headline font-bold uppercase p-0 h-auto placeholder:text-gray-200"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {searchResults.map(product => (
                    <Link 
                      key={product.id} 
                      href={`/products/${product.id}`} 
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                      <div className="w-16 h-16 relative bg-gray-50 border rounded-sm overflow-hidden shrink-0">
                        {product.media?.[0]?.url && <NextImage src={product.media[0].url} alt="" fill className="object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-tight group-hover:underline line-clamp-2 leading-snug">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] font-bold">C${(Number(product.price)||0).toFixed(2)}</p>
                          {product.sku && <p className="text-[8px] font-mono text-gray-400 uppercase">{product.sku}</p>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="py-20 text-center space-y-2">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-[0.2em]">No results found.</p>
                  <p className="text-[8px] font-bold uppercase text-gray-300 tracking-widest italic">Verify your query manifest.</p>
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                    <SearchIcon className="h-5 w-5 text-gray-200" />
                  </div>
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-[0.3em] italic">Start typing to search...</p>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t bg-gray-50/50 flex justify-center">
            <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Press Esc to exit</p>
          </div>
        </DialogContent>
      </Dialog>

      <AuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </>
  );
}
