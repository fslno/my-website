'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { Star, Quote, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { getLivePath } from '@/lib/paths';

/**
 * Customer testimonial section.
 */
export function TestimonialSection() {
  const db = useFirestore();

  const testimonialsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, getLivePath('testimonials')), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: allTestimonials, isLoading } = useCollection(testimonialsQuery);

  const testimonials = useMemo(() => {
    if (!allTestimonials) return [];
    return allTestimonials.filter(t => t.isFeatured === true).slice(0, 9);
  }, [allTestimonials]);

  const autoplayPlugin = useMemo(() => Autoplay({ delay: 4000, stopOnInteraction: false }), []);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center bg-white min-h-[300px]" />
    );
  }

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="py-20 bg-white border-t border-b overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="text-center mb-16 space-y-3">
          <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-muted-foreground">Feedback</span>
          <h2 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tighter">What Our Customers Say</h2>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[autoplayPlugin]}
          className="w-full"
        >
          <CarouselContent className="-ml-4 md:-ml-8 lg:-ml-10">
            {testimonials.map((t) => (
              <CarouselItem key={t.id} className="pl-4 md:pl-8 lg:pl-10 basis-full md:basis-1/2 lg:basis-1/3">
                <div 
                  className="bg-gray-50/50 p-6 sm:p-10 border rounded-none flex flex-col gap-8 shadow-sm hover:shadow-md transition-shadow duration-500 group h-full"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-xl bg-white shrink-0">
                        {t.customerImageUrl ? (
                          <Image 
                            src={t.customerImageUrl} 
                            alt={t.customerName} 
                            fill 
                            className="object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold text-xl uppercase">
                            {t.customerName?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary">{t.customerName}</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={cn(
                                "h-3 w-3", 
                                s <= t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                              )} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <Quote className="h-6 w-6 text-black/5 group-hover:text-primary/10 transition-colors shrink-0" />
                  </div>

                  <p className="text-sm sm:text-base italic leading-relaxed text-gray-600 font-medium line-clamp-4">
                    "{t.quote}"
                  </p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
