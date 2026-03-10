'use client';

import React from 'react';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function Footer() {
  const db = useFirestore();
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: storeConfig } = useDoc(storeConfigRef);

  return (
    <footer className="bg-black text-white py-24 mt-20">
      <div className="max-w-[1440px] mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-16">
        <div className="col-span-1 md:col-span-2 space-y-8">
          <h2 className="text-4xl font-headline font-bold tracking-tighter uppercase">
            {storeConfig?.businessName || "FSLNO"}
          </h2>
          <div className="space-y-4">
            <p className="text-white/40 max-w-sm text-sm leading-relaxed uppercase tracking-tight">
              Redefining luxury through minimalist design and technical innovation.
            </p>
            {storeConfig?.address && (
              <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest whitespace-pre-wrap">
                {storeConfig.address}
              </p>
            )}
            {storeConfig?.phone && (
              <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest">
                {storeConfig.phone}
              </p>
            )}
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] uppercase tracking-widest font-bold border-b border-white/10 hover:border-white transition-all pb-1">Instagram</a>
            <a href="#" className="text-[10px] uppercase tracking-widest font-bold border-b border-white/10 hover:border-white transition-all pb-1">TikTok</a>
          </div>
        </div>
        <div className="space-y-8">
          <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Support</h4>
          <ul className="flex flex-col gap-4 text-[11px] font-bold uppercase tracking-widest text-white/60">
            <li><a href="#" className="hover:text-white transition-colors">Shipping & Returns</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Size Guide</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
          </ul>
        </div>
        <div className="space-y-8">
          <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Legal</h4>
          <ul className="flex flex-col gap-4 text-[11px] font-bold uppercase tracking-widest text-white/60">
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-4 border-t border-white/5 mt-24 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] uppercase tracking-[0.2em] text-white/20">
        <p>© {new Date().getFullYear()} {storeConfig?.businessName || "FSLNO"}. All Rights Reserved.</p>
        <p>Archive System V1.0</p>
      </div>
    </footer>
  );
}
