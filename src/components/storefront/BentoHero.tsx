'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  isLoading?: boolean;
  heroImages?: string[];
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  textAlign?: string;
  verticalAlign?: string;
}

/**
 * Main Hero section for the home page.
 * Optimized for Direct-Entry velocity by removing loading gates and "flashback" artifacts.
 */
export function BentoHero({ 
  heroImages = [], 
  headline = '', 
  subheadline = '',
  buttonText = 'Shop Now',
  textAlign = 'center',
  verticalAlign = 'center'
}: BentoHeroProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  const images = heroImages || [];

  // Zero-Flashback Protocol: Return a correctly sized white block until hydration
  // to prevent default text or black boxes from manifesting before theme data.
  if (!mounted) {
    return (
      <section className="pt-32 sm:pt-40">
        <div className="w-full h-[90vh] bg-white" />
      </section>
    );
  }

  return (
    <section className="pt-32 sm:pt-40">
      <div className="w-full bg-primary overflow-hidden group shadow-2xl relative h-[90vh]">
        {images.length > 0 && (
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
                <CarouselItem key={idx} className="relative h-[90vh] w-full pl-0">
                  <Image
                    src={url}
                    alt={`${headline} ${idx + 1}`}
                    fill
                    className="object-cover opacity-80"
                    priority={idx === 0}
                  />
                </CarouselItem>
              ))}
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
                {subheadline && (
                  <span className="hero-subheadline-color hero-subheadline-size text-[10px] uppercase tracking-[0.5em] font-bold mb-6 block">
                    {subheadline}
                  </span>
                )}
                {headline && (
                  <span className="hero-headline-size font-headline mb-10 tracking-tighter uppercase font-bold leading-none block">
                    {headline}
                  </span>
                )}
                <Link 
                  href="/collections/all" 
                  className={cn(
                    "hero-button px-12 h-14 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] hover:opacity-90 transition-all duration-300 ease-in-out shadow-xl active:scale-95 w-fit",
                    textAlign === 'left' ? 'ml-0 mr-auto' : textAlign === 'right' ? 'ml-auto mr-0' : 'mx-auto'
                  )}
                >
                  {buttonText} <ArrowRight className="ml-3 h-4 w-4" />
                </Link>
              </div>
            </div>
          </Carousel>
        )}
      </div>
    </section>
  );
}