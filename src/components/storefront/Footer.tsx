'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  Mail, 
  Loader2, 
  CheckCircle2, 
  MapPin,
  Clock,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Linkedin,
  Music,
  Globe
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getLivePath } from '@/lib/deployment';

/**
 * Dynamic Storefront Footer.
 * Authoritatively driven by the Admin Footer Editor manifest.
 * Optimized for Direct-Entry velocity.
 */
export function Footer() {
  const db = useFirestore();
  const storeConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/store')) : null, [db]);
  const { data: config } = useDoc(storeConfigRef);

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setMounted(true);
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    // Simulation of subscription ingest
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubscribed(true);
      setEmail('');
    }, 1000);
  };

  const mapsUrl = config?.googleMapsUrl || (config?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address)}` : '#');

  // Direct-Entry Protocol: Ensure zero trace until mounted and synchronized.
  if (!mounted || !config) return null;

  return (
    <footer className="bg-primary text-primary-foreground py-16 mt-0 border-t border-primary-foreground/10">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-start text-left">
          
          {/* Column 01: Brand Identity */}
          <div className="space-y-8 flex flex-col items-start">
            <h2 className="text-4xl font-headline font-bold tracking-tighter uppercase">
              {config.businessName || "FSLNO"}
            </h2>
            <div className="space-y-6">
              <p className="max-w-xs text-xs font-bold uppercase tracking-widest opacity-60 leading-relaxed text-left">
                {config.footerDescription || "Built for Speed. Made for Victory."}
              </p>
              
              <div className="space-y-4 flex flex-col items-start">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                  <MapPin className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] underline decoration-white/20 underline-offset-4">Get Directions</span>
                </a>
                
                {config.openingHours && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 opacity-40 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">Store Hours</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest whitespace-pre-wrap leading-relaxed italic text-left">
                        {config.openingHours}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-5 pt-4">
                  {config.socialChannels?.map((s: any, idx: number) => {
                    let Icon = Globe;
                    if (s.platform === 'Instagram') Icon = Instagram;
                    else if (s.platform === 'Twitter' || s.platform === 'X') Icon = Twitter;
                    else if (s.platform === 'Facebook') Icon = Facebook;
                    else if (s.platform === 'YouTube') Icon = Youtube;
                    else if (s.platform === 'Linkedin') Icon = Linkedin;
                    else if (s.platform === 'TikTok') Icon = Music;

                    return (
                      <a 
                        key={idx} 
                        href={s.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="opacity-40 hover:opacity-100 transition-opacity"
                        aria-label={s.platform}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Column 02: Support Manifest */}
          <div className="space-y-6 flex flex-col items-start">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Support</h4>
            <ul className="flex flex-col gap-4 text-[11px] font-bold uppercase tracking-widest text-left">
              {config.footerSupportLinks?.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link href={link.url} className="hover:opacity-60 transition-opacity">
                    {link.label}
                  </Link>
                </li>
              ))}
              {(!config.footerSupportLinks || config.footerSupportLinks.length === 0) && (
                <li className="opacity-20 italic">No links configured</li>
              )}
            </ul>
          </div>

          {/* Column 03: Legal Manifest */}
          <div className="space-y-6 flex flex-col items-start">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Legal</h4>
            <ul className="flex flex-col gap-4 text-[11px] font-bold uppercase tracking-widest text-left">
              {config.footerLegalLinks?.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link href={link.url} className="hover:opacity-60 transition-opacity">
                    {link.label}
                  </Link>
                </li>
              ))}
              {(!config.footerLegalLinks || config.footerLegalLinks.length === 0) && (
                <li className="opacity-20 italic">No links configured</li>
              )}
            </ul>
          </div>

          {/* Column 04: Newsletter Dispatch */}
          <div className="space-y-8 flex flex-col items-start">
            {config.newsletterEnabled !== false && (
              <>
                <div className="space-y-4 flex flex-col items-start">
                  <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Newsletter</h4>
                  <div className="space-y-1">
                    <h3 className="text-3xl font-headline font-bold uppercase tracking-tight leading-none text-left">
                      {config.newsletterHeadline || "Join Us"}
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 text-left">
                      {config.newsletterSubtext || "Get our latest updates."}
                    </p>
                  </div>
                </div>
                
                <form onSubmit={handleSubscribe} className="space-y-6 w-full max-w-sm text-left">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.1em] font-bold opacity-60">Email Address</Label>
                    <Input 
                      type="email" 
                      placeholder="" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent border-0 border-b border-primary-foreground/20 rounded-none h-12 px-0 focus-visible:ring-0 placeholder:text-primary-foreground/20 font-bold uppercase text-xs" 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || isSubscribed}
                    className="h-14 bg-white text-black w-full rounded-none font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-gray-200 transition-all shadow-xl"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isSubscribed ? <CheckCircle2 className="h-4 w-4" /> : "Subscribe"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
        
        {/* Footer Meta & Logistics */}
        <div className="border-t border-primary-foreground/10 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 text-left">
              {config.copyrightText || `© ${currentYear} ${config.businessName || "FSLNO"}. ALL RIGHTS RESERVED.`}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 opacity-30 grayscale hover:opacity-100 transition-all duration-700">
            {config.paymentIconsVisible?.map((icon: string) => (
              <span key={icon} className="text-[8px] font-bold uppercase tracking-[0.2em]">{icon}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
