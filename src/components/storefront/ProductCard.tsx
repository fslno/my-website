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
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
      
      <div className="flex flex-col">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">{category}</p>
        <Link href={`/products/${id}`} className="product-title-size font-medium line-clamp-1 text-primary group-hover:underline leading-tight">{name}</Link>
        <p className="product-price-size font-semibold text-primary mt-0.5">{price}</p>
      </div>
    </div>
  );
}
