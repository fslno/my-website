'use client';

import React from 'react';
import { ChevronLeft, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function ReturnsPage() {
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
            <RefreshCcw className="h-6 w-6" />
            <h1 className="text-3xl font-black uppercase tracking-tighter">Return Policy</h1>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last Updated: {updatedAt}</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-zinc-600">
          {isLoading ? (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className="h-3 w-3 rounded-full bg-primary/20 animate-pulse" />
              Fetching Archival Protocols...
            </div>
          ) : config?.returnsContent ? (
            <div className="text-xs leading-relaxed uppercase font-medium whitespace-pre-wrap">
              {config.returnsContent}
            </div>
          ) : (
            <>
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">1. All Sales Final</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  Given the custom nature of our products, all sales at Feiselino (FSLNO) are final. We do not offer returns or exchanges for sizing or preference.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">2. Damaged or Defective Items</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  If an item is received damaged or defective, please contact us within 48 hours of delivery with photographic evidence.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">3. Shipping Errors</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  In the event of a shipping error on our part, we will provide a prepaid return label and issue a full refund or replacement.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">4. Cancellations</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  Orders can only be cancelled within 1 hour of placement before they move into production/processing.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
