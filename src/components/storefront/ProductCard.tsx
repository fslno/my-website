'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  price: string; // Already formatted string from parent
  image: string;
  category: string;
}

export function ProductCard({ id, name, price, image, category }: ProductCardProps) {
  return (
    <div className="group flex flex-col gap-3 product-text-align">
      <Link href={`/products/${id}`} className="relative block overflow-hidden bg-gray-100 aspect-square rounded-sm border shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200" />
        )}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
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
          className="product-title-size product-title-color font-medium line-clamp-1 group-hover:underline leading-none tracking-tight"
        >
          {name}
        </Link>
      </div>
    </div>
  );
}
