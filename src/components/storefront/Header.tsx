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
  Loader2, 
  Sparkles, 
  MessageSquare,
  ChevronDown,
  TicketPercent,
  Settings,
  User as UserIcon,
  LogOut,
  Package,
  Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useFirestore, useDoc, useMemoFirebase, useCollection, useUser, useAuth } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AuthDialog } from '@/components/storefront/AuthDialog';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { getLivePath } from '@/lib/deployment';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { cart, cartCount, cartSubtotal, removeFromCart, updateCartItem, thresholdProgress, THRESHOLD_VALUE } = useCart();
  const { wishlist, wishlistCount, toggleWishlist } = useWishlist();
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  
  const db = useFirestore();
  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme } = useDoc(themeRef);

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/store')) : null, [db]);
  const { data: storeConfig, isLoading: storeLoading } = useDoc(storeConfigRef);

  const categoriesQuery = useMemoFirebase(() => db ? collection(db, getLivePath('categories')) : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const productsQuery = useMemoFirebase(() => db ? collection(db, getLivePath('products')) : null, [db]);
  const { data: allProducts } = useCollection(productsQuery);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  // Controlled Sheet States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ name: '', number: '', note: '' });

  const filteredProducts = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    return allProducts?.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6) || [];
  }, [allProducts, searchQuery]);

  useEffect(() => {
    setMounted(true);
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

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await auth.signOut();
      toast({
        title: "Signed out",
        description: "Session closed.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Logout failed.",
      });
    }
  };

  const handleStartEdit = (item: any) => {
    setEditingVariantId(item.variantId);
    setEditFields({
      name: item.customName || '',
      number: item.customNumber || '',
      note: item.specialNote || ''
    });
  };

  const handleSaveEdit = (variantId: string) => {
    updateCartItem(variantId, {
      customName: editFields.name,
      customNumber: editFields.number,
      specialNote: editFields.note
    });
    setEditingVariantId(null);
    toast({
      title: "Updated",
      description: "Customization saved.",
    });
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const remainingForThreshold = Math.max(0, THRESHOLD_VALUE - cartSubtotal);

  if (!mounted) return null;

  return (
    <>
      {theme?.bannerEnabled && (
        <div 
          className="fixed top-0 left-0 right-0 z-[60] h-7 sm:h-10 flex items-center justify-center uppercase tracking-[0.3em] font-bold text-white px-4 text-center banner-style"
          style={{ backgroundColor: theme.bannerBgColor || 'var(--primary)' }}
        >
          {theme.bannerText}
        </div>
      )}
      <header
        className={cn(
          'fixed left-0 right-0 z-50 transition-all duration-300 h-16 sm:h-20 flex items-center bg-white border-b shadow-sm',
          theme?.bannerEnabled ? 'top-7 sm:top-10' : 'top-0'
        )}
      >
        <div className="max-w-[1440px] mx-auto w-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-8">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-primary h-10 w-10">
                  <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] bg-white border-none p-0 flex flex-col">
                <SheetHeader className="pt-12 px-8 pb-8 border-b shrink-0">
                  <SheetTitle className="text-xl sm:text-2xl font-headline font-bold uppercase tracking-tight text-primary flex items-center gap-3">
                    {storeConfig?.logoUrl && (
                      <div className="relative w-6 h-6 rounded-sm overflow-hidden">
                        <Image src={storeConfig.logoUrl} alt="Logo" fill className="object-cover" />
                      </div>
                    )}
                    {!storeLoading && (storeConfig?.businessName || "STUDIO")}
                  </SheetTitle>
                </SheetHeader>
                
                <ScrollArea className="flex-1">
                  <div className="p-8 space-y-12">
                    <div className="space-y-6">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Collections</h3>
                      <nav className="flex flex-col gap-6">
                        {categories?.map((cat: any) => (
                          <Link 
                            key={cat.id} 
                            href={`/collections/${cat.id}`} 
                            onClick={() => setIsMenuOpen(false)}
                            className="text-lg sm:text-xl font-headline uppercase text-primary hover:opacity-60 transition-opacity"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </nav>
                    </div>

                    <div className="pt-8 border-t space-y-6">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account</h3>
                      {user ? (
                        <div className="space-y-4">
                          <p className="text-[10px] font-bold uppercase text-primary truncate">{user.displayName || user.email}</p>
                          <nav className="flex flex-col gap-4">
                            <Link href="/account/orders" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                              <Package className="h-4 w-4" /> Orders
                            </Link>
                            <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-destructive">
                              <LogOut className="h-4 w-4" /> Sign Out
                            </button>
                          </nav>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => { setIsAuthOpen(true); setIsMenuOpen(false); }}
                          className="w-full h-12 bg-black text-white font-bold uppercase tracking-widest text-[10px] rounded-none"
                        >
                          Sign In
                        </Button>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              {storeConfig?.logoUrl ? (
                <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-sm overflow-hidden">
                  <Image src={storeConfig.logoUrl} alt="Logo" fill className="object-cover" />
                </div>
              ) : null}
              <h1 className="text-xl sm:text-3xl font-headline font-bold tracking-tighter text-primary hidden sm:block">
                {!storeLoading && (storeConfig?.businessName || "STUDIO")}
              </h1>
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm font-medium tracking-widest uppercase text-primary hover:opacity-60 transition-opacity outline-none flex items-center gap-1.5">
                  Shop <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-white border border-black/10 shadow-xl rounded-none p-0 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="py-2">
                    {categories?.map((cat: any) => (
                      <DropdownMenuItem key={cat.id} asChild>
                        <Link 
                          href={`/collections/${cat.id}`}
                          className="flex items-center px-4 py-3 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                        >
                          {cat.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="relative flex items-center mr-1 sm:mr-2" ref={searchRef}>
              <Search className="absolute left-2.5 sm:left-3 h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground pointer-events-none" />
              <Input 
                placeholder="SEARCH" 
                className="pl-7 sm:pl-8 h-8 sm:h-9 w-24 sm:w-40 md:w-56 bg-gray-50 border-gray-200 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest rounded-none focus-visible:ring-1 focus-visible:ring-primary transition-all duration-300 placeholder:text-muted-foreground/50"
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
                  className="absolute right-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}

              {isSearching && searchQuery.length >= 2 && (
                <div className="absolute top-full right-0 mt-2 w-[280px] md:w-[450px] bg-white border border-black/10 shadow-2xl z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Results for "{searchQuery}"
                    </p>
                    <span className="text-[9px] font-bold uppercase text-primary">{filteredProducts.length} items</span>
                  </div>
                  
                  <ScrollArea className="max-h-[60vh]">
                    {filteredProducts.length === 0 ? (
                      <div className="p-12 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">No matches.</p>
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
                              {product.media?.[0]?.url && (
                                <Image 
                                  src={product.media[0].url} 
                                  alt={product.name} 
                                  fill 
                                  className="object-cover group-hover:scale-110 transition-transform duration-700" 
                                />
                              )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center gap-0.5 overflow-hidden">
                              <p className="text-[8px] uppercase tracking-widest font-bold text-muted-foreground truncate">{product.brand || 'FSLNO Studio'}</p>
                              <h3 className="text-xs font-headline font-bold uppercase tracking-tight line-clamp-2 text-primary group-hover:underline leading-tight">{product.name}</h3>
                              <p className="text-[10px] font-bold text-primary">{`C$${formatCurrency(Number(product.price))}`}</p>
                            </div>
                            <div className="flex items-center text-muted-foreground group-hover:text-primary transition-colors">
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

            <div className="flex items-center gap-0.5 sm:gap-1">
              <div className="hidden sm:flex">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-primary hover:bg-secondary transition-all rounded-sm h-10 w-10">
                        <UserIcon className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white border border-black/10 shadow-xl rounded-none p-0 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <DropdownMenuLabel className="p-4">
                        <div className="flex flex-col space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-primary truncate">
                            {user.displayName || user.email}
                          </p>
                          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            Member
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="m-0 bg-black/5" />
                      <div className="py-1">
                        <DropdownMenuItem asChild>
                          <Link href="/account/orders" className="flex items-center px-4 py-3 text-[9px] font-bold uppercase tracking-widest cursor-pointer hover:bg-gray-50">
                            <Package className="mr-3 h-3.5 w-3.5" /> Orders
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogout} className="flex items-center px-4 py-3 text-[9px] font-bold uppercase tracking-widest cursor-pointer text-destructive hover:bg-red-50">
                          <LogOut className="mr-3 h-3.5 w-3.5" /> Sign Out
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-primary hover:bg-secondary transition-all rounded-sm h-10 w-10"
                    onClick={() => setIsAuthOpen(true)}
                  >
                    <UserIcon className="h-5 w-5" />
                  </Button>
                )}
              </div>

              <Sheet open={isWishlistOpen} onOpenChange={setIsWishlistOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-primary hover:bg-secondary transition-all h-10 w-10">
                    <Heart className="h-5 w-5" />
                    {wishlistCount > 0 && (
                      <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[8px] sm:text-[10px] w-3 h-3 sm:w-4 sm:h-4 rounded-full flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md bg-white border-l p-0 flex flex-col">
                  <SheetHeader className="pt-12 px-10 pb-8 border-b shrink-0">
                    <SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight text-center text-primary">Wishlist ({wishlistCount})</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="flex-1">
                    {wishlist.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
                        <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Save favorites here.</p>
                      </div>
                    ) : (
                      <div className="p-6 space-y-8">
                        {wishlist.map((item) => (
                          <div key={item.id} className="flex gap-4">
                            <Link 
                              href={`/products/${item.id}`} 
                              onClick={() => setIsWishlistOpen(false)}
                              className="w-20 h-20 relative bg-gray-100 border shrink-0"
                            >
                              {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                            </Link>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div className="space-y-1">
                                <h3 className="text-xs font-bold uppercase tracking-tight leading-tight text-primary">{item.name}</h3>
                                <p className="text-sm font-bold text-primary">{`C$${formatCurrency(item.price)}`}</p>
                              </div>
                              <button 
                                onClick={() => toggleWishlist(item)}
                                className="text-[10px] font-bold uppercase tracking-widest text-destructive hover:underline text-left"
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
              
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-primary hover:bg-secondary transition-all h-10 w-10">
                    <ShoppingBag className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[8px] sm:text-[10px] w-3 h-3 sm:w-4 sm:h-4 rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md bg-white border-l p-0 flex flex-col">
                  <SheetHeader className="pt-12 px-10 pb-8 border-b shrink-0 space-y-4">
                    <SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight text-primary">Cart ({cartCount})</SheetTitle>
                    
                    {cartSubtotal > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-primary">
                          <span className="flex items-center gap-1.5">
                            <Zap className={cn("h-3 w-3", thresholdProgress >= 100 ? "text-yellow-500 fill-current" : "text-muted-foreground")} />
                            {thresholdProgress >= 100 ? "Discount unlocked" : `${`C$${formatCurrency(remainingForThreshold)}`} more for $100 off`}
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
                        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Cart empty.</p>
                        <Button asChild variant="outline" className="mt-6 border-primary text-primary font-bold uppercase tracking-widest text-[10px] h-12 px-8 rounded-none hover:bg-secondary transition-all">
                          <Link href="/" onClick={() => setIsCartOpen(false)}>Shop now</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="p-6 space-y-8">
                        {cart.map((item) => (
                          <div key={item.variantId} className="flex gap-4">
                            <div className="w-24 h-24 relative bg-gray-100 overflow-hidden border shrink-0">
                              <Link href={`/products/${item.id}`} onClick={() => setIsCartOpen(false)}>
                                {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                              </Link>
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div className="space-y-1">
                                <div className="flex justify-between items-start">
                                  <Link href={`/products/${item.id}`} onClick={() => setIsCartOpen(false)}>
                                    <h3 className="text-xs font-bold uppercase tracking-tight leading-tight max-w-[180px] text-primary line-clamp-2 hover:underline">{item.name}</h3>
                                  </Link>
                                  <p className="text-sm font-bold text-primary">
                                    {item.price === 0 ? 'FREE' : `C$${formatCurrency(item.price * item.quantity)}`}
                                  </p>
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Size: {item.size}</p>
                                
                                {editingVariantId === item.variantId ? (
                                  <div className="flex flex-col gap-2 mt-2 p-3 bg-gray-50 border border-dashed rounded-none animate-in fade-in duration-300">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-[8px] font-bold uppercase text-gray-400">Name</Label>
                                        <Input 
                                          value={editFields.name} 
                                          onChange={(e) => setEditFields({...editFields, name: e.target.value.toUpperCase()})}
                                          className="h-7 text-[9px] font-bold rounded-none bg-white focus-visible:ring-1 focus-visible:ring-black"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[8px] font-bold uppercase text-gray-400">No.</Label>
                                        <Input 
                                          value={editFields.number} 
                                          maxLength={2}
                                          onChange={(e) => setEditFields({...editFields, number: e.target.value})}
                                          className="h-7 text-[9px] font-bold text-center rounded-none bg-white focus-visible:ring-1 focus-visible:ring-black"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[8px] font-bold uppercase text-gray-400">Note</Label>
                                      <Input 
                                        value={editFields.note} 
                                        onChange={(e) => setEditFields({...editFields, note: e.target.value.toUpperCase()})}
                                        className="h-7 text-[9px] font-bold rounded-none bg-white focus-visible:ring-1 focus-visible:ring-black"
                                      />
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                      <Button 
                                        size="sm" 
                                        className="h-7 flex-1 text-[8px] font-bold uppercase tracking-widest rounded-none bg-black text-white hover:bg-black/80"
                                        onClick={() => handleSaveEdit(item.variantId)}
                                      >
                                        Save
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="h-7 px-3 text-[8px] font-bold uppercase tracking-widest rounded-none border-gray-200"
                                        onClick={() => setEditingVariantId(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-dashed border-gray-100 group/custom relative">
                                    <div className="flex flex-col gap-1 pr-10">
                                      {(item.customName || item.customNumber) && (
                                        <p className="text-[9px] font-bold text-blue-600 uppercase flex items-center gap-1.5">
                                          <Sparkles className="h-2.5 w-2.5" />
                                          {item.customName} {item.customNumber && `#${item.customNumber}`}
                                        </p>
                                      )}
                                      {item.specialNote && (
                                        <p className="text-[9px] text-muted-foreground italic flex items-start gap-1.5 mt-0.5">
                                          <MessageSquare className="h-2.5 w-2.5 shrink-0 mt-0.5" />
                                          {item.specialNote}
                                        </p>
                                      )}
                                    </div>
                                    <button 
                                      onClick={() => handleStartEdit(item)}
                                      className="absolute right-0 top-1 text-[8px] font-bold uppercase tracking-widest text-blue-600 hover:underline opacity-0 group-hover/custom:opacity-100 transition-opacity"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between pt-2">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Qty: {item.quantity}</p>
                                {!item.isPromo && (
                                  <button 
                                    onClick={() => removeFromCart(item.variantId)}
                                    className="text-muted-foreground hover:text-destructive transition-colors"
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
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subtotal</span>
                          <span className="text-xl font-bold text-primary">{`C$${formatCurrency(cartSubtotal)}`}</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">
                          Tax and shipping at checkout.
                        </p>
                      </div>
                      <Button asChild className="w-full h-16 bg-primary text-primary-foreground font-bold uppercase tracking-[0.3em] text-[11px] rounded-none hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl">
                        <Link href="/checkout" onClick={() => setIsCartOpen(false)}>Checkout <ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    </SheetFooter>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <AuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} />
    </>
  );
}
