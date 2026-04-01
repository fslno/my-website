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
import { useLanguage } from '@/context/LanguageContext';
import { useLoading } from '@/context/LoadingContext';
import { LoadingCover } from '@/components/ui/LoadingCover';

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
  const { t } = useLanguage();
  const { pushLoading, popLoading } = useLoading();
  const lockId = React.useMemo(() => `hero-static-${Math.random().toString(36).substring(7)}`, []);
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    pushLoading(lockId);
    
    // Safety timeout
    const timer = setTimeout(() => popLoading(lockId), 5000);
    return () => {
      clearTimeout(timer);
      popLoading(lockId);
    };
  }, [pushLoading, popLoading, lockId]);

  useEffect(() => {
    // Release the splash screen only when:
    // 1. Data is completely fetched (!isLoading)
    // 2. AND either an image is ready OR there are no images to load
    const imagesToLoad = heroImages.length > 0 ? heroImages : (fallbackImageUrl ? [fallbackImageUrl] : []);
    if (!isLoading) {
      if (firstImageLoaded || imagesToLoad.length === 0) {
        popLoading(lockId);
      }
    }
  }, [firstImageLoaded, isLoading, heroImages, fallbackImageUrl, popLoading, lockId]);

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
        "w-full overflow-hidden relative",
        bannerEnabled ? "pt-7 sm:pt-10" : "pt-0"
      )}>
        <div 
          className={cn(
            "w-full bg-white shadow-2xl relative overflow-hidden",
            "aspect-square sm:aspect-[var(--hero-aspect-ratio,7.2)]"
          )}
          style={{
            '--hero-aspect-ratio': (heroAspectRatio || 7.2) * 2.04
          } as React.CSSProperties}
        >
          <LoadingCover logoSize={180} />
        </div>
      </section>
    );
  }

  const images = heroImages.length > 0 ? heroImages : (fallbackImageUrl ? [fallbackImageUrl] : []);

  return (
    <section className={cn(
      "w-full overflow-hidden",
      bannerEnabled ? "pt-7 sm:pt-10" : "pt-0"
    )}>
      <div 
        className={cn(
          "w-full bg-black group shadow-2xl relative overflow-hidden",
          "aspect-square sm:aspect-[var(--hero-aspect-ratio,7.2)]"
        )}
        style={{
          '--hero-aspect-ratio': heroAspectRatio * 2.04
        } as React.CSSProperties}
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
              <CarouselItem key={`${url}-${idx}`} className="relative basis-full w-full pl-0 h-full">
                <Image
                  src={url}
                  alt={`${headline} ${idx + 1}`}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={idx === 0}
                  onLoad={idx === 0 ? () => setFirstImageLoaded(true) : undefined}
                  {...(idx === 0 ? { fetchPriority: "high" } : {})}
                />
              </CarouselItem>
            ))}
            {images.length === 0 && (
              <CarouselItem className="relative w-full pl-0 h-full">
                <div className="absolute inset-0 bg-primary opacity-20" />
              </CarouselItem>
            )}
          </CarouselContent>

          {images.length > 1 && (
            <div className="absolute inset-0 z-20 pointer-events-none">
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-none border-none bg-black/20 text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-auto" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-none border-none bg-black/20 text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-auto" />
            </div>
          )}

          <div className={cn(
            "absolute inset-0 p-6 sm:p-12 flex flex-col text-primary-foreground bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 hero-vertical-align hero-text-align pointer-events-none",
            "animate-in fade-in duration-1000"
          )}>
            <div className={cn(
              "pointer-events-auto w-full transition-all duration-1000 delay-300",
              mounted ? "translate-y-0 opacity-100" : "translate-y-0 opacity-100"
            )}>
              <span className="hero-subheadline-color hero-subheadline-size text-[8px] sm:text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.5em] font-bold mb-4 sm:mb-6 block">
                {subheadline}
              </span>
              <span className="hero-headline-size font-headline mb-8 sm:mb-10 tracking-tighter uppercase font-bold leading-[0.9] sm:leading-none block text-[32px] sm:text-[var(--hero-headline-size)]">
                {headline}
              </span>
              <Link
                href="/products"
                className={cn(
                  "hero-button px-8 sm:px-12 h-12 sm:h-14 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] hover:opacity-90 transition-all duration-300 ease-in-out shadow-xl active:scale-95 w-fit pointer-events-auto",
                  textAlign === 'left' ? 'ml-0 mr-auto' : textAlign === 'right' ? 'ml-auto mr-0' : 'mx-auto'
                )}
              >
                {(buttonText && buttonText.toUpperCase() !== 'SHOP NOW') ? buttonText : t('hero.shop_now')} <ArrowRight className="ml-2 sm:ml-3 h-4 w-4" />
              </Link>
            </div>
          </div>
        </Carousel>
      </div>
    </section>
  );
}
