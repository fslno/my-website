'use client';

import React, { useState, useMemo, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  useFirestore, 
  useDoc, 
  useMemoFirebase,
  useCollection
} from '@/firebase';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import { TestimonialSection } from '@/components/storefront/TestimonialSection';
import { ReviewSystem } from '@/components/storefront/ReviewSystem';
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
  Loader2,
  Star,
  AlertCircle,
  Sparkles,
  MessageSquare
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

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default function ProductDetailPage(props: PageProps) {
  const { productId } = use(props.params);
  
  const db = useFirestore();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();

  const productRef = useMemoFirebase(() => 
    db ? doc(db, getLivePath(`products/${productId}`)) : null, 
    [db, productId]
  );
  
  const { data: product, isLoading: loading } = useDoc(productRef);

  const reviewConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/reviews')) : null, [db]);
  const { data: reviewConfig } = useDoc(reviewConfigRef);

  const sizeChartsQuery = useMemoFirebase(() => {
    if (!db || !product?.categoryId) return null;
    return query(collection(db, getLivePath('sizeCharts')), where('category', '==', product.categoryId));
  }, [db, product?.categoryId]);

  const { data: categoryCharts } = useCollection(sizeChartsQuery);

  const reviewsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: allReviews } = useCollection(reviewsQuery);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [wantsCustomization, setWantsCustomization] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setActiveImageIndex(api.selectedScrollSnap());
    });
  }, [api]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen pt-32 px-4 text-center bg-white">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="h-8 w-8 text-gray-300" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-headline font-bold uppercase tracking-tight text-primary">Silhouette Missing</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-relaxed">
              The requested archival segment is no longer part of the current Studio manifest.
            </p>
          </div>
          <Button asChild className="bg-black text-white px-10 h-14 font-bold uppercase tracking-widest text-[10px] rounded-none shadow-xl">
            <Link href="/">Return to Studio</Link>
          </Button>
        </div>
      </main>
    );
  }

  const media = product.media || [];
  const reviewsEnabled = reviewConfig?.enabled !== false;
  
  const hasDiscount = (Number(product.comparedPrice) || 0) > (Number(product.price) || 0);
  const discountPercent = hasDiscount ? Math.round(((Number(product.comparedPrice) - Number(product.price)) / Number(product.comparedPrice)) * 100) : 0;

  const ratingStats = (() => {
    if (!allReviews || !productId) return { avg: 0, count: 0 };
    const pReviews = allReviews.filter(r => r.productId === productId && r.published === true);
    if (pReviews.length === 0) return { avg: 0, count: 0 };
    const sum = pReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return { avg: sum / pReviews.length, count: pReviews.length };
  })();

  const totalPrice = (() => {
    const base = Number(product.price) || 0;
    const fee = wantsCustomization ? (Number(product.customizationFee) || 10) : 0;
    return base + fee;
  })();

  const displayedSku = selectedSize 
    ? (product.variants?.find((v: any) => v.size === selectedSize)?.sku || product.sku) 
    : (product.sku || 'N/A');

  const handleThumbnailClick = (index: number) => {
    setActiveImageIndex(index);
    api?.scrollTo(index);
  };

  const isSaved = isInWishlist(productId);

  const handleAddToCart = () => {
    if (!product || !selectedSize) return;

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
      logistics: product.logistics || {}, 
    };

    if (wantsCustomization) {
      itemToAdd.customName = customName;
      itemToAdd.customNumber = customNumber;
      itemToAdd.specialNote = specialRequest;
    }

    addToCart(itemToAdd);

    toast({
      title: "Added to Cart",
      description: `${product.name} (${selectedSize}) is in your cart.`,
    });

    setWantsCustomization(false);
    setCustomName('');
    setCustomNumber('');
    setSpecialRequest('');
    setSelectedSize('');
  };

  const handleWishlist = () => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.media?.[0]?.url || '',
      brand: product.brand || 'FSLNO Studio'
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product.name, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link Copied" });
    }
  };

  return (
    <main className="max-w-[1280px] mx-auto px-4 pt-12 pb-32 bg-white">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all duration-300 mb-8 group w-fit"
      >
        <ChevronLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
        Back to Previous
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-24">
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {media.length > 1 && (
              <div className="hidden lg:flex lg:flex-col gap-2 overflow-y-auto scrollbar-hide lg:w-20 shrink-0">
                {media.map((item: any, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => handleThumbnailClick(idx)}
                    className={cn(
                      "w-full aspect-square shrink-0 relative border-2 transition-all duration-300 ease-in-out rounded-sm",
                      activeImageIndex === idx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image src={item.url} alt={`View ${idx}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex-1 overflow-hidden relative group/carousel">
              <Carousel setApi={setApi} className="w-full">
                <CarouselContent>
                  {media.length > 0 ? (
                    media.map((item: any, idx: number) => (
                      <CarouselItem key={idx}>
                        <div className="aspect-square relative bg-gray-100 overflow-hidden rounded-sm border">
                          <Image src={item.url} alt={product.name} fill className="object-cover" priority={idx === 0} />
                        </div>
                      </CarouselItem>
                    ))
                  ) : (
                    <CarouselItem>
                      <div className="aspect-square relative bg-gray-200 rounded-sm border" />
                    </CarouselItem>
                  )}
                </CarouselContent>
              </Carousel>
            </div>
          </div>

          <div className="hidden lg:block space-y-4 pt-6 border-t">
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Description</h3>
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed text-sm">
              {product.description || "No description provided."}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-headline font-bold tracking-tight text-primary uppercase">{product.name}</h1>
            {(reviewsEnabled && ratingStats.count > 0) && (
              <div className="flex items-center gap-2 mt-1 mb-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("h-3 w-3", s <= Math.round(ratingStats.avg) ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
                  ))}
                </div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">({ratingStats.count} Reviews)</span>
              </div>
            )}
            <div className="flex items-center gap-4 pt-2">
              <p className="text-lg font-bold text-primary">{`C$${totalPrice.toFixed(2)}`}</p>
              {hasDiscount && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground line-through decoration-muted-foreground/50 font-medium">{`C$${product.comparedPrice?.toFixed(2)}`}</p>
                  <Badge className="bg-emerald-50 text-emerald-700 border-none uppercase text-[8px] font-bold tracking-widest">{discountPercent}% OFF</Badge>
                </div>
              )}
            </div>
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground">{product.brand || 'FSLNO Studio'}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">REF: {displayedSku}</p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
              <span>Select Size</span>
              {categoryCharts && categoryCharts.length > 0 && (
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 text-[11px] font-bold">
                      <Ruler className="h-5 w-5" /> Size Chart
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-xl bg-white border-l p-0 flex flex-col">
                    <SheetHeader className="pt-12 px-8 pb-8 border-b shrink-0">
                      <div className="flex items-center gap-3 text-primary mb-2">
                        <Ruler className="h-6 w-6" />
                        <SheetTitle className="text-2xl font-headline font-bold uppercase tracking-tight">Size Chart</SheetTitle>
                      </div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                        Measurements in {categoryCharts[0].unit === 'cm' ? 'Centimeters' : 'Inches'}
                      </p>
                    </SheetHeader>
                    <ScrollArea className="flex-1">
                      <div className="p-8 space-y-12">
                        {categoryCharts.map((chart: any) => (
                          <div key={chart.id} className="space-y-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] border-b pb-2 text-primary">{chart.name}</h3>
                            <div className="border rounded-none overflow-hidden">
                              <Table>
                                <TableHeader className="bg-gray-50/50">
                                  <TableRow>
                                    <TableHead className="text-[9px] font-bold uppercase tracking-widest">Size</TableHead>
                                    {chart.columns.map((col: string, i: number) => (
                                      <TableHead key={i} className="text-[9px] font-bold uppercase tracking-widest text-center">{col}</TableHead>
                                    ))}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {chart.rows.map((row: any, i: number) => (
                                    <TableRow key={i}>
                                      <TableCell className="text-[10px] font-bold uppercase">{row.label}</TableCell>
                                      {row.values.map((val: string, j: number) => (
                                        <TableCell key={j} className="text-center font-mono text-[10px]">{val || '-'}</TableCell>
                                      ))}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(product.variants || []).map((v: any) => (
                <button
                  key={v.size}
                  onClick={() => setSelectedSize(v.size)}
                  disabled={Number(v.stock) === 0}
                  className={cn(
                    "h-10 min-w-[2.5rem] px-3 border text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm", 
                    selectedSize === v.size ? "bg-primary text-primary-foreground border-primary" : "bg-white text-primary border-gray-200 hover:bg-secondary",
                    Number(v.stock) === 0 && "opacity-30 cursor-not-allowed border-dashed"
                  )}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          {product.customizationEnabled && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">Personalize this piece?</Label>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Add name and number (+C${(Number(product.customizationFee) || 10).toFixed(2)})</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setWantsCustomization(false)}
                    className={cn(
                      "h-9 px-4 border text-[9px] font-bold uppercase tracking-widest transition-all",
                      !wantsCustomization ? "bg-black text-white border-black" : "bg-white text-primary border-gray-200"
                    )}
                  >No</button>
                  <button 
                    onClick={() => setWantsCustomization(true)}
                    className={cn(
                      "h-9 px-4 border text-[9px] font-bold uppercase tracking-widest transition-all",
                      wantsCustomization ? "bg-black text-white border-black" : "bg-white text-primary border-gray-200"
                    )}
                  >Yes</button>
                </div>
              </div>

              {wantsCustomization && (
                <div className="grid grid-cols-1 gap-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold text-gray-500">Name</Label>
                      <Input value={customName} onChange={(e) => setCustomName(e.target.value.toUpperCase())} placeholder="NAME" className="h-11 text-xs font-bold uppercase rounded-none bg-gray-50 border-gray-200 focus-visible:ring-black" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] uppercase font-bold text-gray-500">Number</Label>
                      <Input value={customNumber} onChange={(e) => setCustomNumber(e.target.value)} placeholder="00" maxLength={2} className="h-11 text-xs font-bold uppercase rounded-none bg-gray-50 border-gray-200 focus-visible:ring-black" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-bold text-gray-500">Special Request</Label>
                    <Input value={specialRequest} onChange={(e) => setSpecialRequest(e.target.value.toUpperCase())} placeholder="ADDITIONAL NOTES..." className="h-11 text-[10px] font-medium uppercase rounded-none bg-gray-50 border-gray-200 focus-visible:ring-black" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 pt-4 border-t mt-4">
            <button 
              onClick={handleAddToCart}
              disabled={!selectedSize}
              className={cn(
                "w-full h-12 font-bold uppercase tracking-[0.2em] text-[10px] rounded-none transition-all shadow-md", 
                !selectedSize ? "bg-gray-200 text-muted-foreground" : "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              {!selectedSize ? 'Select Size' : 'Add to Cart'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleWishlist} variant="outline" className={cn("h-10 font-bold uppercase tracking-widest text-[9px] gap-2 border-gray-200 rounded-none", isSaved && "bg-red-50 border-red-200 text-destructive")}>
                <Heart className={cn("h-3.5 w-3.5", isSaved && "fill-current")} /> 
                {isSaved ? 'Saved' : 'Wishlist'}
              </Button>
              <Button onClick={handleShare} variant="outline" className="h-10 font-bold uppercase tracking-widest text-[9px] gap-2 border-gray-200 rounded-none">
                <Share2 className="h-3.5 w-3.5" /> Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ReviewSystem productId={productId} />
      <TestimonialSection />

      {/* STICKY ADD TO CART BAR - ARCHIVAL PROTOCOL */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-t p-4 lg:hidden animate-in slide-in-from-bottom duration-500">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase truncate">{product.name}</p>
            <p className="text-xs font-bold">{`C$${totalPrice.toFixed(2)}`}</p>
          </div>
          <Button 
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className="bg-black text-white h-12 px-8 font-bold uppercase tracking-widest text-[10px] rounded-none"
          >
            {selectedSize ? 'Add to Cart' : 'Select Size'}
          </Button>
        </div>
      </div>
    </main>
  );
}
