'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  price: string; 
  comparedPrice?: number;
  image: string;
  hoverImage?: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  isSoldOut?: boolean;
  priority?: boolean;
}

export function ProductCard({ 
  id, name, price, comparedPrice, image, hoverImage, category, 
  rating, reviewCount, isSoldOut, priority = false 
}: ProductCardProps) {
  const currentPriceNum = parseFloat(price.replace(/[^0-9.]/g, ''));
  const hasDiscount = comparedPrice && comparedPrice > currentPriceNum;
  const discountPercent = hasDiscount ? Math.round(((comparedPrice! - currentPriceNum) / comparedPrice!) * 100) : 0;

  return (
    <div className="group flex flex-col gap-2 sm:gap-3 product-text-align">
      <Link href={`/products/${id}`} className="relative block overflow-hidden bg-gray-100 aspect-square rounded-sm border shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
        {image ? (
          <>
            <Image
              src={image}
              alt={name}
              fill
              className={cn(
                "object-cover transition-opacity duration-500",
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
                className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                data-ai-hint="fashion variant"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-gray-200" />
        )}
        
        {isSoldOut && (
          <div className="absolute top-0 right-0 z-10 p-1.5 sm:p-2 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-500">
            <span className="bg-red-600 text-white text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] px-2 py-1 sm:px-3 sm:py-1.5 shadow-xl">
              Sold Out
            </span>
          </div>
        )}

        {!isSoldOut && hasDiscount && (
          <div className="absolute top-0 left-0 z-10 p-1.5 sm:p-2 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-500">
            <span className="bg-white text-black text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] px-2 py-1 sm:px-3 sm:py-1.5 shadow-xl border border-black/5">
              {discountPercent}% OFF
            </span>
          </div>
        )}
      </Link>
      
      <div className="flex flex-col gap-1 sm:gap-2 py-1 product-flex-align">
        <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-muted-foreground font-bold leading-none truncate">
          {category}
        </p>
        <div className="flex items-center gap-2">
          <p className="product-price-size product-price-color font-bold leading-none">
            {price}
          </p>
          {hasDiscount && (
            <p className="text-[8px] sm:text-[10px] text-muted-foreground line-through decoration-muted-foreground/50 font-medium">
              C${comparedPrice?.toFixed(2)}
            </p>
          )}
        </div>
        <Link 
          href={`/products/${id}`} 
          className="product-title-size product-title-color font-medium line-clamp-2 group-hover:underline leading-snug tracking-tight min-h-0"
        >
          {name}
        </Link>
        
        {reviewCount && reviewCount > 0 ? (
          <div className="flex items-center gap-1 mt-0.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  className={cn(
                    "h-2 sm:h-2.5 w-2 sm:w-2.5", 
                    s <= Math.round(rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                  )} 
                />
              ))}
            </div>
            <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">({reviewCount})</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
