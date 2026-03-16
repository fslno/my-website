'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
  isLoading: boolean;
  heroImages?: string[];
  headline?: string;
  subheadline?: string;
  buttonText?: string;
  fallbackImageUrl?: string;
  textAlign?: string;
  verticalAlign?: string;
}

export function BentoHero({ 
  isLoading, 
  heroImages = [], 
  headline = 'The Collection', 
  subheadline = 'Modern Silhouettes',
  buttonText = 'Shop the Drops',
  fallbackImageUrl,
  textAlign = 'center',
  verticalAlign = 'center'
}: BentoHeroProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const autoplayPlugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  if (isLoading) {
    return <section className="pt-28 sm:pt-36"><div className="w-full h-[52.5vh] bg-gray-50" /></section>;
  }

  const images = heroImages.length > 0 ? heroImages : (fallbackImageUrl ? [fallbackImageUrl] : []);

  return (
    <section className="pt-28 sm:pt-36">
      <div className="w-full bg-primary overflow-hidden group shadow-2xl relative">
        <Carousel 
          setApi={setApi}
          plugins={[autoplayPlugin.current]}
          className="w-full h-[52.5vh]"
          opts={{
            loop: true,
          }}
        >
          <CarouselContent className="h-full ml-0">
            {images.map((url, idx) => (
              <CarouselItem key={idx} className="relative h-[52.5vh] w-full pl-0">
                <Image
                  src={url}
                  alt={`${headline} ${idx + 1}`}
                  fill
                  className="object-cover opacity-80"
                  priority={idx === 0}
                />
              </CarouselItem>
            ))}
            {images.length === 0 && (
              <CarouselItem className="relative h-[52.5vh] w-full pl-0">
                <div className="absolute inset-0 bg-primary opacity-20" />
              </CarouselItem>
            )}
          </CarouselContent>

          {/* Interaction-Triggered Navigation Arrows */}
          {images.length > 1 && (
            <div className="absolute inset-0 z-20 pointer-events-none group-hover:pointer-events-auto">
              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-none border-none bg-black/20 text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-auto" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-none border-none bg-black/20 text-white hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-auto" />
            </div>
          )}

          {/* Content Overlay - Centered over all slides */}
          <div className={cn(
            "absolute inset-0 p-6 sm:p-12 flex flex-col text-primary-foreground bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 hero-vertical-align pointer-events-none"
          )}>
            <div className="pointer-events-auto">
              <span className="hero-subheadline-color hero-subheadline-size text-[10px] uppercase tracking-[0.5em] font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 block">
                {subheadline}
              </span>
              <span className="hero-headline-size font-headline mb-10 tracking-tighter uppercase font-bold leading-none animate-in fade-in slide-in-from-bottom-6 duration-1000 block">
                {headline}
              </span>
              <Link 
                href="/collections/all" 
                className="hero-button px-12 h-14 flex items-center justify-center font-bold uppercase tracking-[0.2em] text-[10px] hover:opacity-90 transition-all duration-300 ease-in-out shadow-xl active:scale-95 w-fit mx-auto"
              >
                {buttonText} <ArrowRight className="ml-3 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Dot Indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-30">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => api?.scrollTo(i)}
                  className={cn(
                    "h-1 transition-all duration-500 rounded-none",
                    current === i ? "bg-white w-8" : "bg-white/30 w-4 hover:bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
        </Carousel>
      </div>
    </section>
  );
}
