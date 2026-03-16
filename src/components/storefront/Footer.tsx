'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Image from 'next/image';
import { 
  Mail, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  ExternalLink, 
  Instagram, 
  Twitter, 
  Facebook, 
  Youtube, 
  Linkedin, 
  Music, 
  Globe,
  MapPin,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Footer() {
  const db = useFirestore();
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: config } = useDoc(storeConfigRef);

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubmittingDone] = useState(false);

  const currentYear = new Date().getFullYear();
  const defaultCopyright = `© ${currentYear} ${config?.businessName || "FSLNO"}. ALL RIGHTS RESERVED.`;
  const defaultVersion = "ARCHIVE SYSTEM V1.0";

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmittingDone(true);
      setEmail('');
    }, 1000);
  };

  const mapsUrl = config?.googleMapsUrl || (config?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address)}` : '#');

  return (
    <footer className="bg-primary text-primary-foreground py-16 mt-10 border-t border-primary-foreground/10">
      <div className="max-w-[1440px] mx-auto px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          
          <div className="lg:col-span-4 space-y-8">
            <h2 className="text-4xl font-headline font-bold tracking-tighter uppercase">
              {config?.businessName || "FSLNO"}
            </h2>
            <div className="space-y-6">
              <p className="max-w-sm text-sm leading-relaxed uppercase tracking-tight opacity-80">
                {config?.footerDescription || "High-end archive storefront. Shop curated apparel."}
              </p>
              <div className="space-y-6">
                {config?.address && (
                  <div className="flex items-start gap-3 group">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    <a 
                      href={mapsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[11px] uppercase font-bold tracking-widest whitespace-pre-wrap leading-relaxed hover:opacity-60 transition-opacity underline decoration-primary-foreground/20 underline-offset-4"
                    >
                      {config.address}
                    </a>
                  </div>
                )}
                {config?.openingHours && (
                  <div className="flex items-start gap-3 group">
                    <Clock className="h-4 w-4 shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[11px] uppercase font-bold tracking-widest whitespace-pre-wrap leading-relaxed italic opacity-80">
                      {config.openingHours}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              {config?.instagramUrl && (
                <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {config?.tiktokUrl && (
                <a href={config.tiktokUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" aria-label="TikTok">
                  <Music className="h-5 w-5" />
                </a>
              )}
              {config?.twitterUrl && (
                <a href={config.twitterUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" aria-label="Twitter">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {config?.facebookUrl && (
                <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {config?.pinterestUrl && (
                <a href={config.pinterestUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" aria-label="Pinterest">
                  <Globe className="h-5 w-5" />
                </a>
              )}
              {config?.youtubeUrl && (
                <a href={config.youtubeUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" aria-label="YouTube">
                  <Youtube className="h-5 w-5" />
                </a>
              )}
              {config?.linkedinUrl && (
                <a href={config.linkedinUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" aria-label="LinkedIn">
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Support</h4>
            <ul className="flex flex-col gap-4 text-[11px] font-bold uppercase tracking-widest">
              {config?.footerSupportLinks?.length > 0 ? (
                config.footerSupportLinks.map((link: any, idx: number) => (
                  <li key={idx}>
                    <Link href={link.url} className="hover:opacity-60 transition-opacity">{link.label}</Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="#" className="hover:opacity-60 transition-opacity">Shipping & Returns</Link></li>
                  <li><Link href="#" className="hover:opacity-60 transition-opacity">Size Guide</Link></li>
                  <li><Link href="#" className="hover:opacity-60 transition-opacity">Contact Us</Link></li>
                </>
              )}
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Legal</h4>
            <ul className="flex flex-col gap-4 text-[11px] font-bold uppercase tracking-widest">
              {config?.footerLegalLinks?.length > 0 ? (
                config.footerLegalLinks.map((link: any, idx: number) => (
                  <li key={idx}>
                    <Link href={link.url} className="hover:opacity-60 transition-opacity">{link.label}</Link>
                  </li>
                ))
              ) : (
                <>
                  <li><Link href="#" className="hover:opacity-60 transition-opacity">Privacy Policy</Link></li>
                  <li><Link href="#" className="hover:opacity-60 transition-opacity">Terms of Service</Link></li>
                </>
              )}
            </ul>
          </div>

          <div className="lg:col-span-4 space-y-8">
            {config?.newsletterEnabled !== false && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Newsletter</h4>
                  <h3 className="text-xl md:text-2xl font-headline font-bold uppercase tracking-tight leading-none">
                    Join
                  </h3>
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 leading-relaxed max-w-xs">
                    Access latest drops.
                  </p>
                </div>
                <form onSubmit={handleSubscribe} className="relative w-full">
                  <div className="flex flex-col gap-4">
                    <Input 
                      type="email" 
                      placeholder="EMAIL ADDRESS" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent border-primary-foreground/20 border-0 border-b rounded-none h-12 px-0 focus-visible:ring-0 placeholder:text-primary-foreground/30 font-bold uppercase tracking-widest text-xs" 
                    />
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || isSubscribed}
                      className="h-12 bg-accent text-accent-foreground w-full rounded-none font-bold uppercase tracking-widest text-[10px] hover:opacity-80 transition-all shadow-lg"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isSubscribed ? <CheckCircle2 className="h-4 w-4" /> : "Subscribe"}
                    </Button>
                  </div>
                  {isSubscribed && (
                    <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400 animate-in fade-in slide-in-from-top-1">
                      Subscribed.
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/10 mt-16 pt-10 flex flex-col md:flex-row justify-between items-center gap-12 text-[9px] uppercase tracking-[0.2em]">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="space-y-1 opacity-50 text-center md:text-left">
              <p>{config?.copyrightText || defaultCopyright}</p>
              <p className="text-[8px]">{config?.systemVersion || defaultVersion}</p>
            </div>
            {config?.poweredByEnabled !== false && (
              <div className="flex flex-col items-center md:items-start gap-1.5 group cursor-default">
                <span className="text-[7px] tracking-[0.5em] font-bold opacity-30">
                  {config?.poweredByLabel || "Powered by"}
                </span>
                <div className="flex items-center gap-2">
                  {config?.poweredByLogoUrl ? (
                    <div className="relative w-5 h-5 flex items-center justify-center">
                      <Image src={config.poweredByLogoUrl} alt="Studio Logo" fill className="object-contain" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 bg-primary-foreground/5 border border-primary-foreground/10 rounded-sm flex items-center justify-center font-headline font-bold text-[10px]">
                      F
                    </div>
                  )}
                  <span className="text-[10px] font-headline font-bold tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity">
                    {config?.poweredByStudioName || "FSLNO STUDIO"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-6 opacity-30 grayscale hover:opacity-100 transition-opacity duration-500">
            {config?.paymentIconsVisible?.map((icon: string) => (
              <div key={icon} className="h-4 w-auto flex items-center px-2 py-1 border border-primary-foreground/20 rounded-sm">
                <span className="text-[8px] font-bold tracking-[0.1em]">{icon}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
