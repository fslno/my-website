'use client';

import React, { useState, useMemo, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  useUser,
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
  AlertCircle,
  Sparkles,
  Info,
  Star,
  Clock
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription
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
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { getLivePath } from '@/lib/deployment';
import { ReviewSystem } from '@/components/storefront/ReviewSystem';

interface PageProps {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Authoritative Product Details manifest.
 * Recalibrated for instant visual response and fixed 1:1 visuals.
 */
export default function ProductDetailPage(props: PageProps) {
  const resolvedParams = use(props.params);
  const { productId } = resolvedParams;
  
  const db = useFirestore();
  const { cart, addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const productRef = useMemoFirebase(() => 
    db ? doc(db, getLivePath(`products/${productId}`)) : null, 
    [db, productId]
  );
  
  const { data: product, isLoading: loading } = useDoc(productRef);

  const sizeChartsQuery = useMemoFirebase(() => {
    if (!db || !product?.categoryId) return null;
    return query(collection(db, getLivePath('sizeCharts')), where('category', '==', product.categoryId));
  }, [db, product?.categoryId]);

  const { data: categoryCharts } = useCollection(sizeChartsQuery);

  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !productId) return null;
    return query(collection(db, 'reviews'), where('productId', '==', productId), where('published', '==', true));
  }, [db, productId]);

  const { data: productReviews } = useCollection(reviewsQuery);

  const stats = useMemo(() => {
    if (!productReviews || productReviews.length === 0) return { avg: 5, count: 0 };
    const avg = productReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / productReviews.length;
    return { avg: Number(avg.toFixed(1)), count: productReviews.length };
  }, [productReviews]);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [wantsCustomization, setWantsCustomization] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Authoritative Field Reset Protocol: Purge inputs when personalization is disabled
  useEffect(() => {
    if (!wantsCustomization) {
      setCustomName('');
      setCustomNumber('');
      setSpecialRequest('');
    }
  }, [wantsCustomization]);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const selectedVariant = useMemo(() => {
    return product?.variants?.find((v: any) => v.size === selectedSize);
  }, [product, selectedSize]);

  const cartItemCount = useMemo(() => {
    if (!product || !selectedSize) return 0;
    return cart.filter(item => item.id === product.id && item.size === selectedSize)
               .reduce((acc, item) => acc + item.quantity, 0);
  }, [cart, product, selectedSize]);

  const isOutOfStock = selectedVariant && Number(selectedVariant.stock) <= 0;
  const hasReachedLimit = selectedVariant && cartItemCount >= Number(selectedVariant.stock);

  const buttonText = useMemo(() => {
    if (!selectedSize) return 'Select Size';
    if (isOutOfStock) return 'Out of Stock';
    if (hasReachedLimit) return 'Reached Limit';
    return 'Add to Cart';
  }, [selectedSize, isOutOfStock, hasReachedLimit]);

  const isButtonDisabled = !selectedSize || isOutOfStock || hasReachedLimit;

  const media = product?.media || [];
  const hasDiscount = product && (Number(product.comparedPrice) || 0) > (Number(product.price) || 0);
  const discountPercent = hasDiscount ? Math.round(((Number(product.comparedPrice) - Number(product.price)) / Number(product.comparedPrice)) * 100) : 0;

  const totalPrice = (() => {
    if (!product) return 0;
    const base = Number(product.price) || 0;
    const fee = wantsCustomization ? (Number(product.customizationFee) || 10) : 0;
    return base + fee;
  })();

  const handleAddToCart = () => {
    if (!product || !selectedSize || hasReachedLimit) return;

    // Data Integrity Gate: Ensure fields are populated if "Yes" is selected
    if (wantsCustomization && !customName && !customNumber && !specialRequest) {
      toast({
        variant: "destructive",
        title: "Information Required",
        description: "Please provide customization details or select 'No'."
      });
      return;
    }

    const uniqueVariantId = wantsCustomization 
      ? `${product.id}-${selectedSize}-${customName}-${customNumber}-${specialRequest.substring(0, 10)}`
      : `${product.id}-${selectedSize}`;

    const itemToAdd: any = {
      id: product.id,
      variantId: uniqueVariantId,
      name: product.name,
      price: totalPrice,
      quantity: 1,
      image: product.media?.[0]?.url || '',
      size: selectedSize,
      categoryId: product.categoryId,
      customizationEnabled: product.customizationEnabled,
      logistics: product.logistics || {}, 
    };

    if (wantsCustomization) {
      itemToAdd.customName = customName;
      itemToAdd.customNumber = customNumber;
      itemToAdd.specialNote = specialRequest;
    }

    addToCart(itemToAdd);
    toast({ title: "Added to Cart", description: `${product.name} is in your cart.` });
  };

  if (!mounted || loading || !product) {
    return <div className="fixed inset-0 bg-white z-[100]" />;
  }

  return (
    <main className="mobile-wrapper min-h-[100vh] bg-white pt-20 sm:pt-32 pb-32">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6 group w-fit">
          <ChevronLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" /> Home
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start mb-12">
          <div className="md:col-span-7 lg:col-span-8 space-y-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="hidden md:flex flex-col gap-3 w-20 shrink-0">
                {media.map((item: any, idx: number) => (
                  <button 
                    key={idx} 
                    type="button"
                    onClick={() => api?.scrollTo(idx)}
                    className={cn(
                      "relative aspect-square bg-white border rounded-sm overflow-hidden transition-all",
                      current === idx + 1 ? "border-black ring-1 ring-black scale-105" : "border-gray-100 opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image src={item.url} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>

              <div className="flex-1 relative">
                <Carousel setApi={setApi} className="w-full">
                  <CarouselContent>
                    {media.length > 0 ? (
                      media.map((item: any, idx: number) => (
                        <CarouselItem key={idx}>
                          <div className="relative aspect-square bg-white overflow-hidden border rounded-sm">
                            <Image 
                              src={item.url} 
                              alt={product.name} 
                              fill 
                              className="object-cover" 
                              priority={idx === 0}
                              loading="eager"
                            />
                          </div>
                        </CarouselItem>
                      ))
                    ) : (
                      <CarouselItem><div className="aspect-square bg-gray-100" /></CarouselItem>
                    )}
                  </CarouselContent>
                </Carousel>
              </div>
            </div>

            <div className="hidden md:block pt-8 border-t space-y-8">
              <div className="space-y-3">
                <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-muted-foreground">About the Item</h3>
                <div className="text-sm text-gray-600 leading-relaxed uppercase tracking-tight font-medium">
                  {product.description || ""}
                </div>
              </div>

              {product.features && product.features.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-muted-foreground flex items-center gap-2">
                    <Info className="h-3 w-3" /> Details
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.features.map((feature: string, idx: number) => (
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

          <div className="md:col-span-5 lg:col-span-4 space-y-6">
            <div className="space-y-4">
              <div className="min-h-[3.5rem] flex flex-col justify-end">
                <h1 className="text-2xl sm:text-3xl font-headline font-bold uppercase tracking-tight leading-tight">{product.name}</h1>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={cn(
                          "h-2.5 sm:h-2.5 w-2.5 sm:w-2.5 transition-all duration-500", 
                          s <= Math.round(stats.avg) ? "fill-yellow-400 text-yellow-400" : "text-yellow-400/20"
                        )} 
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest ml-1">({stats.count})</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-4 h-8">
                  <p className="text-lg font-bold">{`C$${totalPrice.toFixed(2)}`}</p>
                  {hasDiscount && (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground line-through">{`C$${product.comparedPrice?.toFixed(2)}`}</p>
                      <Badge className="bg-emerald-50 text-emerald-700 border-none text-[8px] font-bold">{discountPercent}% OFF</Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{product.brand || ''}</p>
                  {product.sku && (
                    <p className="text-[8px] font-mono font-bold text-muted-foreground uppercase tracking-widest">SKU: {product.sku}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {product.preorderEnabled && (
              <div className="bg-orange-50/50 border border-orange-100 p-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-2 text-orange-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Pre-order Manifest</span>
                </div>
                <p className="text-[11px] font-bold text-orange-800 uppercase tracking-tight italic">
                  {product.preorderEstimate || "2-3 Weeks after purchase."}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Size</span>
                {categoryCharts && categoryCharts.length > 0 && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <button type="button" className="flex items-center gap-2 text-[10px] font-bold uppercase hover:underline"><Ruler className="h-4 w-4" /> Size Chart</button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-xl bg-white p-0 flex flex-col border-none shadow-2xl h-full">
                      <SheetHeader className="p-8 border-b">
                        <SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight">Size Guide</SheetTitle>
                      </SheetHeader>
                      <ScrollArea className="flex-1 p-8">
                        {categoryCharts.map((chart: any) => (
                          <div key={chart.id} className="space-y-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest border-b pb-2">{chart.name}</h3>
                            <div className="border overflow-x-auto">
                              <Table>
                                <TableHeader className="bg-gray-50">
                                  <TableRow>
                                    <TableHead className="text-[9px] font-bold uppercase text-primary">Size</TableHead>
                                    {chart.columns.map((c: any, i: any) => (
                                      <TableHead key={i} className="text-[9px] font-bold uppercase text-center text-primary">{c}</TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {chart.rows.map((r: any, i: any) => (
                                    <TableRow key={i}>
                                      <TableCell className="text-[10px] font-bold uppercase">{r.label}</TableCell>
                                      {r.values.map((v: any, j: any) => (
                                        <TableCell key={j} className="text-center font-mono text-[10px]">{v || '-'}</TableCell>
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
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(product.variants || []).map((v: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSize(v.size)}
                    disabled={Number(v.stock) === 0}
                    className={cn(
                      "h-12 border text-[10px] font-bold uppercase tracking-widest transition-all",
                      selectedSize === v.size ? "bg-black text-white border-black" : "bg-white text-primary border-gray-100 hover:border-black",
                      Number(v.stock) === 0 && "opacity-20 cursor-not-allowed"
                    )}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
            </div>

            {product.customizationEnabled && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">Personalize your item?</Label>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">+C${(Number(product.customizationFee) || 10).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      type="button"
                      onClick={() => setWantsCustomization(false)} 
                      className={cn(
                        "flex-1 sm:flex-none h-14 px-8 border text-[10px] font-bold uppercase tracking-widest transition-colors", 
                        !wantsCustomization ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"
                      )}
                    >
                      No
                    </button>
                    <button 
                      type="button"
                      onClick={() => setWantsCustomization(true)} 
                      className={cn(
                        "flex-1 sm:flex-none h-14 px-8 border text-[10px] font-bold uppercase tracking-widest transition-colors", 
                        wantsCustomization ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"
                      )}
                    >
                      Yes
                    </button>
                  </div>
                </div>
                {wantsCustomization && (
                  <div className="grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-bold text-gray-400">Name</Label>
                        <Input 
                          value={customName} 
                          onChange={(e) => setCustomName(e.target.value.toUpperCase())} 
                          className="h-11 rounded-none bg-gray-50 border-none font-bold uppercase text-xs focus-visible:ring-1 focus-visible:ring-black" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] uppercase font-bold text-gray-400">Number</Label>
                        <Input 
                          value={customNumber} 
                          maxLength={2} 
                          onChange={(e) => setCustomNumber(e.target.value)} 
                          className="h-11 rounded-none bg-gray-50 border-none font-bold text-center focus-visible:ring-1 focus-visible:ring-black" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold text-gray-400">Special Notes</Label>
                      <Input 
                        value={specialRequest} 
                        onChange={(e) => setSpecialRequest(e.target.value.toUpperCase())} 
                        placeholder="ANY SPECIAL INSTRUCTIONS..."
                        className="h-11 rounded-none bg-gray-50 border-none font-medium text-[10px] focus-visible:ring-1 focus-visible:ring-black" 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 pt-6 border-t">
              <Button 
                onClick={handleAddToCart} 
                disabled={isButtonDisabled}
                className="w-full h-14 bg-black text-white font-bold uppercase tracking-[0.3em] text-[10px] rounded-none hover:bg-black/90 transition-none active:scale-100 shadow-xl"
              >
                {buttonText}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => toggleWishlist({ id: product.id, name: product.name, price: Number(product.price), image: product.media?.[0]?.url || '' })} 
                  className={cn("h-12 border-gray-100 rounded-none font-bold uppercase tracking-widest text-[9px] gap-2", isInWishlist(product.id) && "bg-red-50 border-red-100 text-red-600")}
                >
                  <Heart className={cn("h-4 w-4", isInWishlist(product.id) && "fill-current")} /> {isInWishlist(product.id) ? 'Saved' : 'Add to Wishlist'}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link Copied" }); }} 
                  className="h-12 border-gray-100 rounded-none font-bold uppercase tracking-widest text-[9px] gap-2"
                >
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
              
              <div className="pt-2 flex justify-start">
                <ReviewSystem productId={product.id} />
              </div>
            </div>

            <div className="md:hidden pt-8 border-t space-y-8">
              <div className="space-y-3">
                <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-muted-foreground">About the Item</h3>
                <div className="text-sm text-gray-600 leading-relaxed uppercase tracking-tight font-medium">
                  {product.description || ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TestimonialSection />
    </main>
  );
}
