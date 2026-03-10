
'use client';

import React from 'react';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function Footer() {
  const db = useFirestore();
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: config } = useDoc(storeConfigRef);

  const currentYear = new Date().getFullYear();
  const defaultCopyright = `© ${currentYear} ${config?.businessName || "FSLNO"}. ALL RIGHTS RESERVED.`;
  const defaultVersion = "ARCHIVE SYSTEM V1.0";

  return (
    <footer className="bg-black text-white py-24 mt-20">
      <div className="max-w-[1440px] mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-16">
        <div className="col-span-1 md:col-span-2 space-y-8">
          <h2 className="text-4xl font-headline font-bold tracking-tighter uppercase">
            {config?.businessName || "FSLNO"}
          </h2>
          <div className="space-y-4">
            <p className="text-white/40 max-w-sm text-sm leading-relaxed uppercase tracking-tight">
              {config?.footerDescription || "Redefining luxury through minimalist design and technical innovation."}
            </p>
            {config?.address && (
              <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest whitespace-pre-wrap">
                {config.address}
              </p>
            )}
            {config?.phone && (
              <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest">
                {config.phone}
              </p>
            )}
          </div>
          <div className="flex gap-8">
            {config?.instagramUrl && (
              <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest font-bold border-b border-white/10 hover:border-white transition-all pb-1">Instagram</a>
            )}
            {config?.tiktokUrl && (
              <a href={config.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest font-bold border-b border-white/10 hover:border-white transition-all pb-1">TikTok</a>
            )}
            {config?.twitterUrl && (
              <a href={config.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest font-bold border-b border-white/10 hover:border-white transition-all pb-1">Twitter</a>
            )}
          </div>
        </div>
        
        <div className="space-y-8">
          <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Support</h4>
          <ul className="flex flex-col gap-4 text-[11px] font-bold uppercase tracking-widest text-white/60">
            {config?.footerSupportLinks?.length > 0 ? (
              config.footerSupportLinks.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link href={link.url} className="hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))
            ) : (
              <>
                <li><Link href="#" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Size Guide</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
              </>
            )}
          </ul>
        </div>

        <div className="space-y-8">
          <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Legal</h4>
          <ul className="flex flex-col gap-4 text-[11px] font-bold uppercase tracking-widest text-white/60">
            {config?.footerLegalLinks?.length > 0 ? (
              config.footerLegalLinks.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link href={link.url} className="hover:text-white transition-colors">{link.label}</Link>
                </li>
              ))
            ) : (
              <>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
      
      <div className="max-w-[1440px] mx-auto px-4 border-t border-white/5 mt-24 pt-12 flex flex-col items-center gap-10 text-[9px] uppercase tracking-[0.2em] text-white/20 text-center">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 w-full">
          <p className="order-2 md:order-1">{config?.copyrightText || defaultCopyright}</p>
          
          <div className="order-1 md:order-2 flex flex-col items-center gap-2 group cursor-default">
            <span className="text-[7px] tracking-[0.5em] font-bold text-white/10 group-hover:text-white/30 transition-colors duration-500">Powered by</span>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-white/5 group-hover:bg-white/10 border border-white/5 rounded-sm flex items-center justify-center font-headline font-bold text-white/40 group-hover:text-white/80 text-[11px] transition-all duration-500">
                F
              </div>
              <span className="text-[11px] font-headline font-bold tracking-tighter text-white/40 group-hover:text-white/80 transition-colors duration-500">FSLNO STUDIO</span>
            </div>
          </div>

          <p className="order-3 md:order-3">{config?.systemVersion || defaultVersion}</p>
        </div>
      </div>
    </footer>
  );
}
