'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Gavel, FileText, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function TermsPage() {
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
            <Gavel className="h-6 w-6" />
            <h1 className="text-3xl font-black uppercase tracking-tighter">Terms & Conditions</h1>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last Updated: {updatedAt}</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-zinc-600">
          {isLoading ? (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className="h-3 w-3 rounded-full bg-primary/20 animate-pulse" />
              Fetching Archive Protocols...
            </div>
          ) : config?.termsContent ? (
            <div className="text-xs leading-relaxed uppercase font-medium whitespace-pre-wrap">
              {config.termsContent}
            </div>
          ) : (
            <>
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">1. Agreement to Terms</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  By accessing or using Feiselino (FSLNO), you agree to be bound by these Terms and Conditions. If you do not agree, do not use the service.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">2. Intellectual Property</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  All content, logos, designs, and data presented on this website are the exclusive property of Feiselino (FSLNO) and are protected by international copyright laws.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">3. User Conduct</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  Users are prohibited from using this site for any unlawful purpose, including but not limited to fraud, harassment, or data mining.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">4. Limitation of Liability</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  Feiselino (FSLNO) shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary border-b pb-2">5. Governing Law</h2>
                <p className="text-xs leading-relaxed uppercase font-medium">
                  These terms are governed by the laws of Ontario, Canada, without regard to conflict of law principles.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
