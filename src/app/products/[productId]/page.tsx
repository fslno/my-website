'use client';

import React, { useState, useMemo, use } from 'react';
import Link from 'next/link';
import { 
  useFirestore, 
  useDoc, 
  useMemoFirebase,
} from '@/firebase';
import { doc } from 'firebase/firestore';
import { Header } from '@/components/storefront/Header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Share2, 
  Ruler, 
  Loader2,
  Check,
  Table as TableIcon
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
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useToast } from '@/hooks/use-toast';

export default function ProductDetailPage(props: { params: Promise<{ productId: string }> }) {
  const params = use(props.params);
  const productId = params.productId;
  const db = useFirestore();
  const { cart, addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();

  const productRef = useMemoFirebase(() => 
    db ? doc(db, 'products', productId) : null, 
    [db, productId]
  );
  
  const { data: product, loading } = useDoc(productRef);

  // Fetch Category to get Size Guide ID
  const categoryRef = useMemoFirebase(() => 
    db && product?.categoryId ? doc(db, 'categories', product.categoryId) : null,
    [db, product?.categoryId]
  );
  const { data: category } = useDoc(categoryRef);

  // Fetch Size Guide
  const sizeChartRef = useMemoFirebase(() => 
    db && category?.sizeChartId ? doc(db, 'sizeCharts', category.sizeChartId) : null,
    [db, category?.sizeChartId]
  );
  const { data: sizeChart } = useDoc(sizeChartRef);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [wantsCustomization, setWantsCustomization] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const isSaved = isInWishlist(productId);

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    const base = Number(product.price) || 0;
    const fee = wantsCustomization ? (Number(product.customizationFee) || 0) : 0;
    return base + fee;
  }, [product, wantsCustomization]);

  const formatCurrency = (val: number) => {
    return val.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const displayedSku = useMemo(() => {
    if (!product) return 'N/A';
    if (selectedSize) {
      const variant = product.variants?.find((v: any) => v.size === selectedSize);
      if (variant?.sku) return variant.sku;
    }
    return product.sku || 'N/A';
  }, [product, selectedSize]);

  const selectedVariant = useMemo(() => {
    return product?.variants?.find((v: any) => v.size === selectedSize);
  }, [product, selectedSize]);

  const currentQtyInCart = useMemo(() => {
    const item = cart.find(i => i.id === productId && i.size === selectedSize);
    return item?.quantity || 0;
  }, [cart, productId, selectedSize]);

  const isStockReached = useMemo(() => {
    if (!selectedVariant) return false;
    return currentQtyInCart >= selectedVariant.stock;
  }, [selectedVariant, currentQtyInCart]);

  const handleAddToCart = () => {
    if (!product || !selectedSize || isStockReached) return;

    const uniqueVariantId = wantsCustomization 
      ? `${product.id}-${selectedSize}-${customName}-${customNumber}-${specialRequest.substring(0, 10)}`
      : `${product.id}-${selectedSize}`;

    addToCart({
      id: product.id,
      variantId: uniqueVariantId,
      name: product.name,
      price: totalPrice,
      quantity: 1,
      image: product.media?.[0]?.url || '',
      size: selectedSize,
      categoryId: product.categoryId,
      customName: wantsCustomization ? customName : undefined,
      customNumber: wantsCustomization ? customNumber : undefined,
      specialNote: wantsCustomization ? specialRequest : undefined
    });

    toast({
      title: "Added to Cart",
      description: `${product.name} (${selectedSize}) is in your cart.`,
    });
  };

  const handleWishlist = () => {
    if (!product) return;
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.media?.[0]?.url || '',
      brand: product.brand
    });
    toast({
      title: isSaved ? "Removed from Wishlist" : "Saved to Wishlist",
      description: isSaved ? "Item removed from your favorites." : "Item added to your favorites.",
    });
  };

  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: `FSLNO | ${product.name}`,
      text: product.description || `Check out this ${product.name} from FSLNO.`,
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-4">
        <h1 className="text-2xl font-headline font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">This item may no longer be available.</p>
        <Button asChild className="bg-black text-white">
          <Link href="/">Back to Shop</Link>
        </Button>
      </div>
    );
  }

  const media = product.media || [];
  const currentMedia = media[activeImageIndex] || { url: 'https://picsum.photos/seed/placeholder/800/1200', type: 'image' };

  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-[1280px] mx-auto px-4 pt-36 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="aspect-square relative bg-gray-100 overflow-hidden rounded-sm border">
                <Image 
                  src={currentMedia.url} 
                  alt={product.name} 
                  fill 
                  className="object-cover"
                  priority
                />
              </div>
              
              {media.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {media.map((item: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={cn(
                        "w-16 h-16 shrink-0 relative border-2 transition-all duration-300 ease-in-out rounded-sm",
                        activeImageIndex === idx ? "border-black" : "border-transparent opacity-60 hover:opacity-100 hover:bg-[#D3D3D3]"
                      )}
                    >
                      <Image src={item.url} alt={`View ${idx}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden lg:block space-y-4 pt-6 border-t">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Description</h3>
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed text-sm">
                {product.description || "No description provided."}
              </div>
              
              {product.features && product.features.length > 0 && (
                <div className="pt-4">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold mb-3">Key Features</h4>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {product.features.map((feature: string, i: number) => (
                      <li key={i} className="text-[11px] flex items-start gap-2 text-gray-500">
                        <span className="w-1 h-1 rounded-full bg-black mt-1.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400">{product.brand || 'FSLNO'}</p>
              <h1 className="text-2xl font-headline font-bold tracking-tight">{product.name}</h1>
              <div className="flex items-center gap-4">
                <p className="text-lg font-bold">${formatCurrency(totalPrice)} CAD</p>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                REF: {displayedSku}
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between text-[9px] uppercase tracking-widest font-bold">
                <span>Select Size</span>
                
                {sizeChart ? (
                  <Sheet>
                    <SheetTrigger asChild>
                      <button className="flex items-center gap-2 text-gray-500 hover:text-black hover:bg-[#D3D3D3] transition-all duration-300 ease-in-out text-[13px] font-bold p-1 rounded">
                        <Ruler className="h-5 w-5" /> Size Guide
                      </button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-xl bg-white border-l p-0 overflow-hidden flex flex-col">
                      <SheetHeader className="pt-12 px-8 pb-8 border-b shrink-0">
                        <div className="flex items-center gap-3 text-black mb-2">
                          <Ruler className="h-5 w-5" />
                          <SheetTitle className="text-2xl font-headline font-bold tracking-tight uppercase">Size Guide</SheetTitle>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Measurements for: <span className="text-black font-bold">{sizeChart.name}</span></p>
                      </SheetHeader>
                      
                      <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <TableIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Dimensions</span>
                          </div>
                          <span className="text-[10px] font-bold uppercase bg-black text-white px-2 py-0.5 rounded tracking-widest">
                            Unit: {sizeChart.unit}
                          </span>
                        </div>

                        <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                          <Table>
                            <TableHeader className="bg-gray-50/50">
                              <TableRow>
                                <TableHead className="w-[100px] text-[10px] font-bold uppercase tracking-widest text-gray-400 px-6 py-4">Size</TableHead>
                                {sizeChart.columns?.map((col: string, idx: number) => (
                                  <TableHead key={idx} className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 py-4">{col}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sizeChart.rows?.map((row: any, rowIdx: number) => (
                                <TableRow key={rowIdx} className="hover:bg-gray-50/30 transition-colors">
                                  <TableCell className="font-bold text-xs px-6 py-4 border-r bg-gray-50/10">{row.label}</TableCell>
                                  {row.values?.map((val: string, colIdx: number) => (
                                    <TableCell key={colIdx} className="text-center text-sm font-medium text-gray-600 py-4">{val || '--'}</TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <button className="flex items-center gap-2 text-gray-300 cursor-not-allowed text-[11px] uppercase font-bold">
                    <Ruler className="h-4 w-4" /> No size guide
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(product.variants || []).map((v: any) => (
                  <button
                    key={v.size}
                    onClick={() => setSelectedSize(v.size)}
                    disabled={Number(v.stock) === 0}
                    className={cn(
                      "h-10 min-w-[2.5rem] px-3 border text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ease-in-out rounded-sm hover:bg-[#D3D3D3] hover:text-[#333333]",
                      selectedSize === v.size 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-black border-gray-200",
                      Number(v.stock) === 0 && "opacity-30 cursor-not-allowed border-dashed hover:bg-transparent hover:text-gray-300"
                    )}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-gray-400">
                Fit: <span className="text-black font-bold">{product.sizeFit || 'True to size'}</span>
              </p>
            </div>

            <div className="space-y-4 p-4 bg-gray-50 border border-gray-100 rounded-sm">
              <div className="space-y-2">
                <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">
                  Customization
                </Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setWantsCustomization(false)}
                    className={cn(
                      "flex-1 h-10 border text-[9px] font-bold uppercase tracking-widest transition-all duration-300 ease-in-out rounded-sm hover:bg-[#D3D3D3] hover:text-[#333333]",
                      !wantsCustomization ? "bg-black text-white border-black" : "bg-white text-black border-gray-200"
                    )}
                  >
                    No
                  </button>
                  <button
                    onClick={() => setWantsCustomization(true)}
                    className={cn(
                      "flex-1 h-10 border text-[9px] font-bold uppercase tracking-widest transition-all duration-300 ease-in-out rounded-sm hover:bg-[#D3D3D3] hover:text-[#333333]",
                      wantsCustomization ? "bg-black text-white border-black" : "bg-white text-black border-gray-200"
                    )}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {wantsCustomization && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Customization Fee</span>
                    <span className="text-lg font-bold text-black">
                      +${formatCurrency(product.customizationFee || 0)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Name</Label>
                      <Input 
                        placeholder="ENTER NAME" 
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                        className="bg-white h-9 text-[10px] font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Number</Label>
                      <Input 
                        placeholder="00" 
                        maxLength={2}
                        value={customNumber}
                        onChange={(e) => setCustomNumber(e.target.value)}
                        className="bg-white h-9 text-[10px] font-bold text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[9px] uppercase tracking-widest font-bold text-gray-500">Special Note</Label>
                    <Textarea 
                      placeholder="ADDITIONAL REQUESTS..." 
                      value={specialRequest}
                      onChange={(e) => setSpecialRequest(e.target.value.toUpperCase())}
                      className="bg-white min-h-[60px] text-[10px] font-bold resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t mt-4">
              <button 
                onClick={handleAddToCart}
                disabled={!selectedSize || isStockReached}
                className={cn(
                  "w-full h-12 font-bold uppercase tracking-[0.2em] text-[10px] rounded-sm transition-all duration-300 ease-in-out shadow-md hover:bg-[#D3D3D3] hover:text-[#333333]",
                  isStockReached 
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200 hover:text-gray-500" 
                    : "bg-black text-white active:scale-95"
                )}
              >
                {!selectedSize ? 'Select Size' : isStockReached ? 'Sold Out' : 'Add to Cart'}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleWishlist}
                  variant="outline" 
                  className={cn(
                    "h-10 font-bold uppercase tracking-widest text-[9px] gap-2 border-gray-200 rounded-sm",
                    isSaved && "bg-red-50 border-red-200 text-red-600"
                  )}
                >
                  <Heart className={cn("h-3.5 w-3.5", isSaved && "fill-current")} /> 
                  {isSaved ? 'Saved' : 'Wishlist'}
                </Button>
                <Button 
                  onClick={handleShare}
                  variant="outline" 
                  className="h-10 font-bold uppercase tracking-widest text-[9px] gap-2 border-gray-200 rounded-sm"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
                </Button>
              </div>
            </div>

            <div className="lg:hidden space-y-4 pt-6 border-t">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Description</h3>
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed text-sm">
                {product.description || "No description provided."}
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2 text-gray-400">
                <Check className="h-3 w-3 text-green-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Ready to ship</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
