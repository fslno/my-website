'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  price: string; // Already formatted string from parent
  image: string;
  hoverImage?: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  isSoldOut?: boolean;
}

export function ProductCard({ id, name, price, image, hoverImage, category, rating, reviewCount, isSoldOut }: ProductCardProps) {
  return (
    <div className="group flex flex-col gap-3 product-text-align">
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
            />
            {hoverImage && (
              <Image
                src={hoverImage}
                alt={`${name} alternative view`}
                fill
                className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-gray-200" />
        )}
        
        {isSoldOut && (
          <div className="absolute top-0 right-0 z-10 p-2 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-500">
            <span className="bg-red-600 text-white text-[8px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 shadow-xl">
              Sold Out
            </span>
          </div>
        )}
      </Link>
      
      <div className="flex flex-col gap-2 py-1 product-flex-align">
        <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-bold leading-none">
          {category}
        </p>
        <p className="product-price-size product-price-color font-bold leading-none">
          {price}
        </p>
        <Link 
          href={`/products/${id}`} 
          className="product-title-size product-title-color font-medium line-clamp-1 group-hover:underline leading-none tracking-tight min-h-0"
        >
          {name}
        </Link>
        
        {reviewCount && reviewCount > 0 ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  className={cn(
                    "h-2.5 w-2.5", 
                    s <= Math.round(rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                  )} 
                />
              ))}
            </div>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">({reviewCount})</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
