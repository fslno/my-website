'use client';

import React from 'react';
import { ChevronLeft, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function ShippingPage() {
  const router = useRouter();

  const db = useFirestore();
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: config, isLoading } = useDoc(storeConfigRef);

  const updatedAt = config?.updatedAt ? new Date(config.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'March 24, 2026';

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 sm:py-32">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all duration-300 mb-12 group w-fit"
      >
        <ChevronLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      <div className="space-y-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <Truck className="h-6 w-6" />
            <h1 className="text-3xl font-black uppercase tracking-tighter">Shipping Policy</h1>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last Updated: {updatedAt}</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-zinc-600">
          {isLoading ? (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className="h-3 w-3 rounded-full bg-primary/20 animate-pulse" />
              Syncing Logistics Protocols...
            </div>
          ) : config?.shippingContent ? (
            <div className="text-xs leading-relaxed uppercase font-medium whitespace-pre-wrap">
              {config.shippingContent}
            </div>
          ) : (
            <>
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">1. Processing Times</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  Orders are typically processed within 2-4 business days. Custom items may require additional time as they are made to order.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">2. Shipping Rates</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  Shipping rates are calculated at checkout based on package weight and destination. We offer free shipping on orders over a certain threshold as specified on our site.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">3. International Shipping</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  We currently ship to Canada and the United States. International customers are responsible for any customs duties or taxes incurred.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">4. Tracking</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  Once your order has shipped, you will receive a confirmation email with tracking information.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
