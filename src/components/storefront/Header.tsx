'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Menu, 
  Search, 
  X, 
  Trash2, 
  ArrowRight, 
  Heart, 
  Zap, 
  User as UserIcon, 
  Loader2, 
  Sparkles, 
  MessageSquare,
  ChevronDown,
  ShieldCheck,
  History,
  TicketPercent,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useFirestore, useDoc, useMemoFirebase, useUser, useAuth, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { cart, cartCount, cartSubtotal, removeFromCart, thresholdProgress, THRESHOLD_VALUE } = useCart();
  const { wishlist, wishlistCount, toggleWishlist } = useWishlist();
  const { user } = useUser();
  const auth = useAuth();
  
  const db = useFirestore();
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: theme } = useDoc(themeRef);

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: storeConfig } = useDoc(storeConfigRef);

  const categoriesQuery = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const productsQuery = useMemoFirebase(() => db ? collection(db, 'products') : null, [db]);
  const { data: allProducts } = useCollection(productsQuery);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return allProducts?.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6) || [];
  }, [allProducts, searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogin = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        console.error("Authentication failed:", error);
      }
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const isAdmin = user && (user.email === 'fslno.dev@gmail.com' || user.uid === 'ulyu5w9XtYeVTmceUfOZLZwDQxF2');
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
          <div className="flex items-center gap-4 lg:gap-8">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] bg-white border-none p-0 flex flex-col">
                <SheetHeader className="pt-12 px-8 pb-8 border-b shrink-0">
                  <SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight">Archive Explorer</SheetTitle>
                </SheetHeader>
                
                <ScrollArea className="flex-1">
                  <div className="p-8 space-y-12">
                    <div className="space-y-6">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Shop Collections</h3>
                      <nav className="flex flex-col gap-6">
                        {categories?.map((cat: any) => (
                          <Link 
                            key={cat.id} 
                            href={`/collections/${cat.id}`} 
                            className="text-xl font-headline uppercase hover:opacity-60 transition-opacity"
                          >
                            {cat.name}
                          </Link>
                        ))}
                        <Link href="/collections/all" className="text-xl font-headline uppercase hover:opacity-60 transition-opacity">
                          All Drops
                        </Link>
                      </nav>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Your Account</h3>
                      {user ? (
                        <div className="space-y-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border">
                              <UserIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold uppercase">{user.displayName || 'Client'}</span>
                              <span className="text-[9px] text-gray-400 truncate max-w-[150px]">{user.email}</span>
                            </div>
                          </div>
                          
                          <nav className="flex flex-col gap-4">
                            <Link href="/account/history" className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:text-gray-400 transition-colors">
                              <History className="h-3.5 w-3.5" /> Order History
                            </Link>
                            <Link href="/account/promotions" className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:text-gray-400 transition-colors">
                              <TicketPercent className="h-3.5 w-3.5" /> Rewards & Perks
                            </Link>
                            {isAdmin && (
                              <Link href="/admin" className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:opacity-70 transition-opacity">
                                <ShieldCheck className="h-3.5 w-3.5" /> Studio Command Center
                              </Link>
                            )}
                          </nav>

                          <Button 
                            onClick={handleLogout} 
                            variant="outline" 
                            className="w-full h-12 rounded-none border-black font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out"
                          >
                            Sign Out
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          <Button 
                            onClick={handleLogin} 
                            className="bg-black text-white h-12 rounded-none font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out"
                          >
                            Sign In
                          </Button>
                          <Button 
                            onClick={handleLogin} 
                            variant="outline" 
                            className="h-12 rounded-none border-black font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out"
                          >
                            Join the Archive
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-3 group">
              {storeConfig?.logoUrl ? (
                <div className="relative w-8 h-8 rounded-sm overflow-hidden">
                  <Image src={storeConfig.logoUrl} alt="Logo" fill className="object-cover" />
                </div>
              ) : null}
              <h1 className="text-3xl font-headline font-bold tracking-tighter">
                {storeConfig?.businessName || "FSLNO"}
              </h1>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              <Link href="/collections/all" className="text-sm font-medium tracking-widest uppercase hover:opacity-60 transition-opacity">
                Explore All
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex items-center mr-2" ref={searchRef}>
              <Search className="absolute left-3 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <Input 
                placeholder="SEARCH" 
                className="pl-8 h-9 w-28 sm:w-40 md:w-56 bg-gray-50 border-gray-200 text-[9px] font-bold uppercase tracking-widest rounded-none focus-visible:ring-1 focus-visible:ring-black"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!isSearching) setIsSearching(true);
                }}
                onFocus={() => setIsSearching(true)}
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearching(false);
                  }}
                  className="absolute right-2 text-gray-400 hover:text-black transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}

              {isSearching && searchQuery.length >= 2 && (
                <div className="absolute top-full right-0 mt-2 w-[280px] md:w-[450px] bg-white border border-black/10 shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                      Results for "{searchQuery}"
                    </p>
                    <span className="text-[9px] font-bold uppercase text-black">{filteredProducts.length} Pieces Found</span>
                  </div>
                  
                  <ScrollArea className="max-h-[60vh]">
                    {filteredProducts.length === 0 ? (
                      <div className="p-12 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">No archival pieces found.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 divide-y">
                        {filteredProducts.map((product: any) => (
                          <Link 
                            key={product.id}
                            href={`/products/${product.id}`}
                            onClick={() => {
                              setIsSearching(false);
                              setSearchQuery('');
                            }}
                            className="group flex gap-4 p-4 hover:bg-gray-50 transition-all duration-300"
                          >
                            <div className="w-16 h-16 relative bg-gray-100 shrink-0 overflow-hidden border">
                              <Image 
                                src={product.media?.[0]?.url || 'https://picsum.photos/seed/placeholder/400/400'} 
                                alt={product.name} 
                                fill 
                                className="object-cover group-hover:scale-110 transition-transform duration-700" 
                              />
                            </div>
                            <div className="flex-1 flex flex-col justify-center gap-0.5 overflow-hidden">
                              <p className="text-[8px] uppercase tracking-widest font-bold text-gray-400 truncate">{product.brand || 'FSLNO ARCHIVE'}</p>
                              <h3 className="text-xs font-headline font-bold uppercase tracking-tight truncate group-hover:underline">{product.name}</h3>
                              <p className="text-[10px] font-bold">${formatCurrency(Number(product.price))} CAD</p>
                            </div>
                            <div className="flex items-center text-gray-300 group-hover:text-black transition-colors">
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out">
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                      {wishlistCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-white border-l p-0 flex flex-col">
                <SheetHeader className="pt-12 px-10 pb-8 border-b shrink-0">
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
                              <p className="text-sm font-bold">${formatCurrency(item.price)} CAD</p>
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
                <Button variant="ghost" size="icon" className="relative hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out">
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-white border-l p-0 flex flex-col">
                <SheetHeader className="pt-12 px-10 pb-8 border-b shrink-0 space-y-4">
                  <SheetTitle className="text-xl font-headline font-bold tracking-tight uppercase">Your Cart ({cartCount})</SheetTitle>
                  
                  {cartSubtotal > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <Zap className={cn("h-3 w-3", thresholdProgress >= 100 ? "text-yellow-500 fill-current" : "text-gray-300")} />
                          {thresholdProgress >= 100 ? "Discount Unlocked" : `$${formatCurrency(remainingForThreshold)} more for $100 off`}
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
                      <Button asChild variant="outline" className="mt-6 border-black text-black font-bold uppercase tracking-widest text-[10px] h-12 px-8 rounded-none hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out">
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
                                  {item.price === 0 ? 'FREE' : `$${formatCurrency(item.price * item.quantity)} CAD`}
                                </p>
                              </div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Size: {item.size}</p>
                              
                              {(item.customName || item.customNumber || item.specialNote) && (
                                <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-dashed border-gray-100">
                                  {(item.customName || item.customNumber) && (
                                    <p className="text-[9px] font-bold text-blue-600 uppercase flex items-center gap-1.5">
                                      <Sparkles className="h-2.5 w-2.5" />
                                      {item.customName} {item.customNumber && `#${item.customNumber}`}
                                    </p>
                                  )}
                                  {item.specialNote && (
                                    <p className="text-[9px] text-gray-400 italic flex items-start gap-1.5 leading-tight">
                                      <MessageSquare className="h-2.5 w-2.5 shrink-0 mt-0.5" />
                                      {item.specialNote}
                                    </p>
                                  )}
                                </div>
                              )}
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
                        <span className="text-xl font-bold">${formatCurrency(cartSubtotal)} CAD</span>
                      </div>
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest">
                        Tax and shipping calculated at checkout.
                      </p>
                    </div>
                    <Button asChild className="w-full h-16 bg-black text-white font-bold uppercase tracking-[0.2em] text-[11px] rounded-none hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out flex items-center justify-center gap-3 shadow-xl">
                      <Link href="/checkout">Checkout <ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}