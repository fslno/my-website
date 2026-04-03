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
import { Button } from "@/components/ui/button";
import Autoplay from "embla-carousel-autoplay";
import { useLanguage } from '@/context/LanguageContext';

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
  heroButtonBgColor?: string;
  heroButtonTextColor?: string;
  heroButtonScale?: number;
  heroButtonRadius?: number;
  buttonLink?: string;
  heroAspectRatioDesktop?: number;
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
  heroAspectRatio = 1.777,
  heroButtonBgColor,
  heroButtonTextColor,
  heroButtonScale = 1.0,
  heroButtonRadius = 0,
  buttonLink = '/products',
  heroAspectRatioDesktop = 2.54
}: BentoHeroProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();

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
        "w-full overflow-hidden relative",
        bannerEnabled ? "pt-7 sm:pt-10" : "pt-0"
      )}>
        <div 
          className={cn(
            "w-full bg-white relative overflow-hidden",
            "aspect-[var(--hero-aspect-ratio,1.777)] lg:aspect-[var(--hero-aspect-ratio-desktop,2.54)]"
          )}
          style={{
            '--hero-aspect-ratio': heroAspectRatio || '1.777',
            '--hero-aspect-ratio-desktop': heroAspectRatioDesktop || '2.54'
          } as React.CSSProperties}
        >
          <div className="w-full h-full bg-white" />
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
          "w-full bg-white group shadow-2xl relative overflow-hidden",
          "aspect-[var(--hero-aspect-ratio,1.777)] lg:aspect-[var(--hero-aspect-ratio-desktop,5.07)]"
        )}
        style={{
          '--hero-aspect-ratio': heroAspectRatio || '1.777',
          '--hero-aspect-ratio-desktop': heroAspectRatioDesktop || '5.07'
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
              <CarouselPrevious 
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 border-none bg-black/20 text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-auto" 
                style={{ borderRadius: 'var(--btn-radius)' }}
              />
              <CarouselNext 
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 border-none bg-black/20 text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-auto" 
                style={{ borderRadius: 'var(--btn-radius)' }}
              />
            </div>
          )}

          <div className={cn(
            "absolute inset-0 p-4 sm:p-8 lg:p-4 flex flex-col text-primary-foreground bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 hero-vertical-align hero-text-align pointer-events-none",
            "animate-in fade-in duration-1000"
          )}>
            <div className={cn(
              "pointer-events-auto w-full transition-all duration-1000 delay-300",
              mounted ? "translate-y-0 opacity-100" : "translate-y-0 opacity-100"
            )}>
              <span className="hero-subheadline-color hero-subheadline-size uppercase font-bold mb-2 sm:mb-4 block">
                {subheadline}
              </span>
              <span className="hero-headline-size font-headline mb-4 sm:mb-6 tracking-tighter uppercase font-bold block">
                {headline}
              </span>
              
              <div className={cn("flex flex-col sm:flex-row gap-4 items-center", textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center')}>
                <Button 
                  asChild
                  className={cn(
                    "hero-button btn-theme w-fit group/btn transition-all duration-300",
                    "text-sm font-bold uppercase tracking-widest"
                  )}
                  style={{
                    paddingLeft: `calc(40px * var(--btn-scale, ${heroButtonScale}))`,
                    paddingRight: `calc(40px * var(--btn-scale, ${heroButtonScale}))`,
                    height: `calc(60px * var(--btn-scale, ${heroButtonScale}))`,
                    backgroundColor: heroButtonBgColor,
                    color: heroButtonTextColor,
                    borderRadius: heroButtonRadius ? `${heroButtonRadius}px` : 'var(--btn-radius)',
                    '--btn-scale': heroButtonScale,
                  } as React.CSSProperties}
                >
                  <Link href={buttonLink} className="flex items-center gap-2">
                    {buttonText || t('hero.shop_now')}
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Carousel>
      </div>
    </section>
  );
}
