'use client';

import React from 'react';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Image from 'next/image';

export function Footer() {
  const db = useFirestore();
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: config } = useDoc(storeConfigRef);

  const currentYear = new Date().getFullYear();
  const defaultCopyright = `© ${currentYear} ${config?.businessName || "FSLNO"}. ALL RIGHTS RESERVED.`;
  const defaultVersion = "ARCHIVE SYSTEM V1.0";

  return (
    <footer className="bg-primary text-primary-foreground py-8 mt-12">
      <div className="max-w-[1440px] mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <h2 className="text-3xl font-headline font-bold tracking-tighter uppercase">
            {config?.businessName || "FSLNO"}
          </h2>
          <div className="space-y-3">
            <p className="max-w-sm text-sm leading-relaxed uppercase tracking-tight opacity-80">
              {config?.footerDescription || "Redefining luxury through minimalist design and technical innovation."}
            </p>
            {config?.address && (
              <p className="text-[10px] uppercase font-bold tracking-widest whitespace-pre-wrap opacity-60">
                {config.address}
              </p>
            )}
            {config?.phone && (
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">
                {config.phone}
              </p>
            )}
          </div>
          <div className="flex gap-6">
            {config?.instagramUrl && (
              <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest font-bold border-b border-primary-foreground hover:opacity-70 transition-all pb-1">Instagram</a>
            )}
            {config?.tiktokUrl && (
              <a href={config.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest font-bold border-b border-primary-foreground hover:opacity-70 transition-all pb-1">TikTok</a>
            )}
            {config?.twitterUrl && (
              <a href={config.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest font-bold border-b border-primary-foreground hover:opacity-70 transition-all pb-1">Twitter</a>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-50">Support</h4>
          <ul className="flex flex-col gap-3 text-[11px] font-bold uppercase tracking-widest">
            {config?.footerSupportLinks?.length > 0 ? (
              config.footerSupportLinks.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link href={link.url} className="hover:opacity-70 transition-opacity">{link.label}</Link>
                </li>
              ))
            ) : (
              <>
                <li><Link href="#" className="hover:opacity-70 transition-opacity">Shipping & Returns</Link></li>
                <li><Link href="#" className="hover:opacity-70 transition-opacity">Size Guide</Link></li>
                <li><Link href="#" className="hover:opacity-70 transition-opacity">Contact Us</Link></li>
              </>
            )}
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-50">Legal</h4>
          <ul className="flex flex-col gap-3 text-[11px] font-bold uppercase tracking-widest">
            {config?.footerLegalLinks?.length > 0 ? (
              config.footerLegalLinks.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link href={link.url} className="hover:opacity-70 transition-opacity">{link.label}</Link>
                </li>
              ))
            ) : (
              <>
                <li><Link href="#" className="hover:opacity-70 transition-opacity">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:opacity-70 transition-opacity">Terms of Service</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
      
      <div className="max-w-[1440px] mx-auto px-4 border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col items-center gap-6 text-[9px] uppercase tracking-[0.2em] text-center">
        <div className="flex flex-col items-center justify-center gap-6 w-full">
          {config?.poweredByEnabled !== false && (
            <div className="flex flex-col items-center gap-1.5 group cursor-default">
              <span className="text-[7px] tracking-[0.5em] font-bold opacity-50">
                {config?.poweredByLabel || "Powered by"}
              </span>
              <div className="flex items-center gap-2">
                {config?.poweredByLogoUrl ? (
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <Image src={config.poweredByLogoUrl} alt="Studio Logo" fill className="object-contain" />
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-primary-foreground/10 border border-primary-foreground/20 rounded-sm flex items-center justify-center font-headline font-bold text-[10px]">
                    F
                  </div>
                )}
                <span className="text-[10px] font-headline font-bold tracking-tighter">
                  {config?.poweredByStudioName || "FSLNO STUDIO"}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <p>{config?.copyrightText || defaultCopyright}</p>
            <p className="opacity-50">{config?.systemVersion || defaultVersion}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}