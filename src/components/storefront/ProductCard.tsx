
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
}

export function ProductCard({ id, name, price, image, category }: ProductCardProps) {
  return (
    <div className="group flex flex-col gap-3">
      <Link href={`/products/${id}`} className="relative block overflow-hidden bg-gray-100 aspect-square">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <button className="absolute bottom-4 left-4 right-4 bg-white text-black text-xs font-bold uppercase tracking-widest py-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          Quick Add
        </button>
      </Link>
      
      <div className="flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{category}</p>
        <Link href={`/products/${id}`} className="text-sm font-medium line-clamp-1 group-hover:underline">{name}</Link>
        <p className="text-sm font-semibold">{price}</p>
      </div>
    </div>
  );
}
