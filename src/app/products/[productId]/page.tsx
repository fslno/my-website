'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { 
  useFirestore, 
  useDoc, 
  useMemoFirebase 
} from '@/firebase';
import { doc } from 'firebase/firestore';
import { Header } from '@/components/storefront/Header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  Heart, 
  Share2, 
  Ruler, 
  ChevronRight, 
  Loader2,
  Info,
  Check
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.productId as string;
  const db = useFirestore();

  const productRef = useMemoFirebase(() => 
    db ? doc(db, 'products', productId) : null, 
    [db, productId]
  );
  
  const { data: product, loading } = useDoc(productRef);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [wantsCustomization, setWantsCustomization] = useState(false);
  const [specialRequest, setSpecialRequest] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    const base = Number(product.price) || 0;
    const fee = wantsCustomization ? (Number(product.customizationFee) || 0) : 0;
    return base + fee;
  }, [product, wantsCustomization]);

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
        <h1 className="text-2xl font-headline font-bold mb-4">Entry Not Found</h1>
        <p className="text-muted-foreground mb-8">This item may have been de-archived or moved.</p>
        <Button asChild className="bg-black text-white">
          <a href="/">Back to Archive</a>
        </Button>
      </div>
    );
  }

  const media = product.media || [];
  const currentMedia = media[activeImageIndex] || { url: 'https://picsum.photos/seed/placeholder/800/1200', type: 'image' };

  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-[1440px] mx-auto px-4 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Visuals & Narrative */}
          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-4">
              <div className="aspect-[3/4] relative bg-gray-100 overflow-hidden">
                <Image 
                  src={currentMedia.url} 
                  alt={product.name} 
                  fill 
                  className="object-cover"
                  priority
                />
              </div>
              
              {media.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {media.map((item: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={cn(
                        "aspect-[3/4] relative border-2 transition-all",
                        activeImageIndex === idx ? "border-black" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <Image src={item.url} alt={`View ${idx}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Narrative (Desktop Position) */}
            <div className="hidden lg:block space-y-6 pt-12 border-t">
              <h3 className="text-xs uppercase tracking-[0.3em] font-bold">Product Narrative</h3>
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                {product.description || "No description provided for this archive entry."}
              </div>
              
              {product.features && product.features.length > 0 && (
                <div className="pt-8">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold mb-4">Key Attributes</h4>
                  <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {product.features.map((feature: string, i: number) => (
                      <li key={i} className="text-xs flex items-start gap-2 text-gray-500">
                        <span className="w-1 h-1 rounded-full bg-black mt-1.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Actions & Configuration */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-32 h-fit">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">{product.brand || 'FSLNO Studio'}</p>
              <h1 className="text-3xl font-headline font-bold tracking-tight">{product.name}</h1>
              <div className="flex items-center gap-4">
                <p className="text-xl font-medium">${totalPrice.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-orange-400">
                  <Star className="h-3 w-3 fill-current" />
                  <Star className="h-3 w-3 fill-current" />
                  <Star className="h-3 w-3 fill-current" />
                  <Star className="h-3 w-3 fill-current" />
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-[10px] text-gray-400 font-bold ml-1">(24 Reviews)</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold">
                <span>Select Size</span>
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-black transition-colors">
                  <Ruler className="h-3 w-3" /> Size Chart
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(product.variants || []).map((v: any) => (
                  <button
                    key={v.size}
                    onClick={() => setSelectedSize(v.size)}
                    disabled={Number(v.stock) === 0}
                    className={cn(
                      "h-12 min-w-[3rem] px-4 border text-xs font-bold uppercase tracking-widest transition-all",
                      selectedSize === v.size 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-black border-gray-200 hover:border-black",
                      Number(v.stock) === 0 && "opacity-30 cursor-not-allowed border-dashed"
                    )}
                  >
                    {v.size}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400">
                Fitting: <span className="text-black font-bold">{product.sizeFit || 'Standard Fit'}</span>
              </p>
            </div>

            <div className="space-y-4 p-6 bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="custom" 
                    checked={wantsCustomization} 
                    onCheckedChange={(checked) => setWantsCustomization(!!checked)}
                  />
                  <Label htmlFor="custom" className="text-xs font-bold uppercase tracking-widest cursor-pointer">
                    Tailored Customization
                  </Label>
                </div>
                {wantsCustomization && (
                  <span className="text-[10px] font-bold text-blue-600">
                    +${product.customizationFee || 0}
                  </span>
                )}
              </div>
              
              {wantsCustomization && (
                <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Label className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Special Request / Measurements</Label>
                  <Textarea 
                    placeholder="Enter specific length or detail requests..."
                    value={specialRequest}
                    onChange={(e) => setSpecialRequest(e.target.value)}
                    className="bg-white border-gray-200 min-h-[100px] text-xs resize-none"
                  />
                  <p className="text-[10px] text-gray-400 flex items-start gap-2">
                    <Info className="h-3 w-3 shrink-0" />
                    Customized items are final sale and require 2-3 additional days for processing.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4">
              <Button className="w-full h-14 bg-black text-white font-bold uppercase tracking-[0.2em] text-xs hover:bg-black/90">
                Add to Cart
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 font-bold uppercase tracking-widest text-[10px] gap-2 border-gray-200">
                  <Heart className="h-4 w-4" /> Wishlist
                </Button>
                <Button variant="outline" className="h-12 font-bold uppercase tracking-widest text-[10px] gap-2 border-gray-200">
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
            </div>

            {/* Mobile-only Narrative position */}
            <div className="lg:hidden space-y-6 pt-12 border-t">
              <h3 className="text-xs uppercase tracking-[0.3em] font-bold">Product Narrative</h3>
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                {product.description || "No description provided for this archive entry."}
              </div>
            </div>

            <div className="pt-8 space-y-4">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest border-b pb-2">
                <span className="text-gray-400">SKU Reference</span>
                <span>{product.sku || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Check className="h-3 w-3 text-green-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">In Stock & Ready for Archive Dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
