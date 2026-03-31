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
  User,
  Sparkles,
  LogOut,
  Package,
  CircleUser,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetFooter, SheetClose, SheetDescription } from '@/components/ui/sheet';
import { useCart, parseFirestoreDate } from '@/context/CartContext';
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
import { CountdownTimer } from '@/components/shared/CountdownTimer';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/storefront/LanguageSwitcher';
import { useAuthDialog } from '@/context/AuthDialogContext';
import { useToast } from '@/hooks/use-toast';
import { getLivePath } from '@/lib/paths';
import { Separator } from '@/components/ui/separator';
import { ReviewSystem } from '@/components/storefront/ReviewSystem';

export function Header({ initialTheme, initialStore }: { initialTheme?: any, initialStore?: any }) {
  const [mounted, setMounted] = useState(false);
  const { cart, cartCount, cartSubtotal, addToCart, removeFromCart, discountTotal, totalBeforeTax, promoConfig, thresholdProgress, THRESHOLD_VALUE } = useCart();
  const { wishlist, wishlistCount, toggleWishlist } = useWishlist();
  const { t } = useLanguage();
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [isFlashPillDismissed, setIsFlashPillDismissed] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('flash_pill_dismissed');
    if (dismissed === 'true') setIsFlashPillDismissed(true);
  }, []);

  const db = useFirestore();
  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme } = useDoc(themeRef, { initialData: initialTheme });

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/store')) : null, [db]);
  const { data: storeConfig, isLoading: storeLoading } = useDoc(storeConfigRef, { initialData: initialStore });

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
  const [pendingAuthOpen, setPendingAuthOpen] = useState(false);

  // Make sure the side menu is closed before opening the login box
  useEffect(() => {
    if (!isMenuOpen && pendingAuthOpen) {
      // Small delay to ensure the menu has finished closing
      const timer = setTimeout(() => {
        openAuth();
        setPendingAuthOpen(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isMenuOpen, pendingAuthOpen, openAuth]);


  const searchRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return allProducts?.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => {
      const aTime = a.createdAt?.seconds || new Date(a.createdAt).getTime() || 0;
      const bTime = b.createdAt?.seconds || new Date(b.createdAt).getTime() || 0;
      return bTime - aTime;
    }).slice(0, 50) || [];
  }, [allProducts, searchQuery]);

  const currentProductId = useMemo(() => {
    const match = pathname?.match(/\/products\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const isAdmin = useIsAdmin();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (pathname !== '/') {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const isTransparent = false; // Forced to false per user request to make header white always

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

  const isFlashActive = useMemo(() => {
    if (!promoConfig?.flashEnabled) return false;
    if (!promoConfig.flashCountdownEnabled) return true;
    const end = parseFirestoreDate(promoConfig.flashEndTime);
    return end ? new Date() < end : false;
  }, [promoConfig]);


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
          'fixed left-0 right-0 z-50 transition-all duration-500 h-12 sm:h-16 flex items-center border-b',
          isTransparent 
            ? 'bg-transparent border-transparent' 
            : 'bg-white border-border shadow-sm',
          theme?.bannerEnabled ? 'top-7 sm:top-10' : 'top-0'
        )}
      >
        <div className="max-w-[1440px] mx-auto w-full px-4 flex items-center gap-2 sm:gap-4 relative h-full">
          {/* Menu & Logo Section */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "lg:hidden h-9 w-9 p-0 transition-colors duration-300",
                    isTransparent ? "text-white" : "text-black"
                  )}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] bg-white border-r p-0 flex flex-col" hideClose>
                <SheetHeader className="p-8 pb-6 border-b border-border shrink-0 bg-white shadow-sm relative z-[100]">
                  <div className="flex items-center justify-between w-full mt-2">
                    <SheetTitle className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tighter text-black flex items-center gap-3 shrink-0">
                      {t('nav.menu')}
                    </SheetTitle>
                    <SheetClose className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 hover:scale-110 transition-all shrink-0 mt-2 -mr-1">
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </SheetClose>
                  </div>
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
                      {user ? (
                        <>
                          <Link
                            href="/account"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-lg font-headline uppercase text-black hover:opacity-60 flex items-center gap-3 w-full text-left"
                          >
                            <CircleUser className="h-5 w-5" /> My Account
                          </Link>
                          <button
                            onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                            className="text-lg font-headline uppercase text-red-600 hover:opacity-60 flex items-center gap-3 w-full text-left"
                          >
                            <LogOut className="h-5 w-5" /> Sign Out
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setPendingAuthOpen(true); setIsMenuOpen(false); }}
                          className="text-lg font-headline uppercase text-black hover:opacity-60 flex items-center gap-3 w-full text-left"
                        >
                          <CircleUser className="h-5 w-5" /> Sign In
                        </button>
                      )}
                    </div>
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
              {storeConfig?.logoUrl && (
                <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-sm overflow-hidden flex items-center justify-center">
                  <NextImage 
                    src={storeConfig.logoUrl} 
                    alt="Logo" 
                    fill 
                    sizes="32px" 
                    className={cn(
                      "object-contain transition-all duration-300",
                      isTransparent && "invert contrast-200"
                    )} 
                  />
                </div>
              )}
              <h1 className={cn(
                "text-lg sm:text-2xl font-headline font-bold tracking-tighter hidden md:block transition-colors duration-300",
                isTransparent ? "text-white" : "text-black"
              )}>
                {!storeLoading && (storeConfig?.businessName || " ")}
              </h1>
            </Link>
          </div>

          {/* Search Section (Desktop) */}
          <div className="flex-1 min-w-0 hidden lg:flex items-center justify-center" ref={searchRef}>
            <div className="relative w-full max-w-[400px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
              <Input
                placeholder={t('nav.search')}
                className={cn(
                  "pl-10 h-10 w-full border-none text-sm font-bold uppercase tracking-[0.2em] rounded-none focus-visible:ring-1 focus-visible:ring-black/20 transition-all duration-300",
                  isTransparent 
                    ? "bg-white/10 text-white placeholder:text-white/60 backdrop-blur-md" 
                    : "bg-gray-100 text-black placeholder:text-gray-400"
                )}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setIsSearching(true); }}
                onFocus={() => setIsSearching(true)}
              />
              {isSearching && searchQuery.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-9 w-9 text-black hover:bg-transparent"
                  onClick={() => { setSearchQuery(''); setIsSearching(false); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {isSearching && searchQuery.length >= 2 && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 w-full bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-[999] overflow-hidden rounded-lg">
                  <ScrollArea className="h-[440px]">
                    {filteredProducts.length === 0 ? (
                      <div className="p-8 text-center text-xs font-bold text-black/40">No products found.</div>
                    ) : (
                      <div className="divide-y">
                        {filteredProducts.map((p: any) => (
                          <Link key={p.id} href={`/products/${p.id}`} onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="flex gap-4 p-4 hover:bg-gray-50 transition-colors">
                            <div className="w-14 h-14 relative bg-gray-100 border shrink-0">{p.media?.[0]?.url && <NextImage src={p.media[0].url} alt="" fill sizes="56px" className="object-cover" />}</div>
                            <div className="flex-1 flex flex-col justify-start pt-0.5 min-w-0 pr-2">
                              <h3 className="text-xs text-black font-bold uppercase leading-tight mb-1">{p.name}</h3>
                              <p className="text-[10px] font-bold text-black/40 uppercase tracking-wider">C${Number(p.price).toFixed(2)}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>

          {/* Spacer for Mobile (Logo -> Actions) */}
          <div className="flex-1 lg:hidden" />

          {/* Actions Section */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Search (Mobile) */}
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "relative h-9 w-9 lg:hidden transition-colors duration-300",
                    isTransparent ? "text-white" : "text-black"
                  )}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="h-[100dvh] bg-white border-none p-0 flex flex-col" hideClose>
                <SheetHeader className="p-6 pb-4 border-b border-border shrink-0 bg-white shadow-sm relative z-[100]">
                  <div className="flex items-center justify-between w-full mt-2">
                    <SheetTitle className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tighter text-black flex items-center gap-3 shrink-0">
                      SEARCH
                    </SheetTitle>
                    <SheetDescription className="sr-only">Search for products by name or SKU.</SheetDescription>
                    <SheetClose className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 hover:scale-110 transition-all shrink-0 mt-2 mr-2">
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </SheetClose>
                  </div>
                </SheetHeader>
                <div className="px-4 pt-4 pb-4 space-y-4 flex-1 flex flex-col min-h-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <Input
                      autoFocus
                      placeholder="SEARCH PRODUCTS..."
                      className="pl-12 h-14 w-full bg-gray-50 border-none text-black text-xs font-bold uppercase tracking-[0.2em] rounded-none focus-visible:ring-1 focus-visible:ring-black/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    
                    {searchQuery.length >= 2 && (
                      <div className="absolute top-[calc(100%+8px)] left-0 right-0 w-full bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-[999] overflow-hidden rounded-lg animate-in fade-in zoom-in-95 duration-200">
                        <ScrollArea className="h-[400px]">
                          {filteredProducts.length === 0 ? (
                            <div className="p-8 text-center text-[10px] font-bold text-black/40 uppercase tracking-widest">No products found.</div>
                          ) : (
                            <div className="divide-y">
                              {filteredProducts.map((p: any) => (
                                <Link key={p.id} href={`/products/${p.id}`} onClick={() => { setSearchQuery(''); }} className="flex gap-4 p-4 hover:bg-gray-50 transition-colors">
                                  <div className="w-12 h-12 relative bg-gray-100 border shrink-0">{p.media?.[0]?.url && <NextImage src={p.media[0].url} alt="" fill sizes="48px" className="object-cover" />}</div>
                                  <div className="flex-1 flex flex-col justify-start pt-0.5 min-w-0">
                                    <h3 className="text-[10px] text-black font-bold uppercase leading-tight">{p.name}</h3>
                                    <p className="text-[9px] font-bold text-black/40 uppercase tracking-wider">C${Number(p.price).toFixed(2)}</p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "relative h-9 w-9 focus-visible:ring-0 focus-visible:ring-offset-0 hidden lg:flex shrink-0 transition-colors duration-300",
                    isTransparent ? "text-white" : "text-black"
                  )}
                >
                  <CircleUser className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border rounded-none shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-300 z-[1000]">
                {!user ? (
                  <DropdownMenuItem onClick={openAuth} className="font-headline font-bold uppercase text-[10px] tracking-widest p-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:text-black rounded-none">
                    <CircleUser className="h-4 w-4 mr-2" /> Sign In / Create Account
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "relative h-10 w-10 transition-colors duration-300",
                    isTransparent ? "text-white" : "text-black"
                  )}
                >
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-sm transition-all duration-300 animate-in zoom-in">{wishlistCount}</span>}
                </Button>
              </SheetTrigger>
              <SheetContent
                className={cn(
                  "w-full sm:max-w-md bg-white text-black p-0 flex flex-col border-none sm:border-l border-border shadow-none sm:shadow-2xl transition-all duration-500",
                  theme?.bannerEnabled
                    ? "top-0 sm:top-10 h-[100dvh] sm:h-[calc(100dvh-theme(spacing.10))]"
                    : "h-[100dvh]"
                )}
                hideClose
              >
                <SheetHeader className="p-8 pb-6 border-b border-border shrink-0 bg-white shadow-sm relative z-[100]">
                  <div className="flex items-center justify-between w-full mt-2">
                    <SheetTitle className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tighter text-black flex items-center gap-3 shrink-0">
                      WISHLIST {wishlistCount > 0 && <span className="text-red-600 text-sm sm:text-lg font-black bg-red-50 px-2 py-0.5 rounded-full">({wishlistCount})</span>}
                    </SheetTitle>
                    <SheetDescription className="sr-only">Your saved items.</SheetDescription>
                    <SheetClose className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 hover:scale-110 transition-all shrink-0 -mt-1 -mr-1">
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </SheetClose>
                  </div>
                </SheetHeader>
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
                            <div className="flex gap-4">
                              <button 
                                onClick={() => {
                                  addToCart({
                                    id: item.id,
                                    variantId: item.id, // Using item.id as default variant if not specified
                                    name: item.name,
                                    price: item.price,
                                    image: item.image || '',
                                    size: 'FREE SIZE', // Default size for quick add
                                    quantity: 1
                                  });
                                  toggleWishlist(item);
                                  setIsWishlistOpen(false);
                                  setIsCartOpen(true);
                                }}
                                className="text-[8px] font-bold uppercase tracking-widest text-primary hover:underline"
                              >
                                Add to Cart
                              </button>
                              <button onClick={() => toggleWishlist(item)} className="text-[8px] font-bold uppercase tracking-widest text-destructive text-left hover:underline">Remove</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {wishlist.length > 0 && (
                  <SheetFooter className="p-6 pb-20 sm:pb-6 border-t border-gray-100 bg-white flex flex-col gap-4 shrink-0 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-50">
                    <Button 
                      onClick={() => {
                        wishlist.forEach(item => {
                          addToCart({
                            id: item.id,
                            variantId: item.id,
                            name: item.name,
                            price: item.price,
                            image: item.image || '',
                            size: 'FREE SIZE',
                            quantity: 1
                          });
                        });
                        // Clear wishlist or just open cart
                        setIsWishlistOpen(false);
                        setIsCartOpen(true);
                      }}
                      className="w-full h-14 bg-black text-white hover:bg-black/90 font-bold uppercase tracking-[0.3em] text-[10px] rounded-none shadow-xl transition-all active:scale-[0.98]"
                    >
                      Add All to Cart
                    </Button>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>

            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "relative h-10 w-10 transition-colors duration-300",
                    isTransparent ? "text-white" : "text-black"
                  )}
                >
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black shadow-sm transition-all duration-300 animate-in zoom-in">{cartCount}</span>}
                </Button>
              </SheetTrigger>
              <SheetContent
                className={cn(
                  "w-full sm:max-w-md bg-white text-black p-0 flex flex-col border-none sm:border-l border-border shadow-none sm:shadow-2xl transition-all duration-500",
                  theme?.bannerEnabled
                    ? "top-0 sm:top-10 h-[100dvh] sm:h-[calc(100dvh-theme(spacing.10))]"
                    : "h-[100dvh]"
                )}
                hideClose
              >
                <SheetHeader className="p-8 pb-6 border-b border-border shrink-0 bg-white shadow-sm relative z-[100]">
                  <div className="flex items-center justify-between w-full mt-2">
                    <SheetTitle className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tighter text-black flex items-center gap-3 shrink-0">
                      CART {cartCount > 0 && <span className="text-red-600 text-sm sm:text-lg font-black bg-red-50 px-2 py-0.5 rounded-full">({cartCount})</span>}
                    </SheetTitle>
                    <SheetDescription className="sr-only">Your cart and total.</SheetDescription>
                    <SheetClose className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 hover:scale-110 transition-all shrink-0 -mt-1 -mr-1">
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </SheetClose>
                  </div>
                </SheetHeader>

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


          {!isAdmin && pathname === '/' && (
            <div className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-[60] flex flex-col gap-2 pointer-events-none">
              {isFlashActive && !isFlashPillDismissed && (
                <div className="pointer-events-auto">
                  <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl group">
                    <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                      <Zap className="h-3.5 w-3.5 text-orange-400 fill-orange-400 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white whitespace-nowrap">
                        {promoConfig.flashLabel || 'FLASH SALE'} <span className="text-orange-400">-{promoConfig.flashValue}%</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {promoConfig.flashCountdownEnabled && promoConfig.flashEndTime && (
                        <CountdownTimer 
                          endTime={promoConfig.flashEndTime} 
                          variant="minimal" 
                          className="text-[10px] font-bold text-orange-400 tabular-nums"
                        />
                      )}
                      
                      <Link href="/collections/6v6eO9n6U7f8lI6i9iGk" className="text-[8px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors border-r border-white/10 pr-3">Shop Now</Link>
                      
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsFlashPillDismissed(true);
                          sessionStorage.setItem('flash_pill_dismissed', 'true');
                        }}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </header>

      {(mounted && theme?.reviewBadgeVisibility !== false) && (
        <div 
          className={cn(
            "fixed",
            (isMenuOpen || isCartOpen || isWishlistOpen) ? "z-0 opacity-0 pointer-events-none" : "z-40"
          )}
          style={{
            right: 'var(--review-badge-right)',
            top: 'var(--review-badge-top)',
          }}
        >
          <ReviewSystem productId="global" variant="global-badge" customLabel="based 132" />
        </div>
      )}
    </>
  );
}
