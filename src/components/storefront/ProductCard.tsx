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
  onImageLoad?: () => void;
}

/**
 * This is the main card used to show a product.
 * Optimized to look good on phones.
 */
export const ProductCard = React.memo(({
  id, name, price, comparedPrice, image, hoverImage, category,
  sku, rating, reviewCount, isSoldOut, priority = false, brand, inventory,
  onImageLoad
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
  const showLowStockAlert = storeConfig?.showLowStockAlertStorefront !== false;
  const globalThreshold = Number(storeConfig?.globalLowStockThreshold) || 10;

  const currentPriceNum = parseFloat(price.replace(/[^0-9.]/g, ''));
  
  // Flash Sale logic
  const isFlashActive = promoConfig?.flashEnabled && (!promoConfig.flashCountdownEnabled || (promoConfig.flashEndTime && new Date(promoConfig.flashEndTime) > new Date()));
  const flashDecrease = isFlashActive ? (currentPriceNum * (promoConfig.flashValue || 0)) / 100 : 0;
  const finalPrice = isFlashActive ? currentPriceNum - flashDecrease : currentPriceNum;

  const hasDiscount = (comparedPrice && comparedPrice > currentPriceNum) || isFlashActive;
  const displayComparedPrice = comparedPrice || (isFlashActive ? currentPriceNum : 0);
  const discountPercent = isFlashActive ? promoConfig.flashValue : (hasDiscount ? Math.round(((comparedPrice! - currentPriceNum) / comparedPrice!) * 100) : 0);

  return (
    <div id={`product-${id}`} className="group flex flex-col gap-1 product-text-align">
      <Link
        href={`/products/${id}`}
        onClick={() => {
          if (typeof window !== 'undefined') sessionStorage.setItem('fslno_last_product_id', id);
        }}
        className="relative block overflow-hidden bg-gray-50 aspect-square rounded-sm border shadow-sm" style={{ borderRadius: 'var(--radius)' }}
      >
        <div className="relative h-full w-full overflow-hidden">
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className={cn(
                "object-cover transition-all duration-700 ease-out group-hover:scale-110",
                hoverImage ? "group-hover:opacity-0" : ""
              )}
              priority={priority}
              onLoad={() => {
                setIsLoaded(true);
                if (onImageLoad) onImageLoad();
              }}
              data-ai-hint="fashion product"
            />
          {!isLoaded && <LoadingCover logoSize={40} />}
          {hoverImage && (
            <Image
              src={hoverImage}
              alt={`${name} alternative view`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover absolute inset-0 opacity-0 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-110"
              data-ai-hint="fashion variant"
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

        {!isSoldOut && hasDiscount && !isFlashActive && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="bg-white/90 backdrop-blur-sm text-black text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm">
              {discountPercent}% OFF
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-col py-1 product-flex-align">
        {/* Price Slot - Stable Height */}
        <div className="h-5 sm:h-6 flex items-center gap-2 overflow-hidden">
          <p className={cn("product-price-size font-bold leading-none shrink-0", isFlashActive ? "text-orange-600" : "product-price-color")}>
            C${finalPrice.toFixed(2)}
          </p>
          {hasDiscount && (
            <p className="text-[8px] sm:text-[10px] text-muted-foreground line-through decoration-muted-foreground/50 font-medium truncate">
              C${displayComparedPrice.toFixed(2)}
            </p>
          )}
        </div>

        {/* Title Slot - Reserves 2 lines */}
        <div className="h-[2.4rem] sm:h-[2.8rem] flex flex-col justify-start overflow-hidden mt-0.5">
          <Link
            href={`/products/${id}`}
            onClick={() => {
              if (typeof window !== 'undefined') sessionStorage.setItem('fslno_last_product_id', id);
            }}
            className="product-title-size product-title-color font-medium line-clamp-2 group-hover:underline leading-tight tracking-tight"
          >
            {name}
          </Link>
        </div>

        {/* Brand / SKU Slot - Stable Height */}
        <div className="h-4 flex items-center overflow-hidden mt-0.5">
          {(showBrand && brand || showSku && sku) && (
            <p className="uppercase tracking-[0.2em] sm:tracking-[0.25em] font-bold leading-none truncate card-sku-style">
              {showBrand && brand ? brand : ''}
              {showBrand && brand && showSku && sku ? ' • ' : ''}
              {showSku && sku ? sku : ''}
            </p>
          )}
        </div>

        {/* Stock Status Slot - Stable Height */}
        <div className="h-4 flex items-center mt-1">
          {inventory !== undefined && inventory <= 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="w-1.2 h-1.2 rounded-full bg-[#ff4d4d] shadow-[0_0_4px_rgba(255,77,77,0.4)]" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-[#ff4d4d]">Out of Stock</span>
            </div>
          ) : showLowStockAlert && inventory !== undefined && inventory <= globalThreshold && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.2 h-1.2 rounded-full bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.4)] animate-pulse" />
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.15em] text-orange-500">Low Stock</span>
            </div>
          )}
        </div>

        {/* Reviews Slot - Stable Height */}
        <div className="h-4 flex items-center mt-1">
          {(reviewCount || 0) > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
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
              <span className="text-[8px] sm:text-[9px] font-bold text-black uppercase tracking-widest ml-1">({reviewCount})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
ProductCard.displayName = 'ProductCard';
