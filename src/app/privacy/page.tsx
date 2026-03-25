'use client';

import React from 'react';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function PrivacyPage() {
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
            <ShieldCheck className="h-6 w-6" />
            <h1 className="text-3xl font-black uppercase tracking-tighter">Privacy Policy</h1>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last Updated: {updatedAt}</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-zinc-600">
          {isLoading ? (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className="h-3 w-3 rounded-full bg-primary/20 animate-pulse" />
              Syncing Secure Protocols...
            </div>
          ) : config?.privacyContent ? (
            <div className="text-xs leading-relaxed uppercase font-medium whitespace-pre-wrap">
              {config.privacyContent}
            </div>
          ) : (
            <>
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">1. Information Collection</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  We collect information you provide directly to us, such as when you create an account, make a purchase, or contact support.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">2. Use of Information</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  We use the collected information to process transactions, improve our services, and communicate with you regarding updates and promotions.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">3. Data Security</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or destruction.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">4. Third-Party Services</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  We may use third-party service providers (e.g., payment processors) to facilitate our services, who have their own privacy policies.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">5. Your Rights</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  You have the right to access, correct, or delete your personal information held by us at any time.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
