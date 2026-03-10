'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronDown
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

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

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
          <div className="flex items-center gap-8">
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

            <div className="flex items-center gap-8">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] bg-white border-none p-0 flex flex-col">
                  <SheetHeader className="pt-12 px-8 pb-8 border-b shrink-0">
                    <SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight">Menu</SheetTitle>
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
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold uppercase">{user.displayName || 'Client'}</span>
                                <span className="text-[9px] text-gray-400 truncate max-w-[150px]">{user.email}</span>
                              </div>
                            </div>
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
                              Create Account
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              <nav className="hidden lg:flex items-center gap-8">
                <DropdownMenu>
                  <DropdownMenuTrigger className="text-sm font-medium tracking-widest uppercase hover:opacity-60 transition-opacity outline-none flex items-center gap-1.5">
                    Categories <ChevronDown className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-white border-black/10 rounded-none min-w-[240px] p-0 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-4 bg-gray-50 border-b">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Select Collection</p>
                    </div>
                    <div className="py-1">
                      {categories?.map((cat: any) => (
                        <DropdownMenuItem key={cat.id} asChild>
                          <Link href={`/collections/${cat.id}`} className="flex items-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-black hover:text-white transition-all duration-300">
                            {cat.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:inline-flex hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300 ease-in-out"
            >
              <Search className="h-5 w-5" />
            </Button>

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

            {isAdmin && (
              <Link 
                href="/admin" 
                className="text-xs uppercase tracking-widest font-semibold border-b border-transparent hover:border-black transition-all hidden md:inline ml-2"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* SEARCH DIALOG */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="sm:max-w-2xl bg-white border-none rounded-none p-0 overflow-hidden shadow-2xl">
          <div className="p-8 space-y-8">
            <DialogHeader className="p-0">
              <div className="flex items-center gap-4 border-b-2 border-black pb-4">
                <Search className="h-6 w-6 text-black" />
                <Input 
                  autoFocus
                  placeholder="SEARCH THE ARCHIVE..." 
                  className="border-none bg-transparent text-xl font-headline font-bold uppercase tracking-tight shadow-none focus-visible:ring-0 p-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="hover:rotate-90 transition-transform duration-300">
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                )}
              </div>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh]">
              {!searchQuery || searchQuery.length < 2 ? (
                <div className="py-12 text-center space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Discover recent drops</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {categories?.slice(0, 4).map(cat => (
                      <Link 
                        key={cat.id} 
                        href={`/collections/${cat.id}`}
                        onClick={() => setIsSearchOpen(false)}
                        className="px-4 py-2 bg-gray-50 border text-[10px] font-bold uppercase tracking-widest hover:bg-[#D3D3D3] hover:text-[#333333] transition-all duration-300"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-400">No pieces match your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 pb-8">
                  {filteredProducts.map((product: any) => (
                    <Link 
                      key={product.id}
                      href={`/products/${product.id}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="group flex gap-6 p-4 hover:bg-gray-50 transition-all duration-300 border border-transparent hover:border-gray-100"
                    >
                      <div className="w-24 h-24 relative bg-gray-100 shrink-0 overflow-hidden">
                        <Image 
                          src={product.media?.[0]?.url || 'https://picsum.photos/seed/placeholder/400/400'} 
                          alt={product.name} 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center gap-1">
                        <p className="text-[9px] uppercase tracking-widest font-bold text-gray-400">{product.brand || 'FSLNO'}</p>
                        <h3 className="text-lg font-headline font-bold uppercase tracking-tight group-hover:underline">{product.name}</h3>
                        <p className="text-sm font-bold">${formatCurrency(Number(product.price))} CAD</p>
                      </div>
                      <div className="flex items-center text-gray-300 group-hover:text-black transition-colors pr-4">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
