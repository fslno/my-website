'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import Image from 'next/image';
import { Star, Quote, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Archival Testimonial Section.
 * Manifests featured customer feedback in a high-fidelity minimalist grid.
 */
export function TestimonialSection() {
  const db = useFirestore();

  // Authoritative Query: Fetch only featured testimonials ordered by creation
  const testimonialsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'testimonials'),
      where('isFeatured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(6)
    );
  }, [db]);

  const { data: testimonials, isLoading } = useCollection(testimonialsQuery);

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black/10" />
      </div>
    );
  }

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <section className="py-24 bg-white border-t border-b">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="text-center mb-16 space-y-3">
          <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-muted-foreground">Feedback</span>
          <h2 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tighter">Verified Studio Experiences</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div 
              key={t.id} 
              className="bg-gray-50/50 p-8 sm:p-10 border rounded-none flex flex-col gap-6 shadow-sm hover:shadow-md transition-shadow duration-500 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border bg-white shrink-0">
                    {t.customerImageUrl ? (
                      <Image 
                        src={t.customerImageUrl} 
                        alt={t.customerName} 
                        fill 
                        className="object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold text-xs">
                        {t.customerName[0]}
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{t.customerName}</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={cn(
                            "h-2.5 w-2.5", 
                            s <= t.rating ? "fill-primary text-primary" : "text-gray-200"
                          )} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <Quote className="h-5 w-5 text-black/5 group-hover:text-primary/10 transition-colors" />
              </div>

              <p className="text-sm sm:text-base italic leading-relaxed text-gray-600 font-medium">
                "{t.quote}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
