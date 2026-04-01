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
}

/**
 * This is the main card used to show a product.
 * Optimized to look good on phones.
 */
export const ProductCard = React.memo(({
  id, name, price, comparedPrice, image, hoverImage, category,
  sku, rating, reviewCount, isSoldOut, priority = false, brand
}: ProductCardProps) => {
  const { promoConfig } = useCart();
  const db = useFirestore();
  const themeRef = useMemoFirebase(() => 
    db ? doc(db, getLivePath('config/theme')) : null, 
    [db]
  );
  const { data: theme } = useDoc(themeRef);
  const showBrand = theme?.showBrand !== false; // Show the brand by default

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
          if (typeof window !== 'undefined') sessionStorage.setItem('lastProductId', id);
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
              data-ai-hint="fashion product"
            />
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

      <div className="flex flex-col gap-0 py-1 product-flex-align">
        <div className="flex items-center gap-2">
          <p className={cn("product-price-size font-bold leading-none", isFlashActive ? "text-orange-600" : "product-price-color")}>
            C${finalPrice.toFixed(2)}
          </p>
          {hasDiscount && (
            <p className="text-[8px] sm:text-[10px] text-muted-foreground line-through decoration-muted-foreground/50 font-medium">
              C${displayComparedPrice.toFixed(2)}
            </p>
          )}
        </div>
        <Link
          href={`/products/${id}`}
          onClick={() => {
            if (typeof window !== 'undefined') sessionStorage.setItem('lastProductId', id);
          }}
          className="product-title-size product-title-color font-medium line-clamp-2 group-hover:underline leading-snug tracking-tight min-h-0"
        >
          {name}
        </Link>

        {sku && (
          <p className="uppercase tracking-[0.2em] sm:tracking-[0.25em] font-bold leading-none truncate mt-0.5 card-sku-style">
            {showBrand && brand ? `${brand} • ` : ''}{sku}
          </p>
        )}

        {(reviewCount || 0) > 0 && (
          <div className="flex items-center gap-1 mt-1">
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
  );
});
ProductCard.displayName = 'ProductCard';
