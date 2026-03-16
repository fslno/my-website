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
import { getLivePath } from '@/lib/deployment';

export function Footer() {
  const db = useFirestore();
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/store')) : null, [db]);
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
    <footer className="bg-primary text-primary-foreground py-12 mt-8 border-t border-primary-foreground/10">
      <div className="max-w-[1440px] mx-auto px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 items-start">
          
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-3xl font-headline font-bold tracking-tighter uppercase">
              {config?.businessName || "FSLNO"}
            </h2>
            <div className="space-y-4">
              <p className="max-w-sm text-xs leading-relaxed uppercase tracking-tight opacity-80">
                {config?.footerDescription || "High-end archive storefront. Shop curated apparel."}
              </p>
              <div className="space-y-4">
                {config?.address && (
                  <div className="flex items-start gap-3 group">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    <a 
                      href={mapsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] uppercase font-bold tracking-widest whitespace-pre-wrap leading-relaxed hover:opacity-60 transition-opacity underline decoration-primary-foreground/20 underline-offset-4"
                    >
                      Get Directions
                    </a>
                  </div>
                )}
                {config?.openingHours && (
                  <div className="flex items-start gap-3 group">
                    <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[10px] uppercase font-bold tracking-widest whitespace-pre-wrap leading-relaxed italic opacity-80">
                      {config.openingHours}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-5">
              {config?.instagramUrl && (
                <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" aria-label="Instagram">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {config?.tiktokUrl && (
                <a href={config.tiktokUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" aria-label="TikTok">
                  <Music className="h-4 w-4" />
                </a>
              )}
              {config?.twitterUrl && (
                <a href={config.twitterUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" aria-label="Twitter">
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {config?.facebookUrl && (
                <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" aria-label="Facebook">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {config?.pinterestUrl && (
                <a href={config.pinterestUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" aria-label="Pinterest">
                  <Globe className="h-4 w-4" />
                </a>
              )}
              {config?.youtubeUrl && (
                <a href={config.youtubeUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" aria-label="YouTube">
                  <Youtube className="h-4 w-4" />
                </a>
              )}
              {config?.linkedinUrl && (
                <a href={config.linkedinUrl} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity" aria-label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-[9px] uppercase tracking-[0.4em] font-bold opacity-40">Support</h4>
            <ul className="flex flex-col gap-3 text-[10px] font-bold uppercase tracking-widest">
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

          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-[9px] uppercase tracking-[0.4em] font-bold opacity-40">Legal</h4>
            <ul className="flex flex-col gap-3 text-[10px] font-bold uppercase tracking-widest">
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

          <div className="lg:col-span-4 space-y-6">
            {config?.newsletterEnabled !== false && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-[9px] uppercase tracking-[0.4em] font-bold opacity-40">Newsletter</h4>
                  <h3 className="text-lg md:text-xl font-headline font-bold uppercase tracking-tight leading-none">
                    Join
                  </h3>
                  <p className="text-[9px] uppercase tracking-widest font-bold opacity-60 leading-relaxed max-w-xs">
                    Access latest drops.
                  </p>
                </div>
                <form onSubmit={handleSubscribe} className="relative w-full">
                  <div className="flex flex-col gap-3">
                    <Input 
                      type="email" 
                      placeholder="EMAIL ADDRESS" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent border-primary-foreground/20 border-0 border-b rounded-none h-10 px-0 focus-visible:ring-0 placeholder:text-primary-foreground/30 font-bold uppercase tracking-widest text-[10px]" 
                    />
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || isSubscribed}
                      className="h-10 bg-accent text-accent-foreground w-full rounded-none font-bold uppercase tracking-widest text-[9px] hover:opacity-80 transition-all shadow-lg"
                    >
                      {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : isSubscribed ? <CheckCircle2 className="h-3 w-3" /> : "Subscribe"}
                    </Button>
                  </div>
                  {isSubscribed && (
                    <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-400 animate-in fade-in slide-in-from-top-1">
                      Subscribed.
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-8 text-[8px] uppercase tracking-[0.2em]">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="space-y-1 opacity-50 text-center md:text-left">
              <p>{config?.copyrightText || defaultCopyright}</p>
              <p className="text-[7px]">{config?.systemVersion || defaultVersion}</p>
            </div>
            {config?.poweredByEnabled !== false && (
              <div className="flex flex-col items-center md:items-start gap-1 group cursor-default">
                <span className="text-[6px] tracking-[0.5em] font-bold opacity-30">
                  {config?.poweredByLabel || "Powered by"}
                </span>
                <div className="flex items-center gap-2">
                  {config?.poweredByLogoUrl ? (
                    <div className="relative w-4 h-4 flex items-center justify-center">
                      <Image src={config.poweredByLogoUrl} alt="Studio Logo" fill className="object-contain" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 bg-primary-foreground/5 border border-primary-foreground/10 rounded-sm flex items-center justify-center font-headline font-bold text-[8px]">
                      F
                    </div>
                  )}
                  <span className="text-[9px] font-headline font-bold tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity">
                    {config?.poweredByStudioName || "FSLNO STUDIO"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 opacity-30 grayscale hover:opacity-100 transition-opacity duration-500">
            {config?.paymentIconsVisible?.map((icon: string) => (
              <div key={icon} className="h-3 w-auto flex items-center px-1.5 py-0.5 border border-primary-foreground/20 rounded-sm">
                <span className="text-[7px] font-bold tracking-[0.1em]">{icon}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
