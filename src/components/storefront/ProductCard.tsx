'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Star, Zap } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getLivePath } from '@/lib/paths';
import { useCart } from '@/context/CartContext';
import { LoadingCover } from '@/components/ui/LoadingCover';

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  comparedPrice?: number;
  image: string;
  hoverImage?: string;
  category: string;
  sku?: string;
  rating?: number;
  reviewCount?: number;
  isSoldOut?: boolean;
  priority?: boolean;
  brand?: string;
  inventory?: number;
  isCustomizable?: boolean;
  preorderEnabled?: boolean;
  onImageLoad?: () => void;
}

/**
 * This is the main card used to show a product.
 * Optimized to look good on phones.
 */
export const ProductCard = React.memo(({
  id, name, price, comparedPrice, image, hoverImage, category,
  sku, rating, reviewCount, isSoldOut, priority = false, brand, inventory,
  isCustomizable, preorderEnabled, onImageLoad
}: ProductCardProps) => {
  const { promoConfig } = useCart();
  const db = useFirestore();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const themeRef = useMemoFirebase(() => 
    db ? doc(db, getLivePath('config/theme')) : null, 
    [db]
  );
  const { data: theme } = useDoc(themeRef);

  const storeRef = useMemoFirebase(() => 
    db ? doc(db, getLivePath('config/store')) : null, 
    [db]
  );
  const { data: storeConfig } = useDoc(storeRef);

  const showBrand = storeConfig?.showBrandStorefront !== false;
  const showSku = storeConfig?.showSkuStorefront !== false;


  const currentPriceNum = parseFloat(price.replace(/[^0-9.]/g, ''));
  
  // Flash Sale logic
  const isFlashActive = promoConfig?.flashEnabled && (!promoConfig.flashCountdownEnabled || (promoConfig.flashEndTime && new Date(promoConfig.flashEndTime) > new Date()));
  const flashDecrease = isFlashActive ? (currentPriceNum * (promoConfig.flashValue || 0)) / 100 : 0;
  const finalPrice = isFlashActive ? currentPriceNum - flashDecrease : currentPriceNum;

  const hasDiscount = (comparedPrice && comparedPrice > currentPriceNum) || isFlashActive;
  const displayComparedPrice = comparedPrice || (isFlashActive ? currentPriceNum : 0);
  const discountPercent = isFlashActive ? promoConfig.flashValue : (hasDiscount ? Math.round(((comparedPrice! - currentPriceNum) / comparedPrice!) * 100) : 0);

  return (
    <div id={`product-${id}`} className="group flex flex-col gap-1.5 product-text-align">
      <Link
        href={`/products/${id}`}
        aria-label={`View details for ${name}`}
        className="relative block overflow-hidden bg-gray-50 aspect-square rounded-sm border shadow-sm transition-all duration-500 ease-out hover:shadow-xl hover:-translate-y-1" style={{ borderRadius: 'var(--radius)' }}
      >
        <div className="relative h-full w-full overflow-hidden">
            <Image
              src={image}
              alt={`${name} - Product Image`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition-all duration-700 ease-out group-hover:scale-110",
                hoverImage ? "group-hover:opacity-0" : ""
              )}
              priority={priority}
              onLoad={() => {
                setIsLoaded(true);
                if (onImageLoad) onImageLoad();
              }}
            />
          {!isLoaded && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
          {hoverImage && (
            <Image
              src={hoverImage}
              alt={`${name} - Alternative View`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover absolute inset-0 opacity-0 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-110"
            />
          )}
        </div>

        {isSoldOut && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="bg-black/80 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm">
              Sold Out
            </span>
          </div>
        )}

        {!isSoldOut && isFlashActive && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="bg-orange-600 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm flex items-center gap-1">
              <Zap className="h-2 w-2 fill-white" />
              {promoConfig.flashLabel || 'SALE'}
            </span>
          </div>
        )}
        {!isSoldOut && hasDiscount && !isFlashActive && !preorderEnabled && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="bg-white/90 backdrop-blur-sm text-black text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm">
              {discountPercent}% OFF
            </span>
          </div>
        )}

      </Link>

      <div className="flex flex-col product-flex-align gap-2.5 mt-2 mb-2">
        {/* Price Slot */}
        <div className="flex items-center gap-2 overflow-hidden leading-tight">
          <p className={cn("product-price-size font-bold shrink-0 leading-none", isFlashActive ? "text-orange-600" : "product-price-color")}>
            C${finalPrice.toFixed(2)}
          </p>
          {hasDiscount && (
            <p className="text-[8px] sm:text-[10px] text-muted-foreground line-through decoration-muted-foreground/50 font-medium truncate leading-none">
              C${displayComparedPrice.toFixed(2)}
            </p>
          )}
        </div>

        {/* Details Group */}
        <div className="flex flex-col product-flex-align gap-1.5 w-full">
          {/* Title Slot */}
          <div className="flex flex-col justify-start overflow-hidden leading-tight">
            <Link
              href={`/products/${id}`}
              className="product-title-size product-title-color font-bold line-clamp-2 group-hover:underline leading-tight tracking-tight px-1"
            >
              {name}
            </Link>
          </div>
  
          {/* Brand / SKU Slot */}
          {(showBrand && brand || showSku && sku) && (
            <div className="flex items-center overflow-hidden leading-none">
              <p className="card-sku-style uppercase tracking-[0.2em] sm:tracking-[0.25em] font-bold truncate leading-none">
                {showBrand && brand ? brand : ''}
                {showBrand && brand && showSku && sku ? ' • ' : ''}
                {showSku && sku ? `SKU ${sku}` : ''}
              </p>
            </div>
          )}
  
          {/* Stock Status Slot */}
          {inventory !== undefined && inventory <= 0 && (
            <div className="flex items-center leading-none">
              <div className="flex items-center gap-1.5 leading-none">
                <div className="w-1.2 h-1.2 rounded-full bg-[#ff4d4d] shadow-[0_0_4px_rgba(255,77,77,0.4)]" />
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-[#ff4d4d] leading-none">Out of Stock</span>
              </div>
            </div>
          )}
  
          {/* Customization Badge */}
          {isCustomizable && (
            <div className="flex items-center gap-1.2 bg-blue-50/50 border border-blue-100/50 px-1.5 py-0.5 w-fit rounded-none animate-in fade-in slide-in-from-left-1 duration-500">
              <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-blue-700 flex items-center gap-1 leading-tight">
                <Zap className="h-2 w-2 fill-current" /> Customizable
              </span>
            </div>
          )}
  
          {/* Reviews Slot */}
          {(reviewCount || 0) > 0 && (
            <div className="flex items-center leading-none">
              <div className="flex items-center gap-1 leading-none">
                <div className="flex gap-0.5 leading-none">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      style={s <= Math.round(rating || 0) ? { fill: '#facc15', color: '#facc15' } : {}}
                      className={cn(
                        "h-2 sm:h-2.5 w-2 sm:w-2.5 transition-all duration-300",
                        s <= Math.round(rating || 0) ? "" : "text-gray-200"
                      )}
                    />
                  ))}
                </div>
                <span className="text-[8px] sm:text-[9px] font-bold text-black uppercase tracking-widest ml-1 leading-none">({reviewCount})</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
ProductCard.displayName = 'ProductCard';
