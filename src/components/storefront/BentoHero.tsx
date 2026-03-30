'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart, parseFirestoreDate } from '@/context/CartContext';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface BentoHeroProps {
  isLoading: boolean;
  heroImages?: string[];
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  fallbackImageUrl?: string;
  textAlign?: string;
  verticalAlign?: string;
  bannerEnabled?: boolean;
  heroAspectRatio?: number;
}

/**
 * Main Hero section for the home page.
 * Recalibrated with increased height (90vh) for a commanding presence.
 */
export function BentoHero({
  isLoading,
  heroImages = [],
  headline,
  subheadline,
  buttonText,
  fallbackImageUrl,
  textAlign = 'center',
  verticalAlign = 'center',
  bannerEnabled = false,
  heroAspectRatio = 1.777
}: BentoHeroProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  const { promoConfig } = useCart();
  const isFlashActive = useMemo(() => {
    if (!promoConfig?.flashEnabled) return false;
    if (!promoConfig.flashCountdownEnabled) return true;
    const end = parseFirestoreDate(promoConfig.flashEndTime);
    return end ? new Date() < end : false;
  }, [promoConfig]);

  if (isLoading) {
    return (
      <section className={cn(
        "pt-12 sm:pt-16",
        "opacity-0 transition-opacity duration-500"
      )}>
        <div 
          className="w-full bg-neutral-100 overflow-hidden relative animate-pulse h-[80vh]" 
        />
      </section>
    );
  }

  const images = heroImages.length > 0 ? heroImages : (fallbackImageUrl ? [fallbackImageUrl] : []);

  return (
    <section className={cn(
      bannerEnabled ? "pt-7 sm:pt-10" : "pt-0"
    )}>
      <div 
        className="w-full bg-white overflow-hidden group shadow-2xl relative h-[80vh]"
      >
        <Carousel
          setApi={setApi}
          plugins={[autoplayPlugin.current]}
          className="w-full h-full"
          opts={{
            loop: true,
          }}
        >
          <CarouselContent className="h-full ml-0">
            {images.map((url, idx) => (
              <CarouselItem key={url} className="relative w-full pl-0 h-[80vh]">
                <Image
                  src={url}
                  alt={`${headline} ${idx + 1}`}
                  fill
                  sizes="100vw"
                  className="object-cover opacity-80"
                  priority={idx === 0}
                />
              </CarouselItem>
            ))}
            {images.length === 0 && (
              <CarouselItem className="relative w-full pl-0 h-[80vh]">
                <div className="absolute inset-0 bg-primary opacity-20" />
              </CarouselItem>
            )}
          </CarouselContent>

          {images.length > 1 && (
            <div className="absolute inset-0 z-20 pointer-events-none group-hover:pointer-events-auto">
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-none border-none bg-black/20 text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-auto" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-none border-none bg-black/20 text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-auto" />
            </div>
          )}

          <div className={cn(
            "absolute inset-0 p-6 sm:p-12 flex flex-col text-primary-foreground bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 hero-vertical-align hero-text-align pointer-events-none"
          )}>
            <div className="pointer-events-auto w-full">
              <span className="hero-subheadline-color hero-subheadline-size text-[10px] uppercase tracking-[0.5em] font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 block">
                {subheadline}
              </span>
              <span className="hero-headline-size font-headline mb-10 tracking-tighter uppercase font-bold leading-none animate-in fade-in slide-in-from-bottom-6 duration-1000 block">
                {headline}
              </span>
              <Link
                href="/collections/all"
                className={cn(
                  "hero-button px-12 h-14 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] hover:opacity-90 transition-all duration-300 ease-in-out shadow-xl active:scale-95 w-fit",
                  textAlign === 'left' ? 'ml-0 mr-auto' : textAlign === 'right' ? 'ml-auto mr-0' : 'mx-auto'
                )}
              >
                {buttonText || "Shop Now"} <ArrowRight className="ml-3 h-4 w-4" />
              </Link>
            </div>
          </div>
        </Carousel>
      </div>
    </section>
  );
}
