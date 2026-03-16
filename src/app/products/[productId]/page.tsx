
'use client';

import React, { useState, useMemo, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  useMemoFirebase,
  useCollection
} from '@/firebase';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
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
  Check,
  ChevronLeft,
  Loader2,
  Sparkles,
  Star,
  AlertCircle
} from 'lucide-react';
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { getLivePath } from '@/lib/deployment';

interface PageProps {
  params: Promise<{ productId: string }>;
}

const DEFAULT_SIZE_CHART = {
  name: "Standard Sizing Guide",
  unit: "cm",
  columns: ["Chest", "Length", "Shoulder"],
  rows: [
    { label: "S", values: ["50", "70", "44"] },
    { label: "M", values: ["52", "72", "46"] },
    { label: "L", values: ["54", "74", "48"] },
    { label: "XL", values: ["56", "76", "50"] },
    { label: "2XL", values: ["58", "78", "52"] }
  ]
};

export default function ProductDetailPage(props: PageProps) {
  const { productId } = use(props.params);
  
  const db = useFirestore();
  const router = useRouter();
  const { cart, addToCart } = useCart();
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

  const { data: categoryCharts, isLoading: chartsLoading } = useCollection(sizeChartsQuery);

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

  const isSaved = isInWishlist(productId);

  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setActiveImageIndex(api.selectedScrollSnap());
    });
  }, [api]);

  const handleThumbnailClick = (index: number) => {
    setActiveImageIndex(index);
    api?.scrollTo(index);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </main>
    );
  }

  // --- AUTHORITATIVE DATA GATE ---
  // Strictly do not access product properties until existence is verified.
  if (!product) {
    return (
      <main className="min-h-screen pt-32 px-4 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="h-8 w-8 text-gray-300" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-headline font-bold uppercase tracking-tight">Silhouette Missing</h1>
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

  // Safe Property Access Post-Gate
  const media = product.media || [];
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

  const selectedVariant = product.variants?.find((v: any) => v.size === selectedSize);
  const hasAnyStock = product.variants?.some((v: any) => (Number(v.stock) || 0) > 0);
  const reviewsEnabled = reviewConfig?.enabled !== false;
  const sizeChart = categoryCharts && categoryCharts.length > 0 ? categoryCharts[0] : null;
  const effectiveChart = sizeChart || DEFAULT_SIZE_CHART;
  const hasDiscount = product.comparedPrice && product.comparedPrice > (product.price || 0);
  const discountPercent = hasDiscount ? Math.round(((product.comparedPrice! - product.price!) / product.comparedPrice!) * 100) : 0;

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
      if (customName) itemToAdd.customName = customName;
      if (customNumber) itemToAdd.customNumber = customNumber;
      if (specialRequest) itemToAdd.specialNote = specialRequest;
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
    const shareData = {
      title: `FSLNO Studio | ${product.name}`,
      text: product.description || `Check out this ${product.name} from FSLNO Studio.`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Product link copied to clipboard.",
      });
    }
  };

  return (
    <main className="max-w-[1280px] mx-auto px-4 pt-12 pb-24">
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
                          <Image 
                            src={item.url} 
                            alt={product.name} 
                            fill 
                            className="object-cover"
                            priority={idx === 0}
                          />
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
              {media.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 lg:hidden z-10">
                  {media.map((_: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-500",
                        activeImageIndex === idx ? "bg-black w-4" : "bg-black/20"
                      )}
                    />
                  ))}
                </div>
              )}
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
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all duration-300 text-[11px] font-bold">
                    <Ruler className="h-5 w-5" /> Size Guide
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-2xl bg-white border-l p-0 flex flex-col">
                  <SheetHeader className="pt-12 px-8 pb-8 border-b shrink-0">
                    <div className="flex items-center gap-3 text-primary mb-2">
                      <Ruler className="h-5 w-5" />
                      <SheetTitle className="text-2xl font-headline font-bold tracking-tight uppercase">Size Guide</SheetTitle>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Measurements for: <span className="text-primary font-bold">{effectiveChart.name}</span></p>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto p-8">
                    <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                      <Table>
                        <TableHeader className="bg-gray-50/50">
                          <TableRow>
                            <TableHead className="w-[100px] text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-6 py-4">Size</TableHead>
                            {effectiveChart.columns?.map((col: string, idx: number) => (
                              <TableHead key={idx} className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-4">{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {effectiveChart.rows?.map((row: any, rowIdx: number) => (
                            <TableRow key={rowIdx} className="hover:bg-gray-50/30 transition-colors">
                              <TableCell className="font-bold text-xs px-6 py-4 border-r bg-gray-50/10 text-primary">{row.label}</TableCell>
                              {row.values?.map((val: string, colIdx: number) => (
                                <TableCell key={colIdx} className="text-center text-sm font-medium text-muted-foreground py-4">{val || '--'}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="flex flex-wrap gap-2">
              {(product.variants || []).map((v: any) => (
                <button
                  key={v.size}
                  onClick={() => setSelectedSize(v.size)}
                  disabled={Number(v.stock) === 0}
                  className={cn("h-10 min-w-[2.5rem] px-3 border text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm", selectedSize === v.size ? "bg-primary text-primary-foreground border-primary" : "bg-white text-primary border-gray-200 hover:bg-secondary", Number(v.stock) === 0 && "opacity-30 cursor-not-allowed border-dashed")}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t mt-4">
            <button 
              onClick={handleAddToCart}
              disabled={!selectedSize}
              className={cn("w-full h-12 font-bold uppercase tracking-[0.2em] text-[10px] rounded-none transition-all shadow-md", !selectedSize ? "bg-gray-200 text-muted-foreground" : "bg-primary text-primary-foreground hover:opacity-90")}
            >
              {!selectedSize ? 'Select Size' : 'Add to Cart'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleWishlist} variant="outline" className={cn("h-10 font-bold uppercase tracking-widest text-[9px] gap-2 border-gray-200 rounded-none", isSaved && "bg-red-50 border-red-200 text-destructive")}><Heart className={cn("h-3.5 w-3.5", isSaved && "fill-current")} /> {isSaved ? 'Saved' : 'Wishlist'}</Button>
              <Button onClick={handleShare} variant="outline" className="h-10 font-bold uppercase tracking-widest text-[9px] gap-2 border-gray-200 rounded-none"><Share2 className="h-3.5 w-3.5" /> Share</Button>
            </div>
          </div>
        </div>
      </div>

      <TestimonialSection />
    </main>
  );
}
