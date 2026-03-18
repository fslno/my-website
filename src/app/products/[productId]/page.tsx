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
  Info
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
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/hooks/use-toast';
import { getLivePath } from '@/lib/deployment';

interface PageProps {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Authoritative Product Detail Page.
 * Implements High-Fidelity Skeletons for faster archival transactions.
 */
export default function ProductDetailPage(props: PageProps) {
  const resolvedParams = React.use(props.params);
  const { productId } = resolvedParams;
  
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

  const sizeChartsQuery = useMemoFirebase(() => {
    if (!db || !product?.categoryId) return null;
    return query(collection(db, getLivePath('sizeCharts')), where('category', '==', product.categoryId));
  }, [db, product?.categoryId]);

  const { data: categoryCharts } = useCollection(sizeChartsQuery);

  const allReviewsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: allReviews } = useCollection(allReviewsQuery);

  const productReviews = useMemo(() => {
    if (!allReviews || !productId) return [];
    return allReviews.filter(r => r.productId === productId && r.published === true);
  }, [allReviews, productId]);

  const averageRating = useMemo(() => {
    if (productReviews.length === 0) return 0;
    return productReviews.reduce((acc, r) => acc + (r.rating || 0), 0) / productReviews.length;
  }, [productReviews]);

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
      customizationEnabled: product.customizationEnabled,
      logistics: product.logistics || {}, 
    };

    if (wantsCustomization) {
      itemToAdd.customName = customName;
      itemToAdd.customNumber = customNumber;
      itemToAdd.specialNote = specialRequest;
    }

    addToCart(itemToAdd);
    toast({ title: "Added to Cart", description: `${product.name} is in your bag.` });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white pt-20 sm:pt-32 pb-32">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 space-y-12">
          <Skeleton className="h-4 w-20" />
          <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-12">
            <Skeleton className="aspect-square w-full rounded-sm" />
            <div className="space-y-8 py-6 lg:py-0">
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/4" />
              </div>
              <Skeleton className="h-24 w-full" />
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen pt-32 px-4 text-center bg-white flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-gray-200 mb-4" />
        <h1 className="text-xl font-bold uppercase">Silhouette Missing</h1>
        <Button asChild variant="link" className="mt-4"><Link href="/">Return to Studio</Link></Button>
      </main>
    );
  }

  return (
    <main className="mobile-wrapper min-h-screen bg-white pt-20 sm:pt-32 pb-32">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6 group w-fit">
          <ChevronLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-12 items-start mb-12">
          
          {/* MEDIA SECTION */}
          <div className="w-full relative lg:sticky lg:top-32">
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {media.length > 0 ? (
                  media.map((item: any, idx: number) => (
                    <CarouselItem key={idx}>
                      <div className="relative aspect-square bg-gray-50 overflow-hidden border rounded-sm">
                        <Image src={item.url} alt={product.name} fill className="object-cover" priority={idx === 0} />
                      </div>
                    </CarouselItem>
                  ))
                ) : (
                  <CarouselItem><div className="aspect-square bg-gray-100" /></CarouselItem>
                )}
              </CarouselContent>
            </Carousel>
          </div>

          {/* CONTENT SECTION */}
          <div className="py-6 lg:py-0 w-full space-y-6 content-load-fade">
            <div className="space-y-3">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-headline font-bold uppercase tracking-tight leading-tight">{product.name}</h1>
                
                {productReviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("h-3 w-3", s <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
                      ))}
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">({productReviews.length})</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <p className="text-lg font-bold">{`C$${totalPrice.toFixed(2)}`}</p>
                  {hasDiscount && (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground line-through">{`C$${product.comparedPrice?.toFixed(2)}`}</p>
                      <Badge className="bg-emerald-50 text-emerald-700 border-none text-[8px] font-bold">{discountPercent}% OFF</Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{product.brand || 'FSLNO Studio'}</p>
                  {product.sku && (
                    <p className="text-[8px] font-mono font-bold text-muted-foreground uppercase tracking-widest">REF: {product.sku}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select Size</span>
                {categoryCharts?.length > 0 && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <button className="flex items-center gap-2 text-[10px] font-bold uppercase hover:underline"><Ruler className="h-4 w-4" /> Chart</button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-xl bg-white p-0 flex flex-col border-none shadow-2xl">
                      <SheetHeader className="p-8 border-b">
                        <SheetTitle className="text-xl font-headline font-bold uppercase tracking-tight">Size Guide</SheetTitle>
                      </SheetHeader>
                      <ScrollArea className="flex-1 p-8">
                        {categoryCharts.map((chart: any) => (
                          <div key={chart.id} className="space-y-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest border-b pb-2">{chart.name}</h3>
                            <div className="border overflow-x-auto">
                              <Table>
                                <TableHeader className="bg-gray-50"><TableRow><TableHead className="text-[9px] font-bold uppercase">Size</TableHead>{chart.columns.map((c: any, i: any) => (<TableHead key={i} className="text-[9px] font-bold uppercase text-center">{c}</TableHead>))}</TableRow></TableHeader>
                                <TableBody>{chart.rows.map((r: any, i: any) => (<TableRow key={i}><TableCell className="text-[10px] font-bold">{r.label}</TableCell>{r.values.map((v: any, j: any) => (<TableCell key={j} className="text-center font-mono text-[10px]">{v || '-'}</TableCell>))}</TableRow>))}</TableBody>
                              </Table>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    </SheetContent>
                  </Sheet>
                )}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {(product.variants || []).map((v: any, idx: number) => (
                  <button
                    key={idx}
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
                    <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">Personalize?</Label>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">+C${(Number(product.customizationFee) || 10).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setWantsCustomization(false)} className={cn("flex-1 sm:flex-none h-10 px-6 border text-[9px] font-bold uppercase tracking-widest", !wantsCustomization ? "bg-black text-white" : "bg-white")}>No</button>
                    <button onClick={() => setWantsCustomization(true)} className={cn("flex-1 sm:flex-none h-10 px-6 border text-[9px] font-bold uppercase tracking-widest", wantsCustomization ? "bg-black text-white" : "bg-white")}>Yes</button>
                  </div>
                </div>
                {wantsCustomization && (
                  <div className="grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Name</Label><Input value={customName} onChange={(e) => setCustomName(e.target.value.toUpperCase())} className="h-11 rounded-none bg-gray-50 border-none font-bold uppercase text-xs" /></div>
                      <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Number</Label><Input value={customNumber} maxLength={2} onChange={(e) => setCustomNumber(e.target.value)} className="h-11 rounded-none bg-gray-50 border-none font-bold text-center" /></div>
                    </div>
                    <div className="space-y-2"><Label className="text-[9px] uppercase font-bold text-gray-400">Notes</Label><Input value={specialRequest} onChange={(e) => setSpecialRequest(e.target.value.toUpperCase())} className="h-11 rounded-none bg-gray-50 border-none font-medium text-[10px]" /></div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 pt-6 border-t">
              <Button 
                onClick={handleAddToCart} 
                disabled={!selectedSize}
                className="w-full h-14 bg-black text-white font-bold uppercase tracking-[0.3em] text-[10px] rounded-none hover:bg-black/90 transition-all shadow-xl"
              >
                {selectedSize ? 'Add to Bag' : 'Select Size'}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => toggleWishlist({ id: product.id, name: product.name, price: Number(product.price), image: product.media?.[0]?.url || '' })} className={cn("h-12 border-gray-100 rounded-none font-bold uppercase tracking-widest text-[9px] gap-2", isInWishlist(product.id) && "bg-red-50 border-red-100 text-red-600")}>
                  <Heart className={cn("h-4 w-4", isInWishlist(product.id) && "fill-current")} /> {isInWishlist(product.id) ? 'Saved' : 'Wishlist'}
                </Button>
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link Copied" }); }} className="h-12 border-gray-100 rounded-none font-bold uppercase tracking-widest text-[9px] gap-2">
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
            </div>

            <div className="pt-8 border-t space-y-8">
              <div className="space-y-3">
                <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-muted-foreground">Manifest</h3>
                <div className="text-sm text-gray-600 leading-relaxed uppercase tracking-tight font-medium">
                  {product.description || "Archival studio selection curated for the modern silhouette."}
                </div>
              </div>

              {product.features && product.features.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold text-muted-foreground flex items-center gap-2">
                    <Info className="h-3 w-3" /> Technical Details
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
        </div>

        <ReviewSystem productId={productId} />
      </div>

      <TestimonialSection />
    </main>
  );
}
