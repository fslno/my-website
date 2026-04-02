'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  useFirestore, 
  useDoc, 
  useMemoFirebase,
  useCollection
} from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { TestimonialSection } from '@/components/storefront/TestimonialSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Share2, 
  Ruler, 
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Info,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Shirt
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import {
  Carousel as EmblaCarousel,
  CarouselContent as EmblaCarouselContent,
  CarouselItem as EmblaCarouselItem,
} from "@/components/ui/carousel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useCart, parseFirestoreDate } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { getLivePath } from '@/lib/paths';
import { usePathname } from 'next/navigation';
import { ReviewSystem } from '@/components/storefront/ReviewSystem';
import { ProductImageLightbox } from './ProductImageLightbox';
import { CountdownTimer } from '@/components/shared/CountdownTimer';
import { ProductGrid } from '@/components/storefront/ProductGrid';

interface ProductDetailProps {
  productId: string;
  initialProduct: any;
}

export function ProductDetail({ productId, initialProduct }: ProductDetailProps) {
  const router = useRouter();
  const db = useFirestore();
  const { cart, addToCart, promoConfig } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const productRef = useMemoFirebase(() => 
    db ? doc(db, getLivePath(`products/${productId}`)) : null, 
    [db, productId]
  );
  
  const { data: product, isLoading: loading } = useDoc(productRef);
  const activeProduct = product || initialProduct;

  // Authorities document title synchronization
  useEffect(() => {
    if (activeProduct?.name) {
      const originalTitle = document.title;
      // Format: PRODUCT NAME | BRAND (or specific title template)
      document.title = `${activeProduct.name.toUpperCase()} | FSLNO`;
      
      return () => {
        document.title = originalTitle;
      };
    }
  }, [activeProduct?.name]);

  const themeRef = useMemoFirebase(() => 
    db ? doc(db, getLivePath('config/theme')) : null, 
    [db]
  );
  const { data: theme } = useDoc(themeRef);

  const storeConfigRef = useMemoFirebase(() => 
    db ? doc(db, getLivePath('config/store')) : null, 
    [db]
  );
  const { data: storeConfig } = useDoc(storeConfigRef);

  const showBrand = storeConfig?.showBrandStorefront !== false;
  const showSku = storeConfig?.showSkuStorefront !== false;

  
  const sizeChartsQuery = useMemoFirebase(() => {
    if (!db || !activeProduct?.categoryId) return null;
    return query(collection(db, getLivePath('sizeCharts')), where('category', '==', activeProduct.categoryId));
  }, [db, activeProduct?.categoryId]);

  const { data: categoryCharts } = useCollection(sizeChartsQuery);

  const [hasMounted, setHasMounted] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [wantsCustomization, setWantsCustomization] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [primaryImageLoaded, setPrimaryImageLoaded] = useState(false);
  const pathname = usePathname();

  const media = activeProduct?.media || [];

  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const totalStock = useMemo(() => {
    const variants = activeProduct?.variants || [];
    if (variants.length > 0) {
      return variants.reduce((acc: number, v: any) => acc + (Number(v.stock) || 0), 0);
    }
    return Number(activeProduct?.inventory) || 0;
  }, [activeProduct]);

  const selectedVariant = useMemo(() => {
    return activeProduct?.variants?.find((v: any) => v.size === selectedSize);
  }, [activeProduct, selectedSize]);

  const cartItemCount = useMemo(() => {
    if (!activeProduct) return 0;
    const variants = activeProduct.variants || [];
    if (variants.length > 0 && !selectedSize) return 0;
    return cart.filter(item => 
      item.id === activeProduct.id && 
      (variants.length > 0 ? item.size === selectedSize : true)
    ).reduce((acc, item) => acc + item.quantity, 0);
  }, [cart, activeProduct, selectedSize]);

  const isOutOfStock = useMemo(() => {
    // If pre-order is enabled, the product is never considered "out of stock" for purchase purposes
    if (activeProduct?.preorderEnabled) return false;
    
    const variants = activeProduct?.variants || [];
    if (variants.length > 0) {
      return selectedVariant && Number(selectedVariant.stock) <= 0;
    }
    return totalStock <= 0;
  }, [activeProduct, selectedVariant, totalStock, activeProduct?.preorderEnabled]);

  const hasReachedLimit = useMemo(() => {
    const variants = activeProduct?.variants || [];
    if (variants.length > 0) {
      return selectedVariant && cartItemCount >= Number(selectedVariant.stock);
    }
    return cartItemCount >= totalStock;
  }, [activeProduct, selectedVariant, cartItemCount, totalStock]);



  const buttonText = useMemo(() => {
    const variants = activeProduct?.variants || [];
    if (variants.length > 0 && !selectedSize) return 'Select Size';
    if (isOutOfStock) return 'Out of Stock';
    if (hasReachedLimit) return 'Reached Limit';
    if (activeProduct?.preorderEnabled) return 'Pre-order Now';
    return 'Add to Cart';
  }, [activeProduct, selectedSize, isOutOfStock, hasReachedLimit]);

  const isButtonDisabled = (activeProduct?.variants?.length > 0 && !selectedSize) || isOutOfStock || hasReachedLimit;

  const isFlashActive = useMemo(() => {
    if (!promoConfig?.flashEnabled) return false;
    if (!promoConfig.flashCountdownEnabled) return true;
    const end = parseFirestoreDate(promoConfig.flashEndTime);
    return end ? new Date() < end : false;
  }, [promoConfig]);

  const basePrice = Number(activeProduct?.price) || 0;
  const flashDecrease = isFlashActive ? (basePrice * (promoConfig.flashValue || 0)) / 100 : 0;
  const discountedBasePrice = isFlashActive ? basePrice - flashDecrease : basePrice;
  
  const hasDiscount = (Number(activeProduct?.comparedPrice) || 0) > (Number(activeProduct?.price) || 0) || isFlashActive;
  const displayComparedPrice = (Number(activeProduct?.comparedPrice) || 0) || (isFlashActive ? basePrice : 0);
  const discountPercent = isFlashActive ? promoConfig.flashValue : (hasDiscount ? Math.round(((Number(activeProduct?.comparedPrice) - basePrice) / Number(activeProduct?.comparedPrice)) * 100) : 0);
  
  const totalPrice = (() => {
    if (!activeProduct) return 0;
    const base = discountedBasePrice;
    const fee = wantsCustomization ? (Number(activeProduct.customizationFee) || 10) : 0;
    return base + fee;
  })();

  const handleAddToCart = () => {
    if (!activeProduct || !selectedSize || hasReachedLimit) return;

    const uniqueVariantId = wantsCustomization 
      ? `${activeProduct.id}-${selectedSize}-${customName}-${customNumber}-${specialRequest.substring(0, 10)}`
      : `${activeProduct.id}-${selectedSize}`;

    const itemToAdd: any = {
      id: activeProduct.id,
      variantId: uniqueVariantId,
      name: activeProduct.name,
      price: totalPrice,
      quantity: 1,
      image: activeProduct.media?.[0]?.url || '',
      size: selectedSize,
      categoryId: activeProduct.categoryId,
      customizationEnabled: activeProduct.customizationEnabled,
      logistics: activeProduct.logistics || {}, 
    };

    if (wantsCustomization) {
      itemToAdd.customName = customName;
      itemToAdd.customNumber = customNumber;
      itemToAdd.specialNote = specialRequest;
    }

    addToCart(itemToAdd);
    toast({ title: "Added to Cart", description: `${activeProduct.name} is in your cart.` });
  };

  if (!hasMounted || (loading && !initialProduct)) {
    return (
      <div className="min-h-[100vh] flex flex-col bg-white">
        <div className="flex-grow mobile-wrapper pt-20 sm:pt-32 pb-32">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
            <Skeleton className="h-6 w-24 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="md:col-span-6 lg:col-span-6 space-y-8">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="hidden md:flex flex-col gap-3 w-20 shrink-0">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square w-full rounded-sm" />
                    ))}
                  </div>
                  <div className="flex-1 relative">
                    <Skeleton className="w-full aspect-square rounded-sm" />
                  </div>
                </div>
              </div>
              <div className="md:col-span-5 lg:col-span-4 space-y-8">
                <div className="space-y-4">
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-6 w-1/3" />
                </div>
                <div className="space-y-4 pt-4">
                  <Skeleton className="h-4 w-1/4" />
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-none" />
                    ))}
                  </div>
                </div>
                <div className="space-y-4 pt-6">
                  <Skeleton className="h-14 w-full rounded-none" />
                  <Skeleton className="h-12 w-full rounded-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeProduct) {
    return (
      <main className="min-h-screen pt-32 px-4 text-center bg-white flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-gray-200 mb-4" />
        <h1 className="text-xl font-bold uppercase">Product Not Found</h1>
        <Button asChild variant="link" className="mt-4"><Link href="/">Back to Shop</Link></Button>
      </main>
    );
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  return (
    <article className="mobile-wrapper bg-white pb-16 pt-12 sm:pt-24" id={`product-article-${productId}`}>
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
        {/* Back Button & Global Rank */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              router.back();
            }}
            className="h-9 px-0 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-transparent rounded-none gap-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        </div>

        {/* Main Grid: items-start ensures top alignment of columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24 items-start">
          
          {/* Left Column - Media & Description */}
          <div className="md:col-span-6 lg:col-span-7 space-y-8">
            <div className="flex flex-col md:flex-row gap-6 w-full">
              <div className="hidden md:flex flex-col gap-3 w-20 shrink-0">
                {media.map((item: any, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => api?.scrollTo(idx)}
                    className={cn(
                      "relative aspect-square bg-white border rounded-sm overflow-hidden transition-all",
                      current === idx + 1 ? "border-black ring-1 ring-black scale-105" : "border-gray-100 opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image src={item.url} alt="" fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>

              <div className="flex-1 relative w-full">
                <Carousel setApi={setApi} className="w-full">
                  <CarouselContent>
                    {media.length > 0 ? (
                      media.map((item: any, idx: number) => (
                        <CarouselItem key={idx}>
                          <div 
                            className="relative aspect-square bg-white overflow-hidden border rounded-sm cursor-zoom-in"
                            onClick={() => openLightbox(idx)}
                          >
                            <Image 
                              src={item.url} 
                              alt={`${activeProduct.name} - View ${idx + 1}`} 
                              fill 
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px" 
                              className="object-cover transition-opacity duration-300"
                              priority={idx === 0}
                            />
                          </div>
                        </CarouselItem>
                      ))
                    ) : (
                      <CarouselItem><div className="aspect-square bg-gray-100" /></CarouselItem>
                    )}
                  </CarouselContent>
                </Carousel>

                {media.length > 1 && (
                  <div className="flex justify-center gap-3 mt-6 mb-2 md:hidden">
                    {media.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => api?.scrollTo(idx)}
                        className={cn(
                          "w-2 h-2 min-h-0 rounded-full transition-all duration-300",
                          current === idx + 1 ? "bg-[#8a8a8a]" : "bg-[#d1d1d1]"
                        )}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Description */}
            <div className="hidden md:block pt-4 border-t border-gray-100 space-y-6">
              <div className="space-y-3">
                <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-muted-foreground">Product Details</h3>
                <div className="text-sm text-gray-600 leading-relaxed uppercase tracking-tight font-medium">
                  {activeProduct.description ? (
                    <div dangerouslySetInnerHTML={{ __html: activeProduct.description }} className="prose prose-sm max-w-none prose-p:leading-relaxed" />
                  ) : (
                    "Precision engineered sports apparel designed for elite performance. Every stitch is optimized for durability and movement."
                  )}
                </div>
              </div>

              {activeProduct.features && activeProduct.features.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-muted-foreground flex items-center gap-2">
                    <Info className="h-3 w-3" /> Features & Specifications
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeProduct.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        <div className="w-1 h-1 rounded-full bg-black shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Purchase Info */}
          <div className="md:col-span-6 lg:col-span-5 space-y-4 md:sticky md:top-24 self-start animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex flex-col gap-1 relative">
              <h1 className="font-headline font-bold uppercase tracking-tight leading-tight detail-title-style">{activeProduct.name}</h1>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-4">
                  <p className={cn("font-bold tracking-tighter detail-price-style", isFlashActive ? "text-orange-600" : "")}>
                    {`C$${totalPrice.toFixed(2)}`}
                  </p>
                  {hasDiscount && (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground line-through tracking-tighter">{`C$${displayComparedPrice.toFixed(2)}`}</p>
                      <Badge className={cn("border-none text-[8px] font-bold shadow-none rounded-none", isFlashActive ? "bg-black text-white" : "bg-red-50 text-red-600")}>
                        -{isFlashActive ? promoConfig.flashValue : discountPercent}%
                      </Badge>
                    </div>
                  )}
                </div>

                {activeProduct.preorderEnabled && (
                  <div className="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-left-2 duration-500">
                    <Badge className="bg-orange-600 text-white border-none rounded-none text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 shadow-lg shadow-orange-100 italic">
                      PRE-ORDER
                    </Badge>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">
                      {activeProduct.preorderEstimate || 'EST. 2-4 WEEKS'}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-1 py-0.5">
                  <div className="flex items-center gap-4">
                    {showBrand && activeProduct.brand && (
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-[11px] text-gray-400 uppercase tracking-widest leading-none">BRAND:</span>
                        <span className="uppercase leading-none detail-brand-style">{activeProduct.brand}</span>
                      </div>
                    )}
                    {showBrand && activeProduct.brand && showSku && <div className="h-3 w-[1px] bg-gray-200" />}
                    {showSku && (
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-[11px] text-gray-400 uppercase tracking-widest leading-none">SKU:</span>
                        <span className="uppercase leading-none detail-sku-style">
                          {selectedVariant?.sku || activeProduct.sku || (activeProduct.id.slice(0, 8) + (selectedSize ? `-${selectedSize}` : '')).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>



                  <div className="pt-1">
                    <ReviewSystem productId={activeProduct.id} variant="minimal" />
                  </div>
                </div>
              </div>
            </div>

            {/* Size Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Select Size</span>
                {categoryCharts && categoryCharts.length > 0 && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <button className="flex items-center gap-2 text-[11px] font-bold uppercase hover:underline opacity-60 hover:opacity-100 transition-opacity">
                        <Ruler className="h-4 w-4" /> Size Guide
                      </button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-xl bg-white p-0 flex flex-col border-none shadow-2xl h-full">
                      <SheetHeader className="px-5 pt-20 pb-8 border-b">
                        <SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight">Sizing Guide</SheetTitle>
                      </SheetHeader>
                      <ScrollArea className="flex-1 px-4 py-6">
                        {categoryCharts.map((chart: any) => (
                          <div key={chart.id} className="space-y-6 mb-12 last:mb-0">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest border-b pb-2 text-primary/60">{chart.name} Measurements</h3>
                            <div className="border border-gray-100 overflow-x-auto">
                              <Table>
                                <TableHeader className="bg-gray-50/50">
                                  <TableRow>
                                    <TableHead className="text-[8px] sm:text-[9px] font-bold uppercase text-primary px-2 h-10">Size</TableHead>
                                    {chart.columns.map((c: any, i: any) => (
                                      <TableHead key={i} className="text-[8px] sm:text-[9px] font-bold uppercase text-center text-primary px-1 h-10 leading-tight">
                                        {c}
                                      </TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {chart.rows.map((r: any, i: any) => (
                                    <TableRow key={i} className="hover:bg-gray-50/50 transition-colors">
                                      <TableCell className="text-[9px] sm:text-[10px] font-bold uppercase px-2 py-3">{r.label}</TableCell>
                                      {r.values.map((v: any, j: any) => (
                                        <TableCell key={j} className="text-center font-mono text-[9px] sm:text-[10px] px-1 py-3 whitespace-nowrap">{v || '-'}</TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                )}

                {categoryCharts && categoryCharts.some((chart: any) => chart.washingInstructions) && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <button className="flex items-center gap-2 text-[11px] font-bold uppercase hover:underline opacity-60 hover:opacity-100 transition-opacity">
                        <Shirt className="h-4 w-4" /> Washing Guide
                      </button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-xl bg-white p-0 flex flex-col border-none shadow-2xl h-full">
                      <SheetHeader className="px-5 pt-20 pb-8 border-b">
                        <SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight">Care Instructions</SheetTitle>
                      </SheetHeader>
                      <ScrollArea className="flex-1 px-4 py-8">
                        <div className="space-y-12">
                          {categoryCharts.filter((chart: any) => chart.washingInstructions).map((chart: any) => (
                            <div key={chart.id} className="space-y-4">
                              <h3 className="text-[10px] font-bold uppercase tracking-widest border-b pb-2 text-primary/60">{chart.name} Care</h3>
                              <div className="text-sm text-gray-600 leading-relaxed uppercase font-medium whitespace-pre-wrap">
                                {chart.washingInstructions}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-12 p-6 bg-gray-50 border border-dashed border-gray-200">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center">
                            Following these instructions ensures the longevity and performance of your elite gear.
                          </p>
                        </div>
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                )}
              </div>
              
              {activeProduct.variants && activeProduct.variants.length > 0 && (
                <div className="grid grid-cols-4 gap-2 w-1/2">
                  {(activeProduct.variants || []).map((v: any, idx: number) => {
                    const stockNum = Number(v.stock) || 0;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(v.size)}
                        disabled={stockNum === 0 && !activeProduct.preorderEnabled}
                        className={cn(
                          "relative h-9 border-2 text-[11px] font-bold uppercase tracking-widest transition-all",
                          selectedSize === v.size ? "bg-black text-white border-black shadow-lg scale-[1.02]" : "bg-white text-primary border-gray-200 hover:border-black",
                          (stockNum === 0 && !activeProduct.preorderEnabled) && "opacity-40 grayscale-[0.5] cursor-not-allowed"
                        )}
                      >
                        {v.size}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {isFlashActive && (
              <div className="p-4 bg-black text-white rounded-none border border-white/10 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-400 fill-orange-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{promoConfig.flashLabel || 'FLASH SALE'} ACTIVE</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-bold uppercase border-orange-400/50 text-orange-400">-{promoConfig.flashValue}% OFF</Badge>
                </div>
                
                {promoConfig.flashCountdownEnabled && promoConfig.flashEndTime && (
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-2">OFFER ENDS IN:</p>
                    <CountdownTimer 
                      endTime={promoConfig.flashEndTime} 
                      className="text-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Customization Section */}
            {activeProduct.customizationEnabled && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-[13px] uppercase font-bold text-primary tracking-widest">Add personal name?</Label>
                    <p className="text-[11px] text-muted-foreground uppercase font-bold">+C${(Number(activeProduct.customizationFee) || 10).toFixed(2)}</p>
                  </div>
                  <div className="flex bg-gray-50/50 p-1 rounded-none border-2 border-gray-200 transition-all duration-300">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setWantsCustomization(false)}
                      className={cn(
                        "h-8 px-6 text-[11px] font-bold uppercase tracking-widest rounded-none transition-all",
                        !wantsCustomization ? "bg-white text-black shadow-sm" : "bg-transparent text-gray-400 hover:text-black"
                      )}
                    >
                      No
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setWantsCustomization(true)}
                      className={cn(
                        "h-8 px-6 text-[11px] font-bold uppercase tracking-widest rounded-none transition-all",
                        wantsCustomization ? "bg-white text-black shadow-sm" : "bg-transparent text-gray-400 hover:text-black"
                      )}
                    >
                      Yes
                    </Button>
                  </div>
                </div>
                {wantsCustomization && (
                  <div className="grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[11px] uppercase font-bold text-gray-400">Name</Label>
                        <Input value={customName} onChange={(e) => setCustomName(e.target.value.toUpperCase())} className="h-11 rounded-none bg-gray-50 border-none font-bold uppercase text-xs" placeholder="DOE" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-bold text-gray-400">Number</Label>
                        <Input value={customNumber} maxLength={2} onChange={(e) => setCustomNumber(e.target.value)} className="h-11 rounded-none bg-gray-50 border-none font-bold text-center text-xs" placeholder="00" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 pt-6 border-t border-gray-100">
              <Button 
                onClick={handleAddToCart} 
                disabled={isButtonDisabled}
                className="w-full h-14 bg-black text-white border border-black font-bold uppercase tracking-[0.3em] text-[10px] rounded-none hover:bg-gray-900 transition-all shadow-xl disabled:opacity-50 disabled:grayscale transition-all duration-500"
              >
                {buttonText}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => toggleWishlist({ id: activeProduct.id, name: activeProduct.name, price: Number(activeProduct.price), image: activeProduct.media?.[0]?.url || '' })} className={cn("h-12 border-gray-100 rounded-none font-bold uppercase tracking-widest text-[10px] gap-2", isInWishlist(activeProduct.id) && "bg-red-50 border-red-100 text-red-600")}>
                  <Heart className={cn("h-4 w-4", isInWishlist(activeProduct.id) && "fill-current")} /> {isInWishlist(activeProduct.id) ? 'Saved' : 'Add to Wishlist'}
                </Button>
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : ''); toast({ title: "Link Copied" }); }} className="h-12 border-gray-100 rounded-none font-bold uppercase tracking-widest text-[10px] gap-2">
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>

              <div className="pt-8 space-y-4">
                <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-8">
                  <div className="flex flex-col items-center text-center gap-2">
                    <Truck className="h-4 w-4 text-neutral-400" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-500">Fast Local Delivery</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-neutral-400" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-500">Secure Payment</span>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <RotateCcw className="h-4 w-4 text-neutral-400" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-500">7-Day Policy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section - Outside the first max-w but inside root */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-12 pb-8 border-t border-gray-100 mt-8">
        <div className="space-y-8">
          <div className="flex flex-col items-center text-center space-y-2">
            <h2 className="text-xl font-headline font-bold uppercase tracking-[0.2em] text-primary">You May Also Like</h2>
            <div className="h-0.5 w-12 bg-black" />
          </div>
          <ProductGrid 
            categoryId={activeProduct.categoryId} 
            excludeId={activeProduct.id} 
            limit={4} 
            itemsPerPage={4}
          />
        </div>
      </div>

      <div className="pt-8 border-t border-gray-100">
        <TestimonialSection />
      </div>

      <ProductImageLightbox 
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={media}
        initialIndex={lightboxIndex}
      />
    </article>
  );
}
