'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
import { cn } from '@/lib/utils';
import { queueNotification } from '@/lib/notifications';

/**
 * High-fidelity responsive footer — all content controlled from Admin → Footer.
 */
export function Footer({ initialTheme }: { initialTheme?: any }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  const db = useFirestore();

  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme } = useDoc(themeRef, { initialData: initialTheme });

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/store')) : null, [db]);
  const { data: config } = useDoc(storeConfigRef);

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubmittingDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentYear, setCurrentYear] = useState(2025);

  useEffect(() => {
    setMounted(true);
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !db) return;
    setIsSubmitting(true);
    try {
      // 1. Persist to subscribers database
      await addDoc(collection(db, 'subscribers'), {
        email,
        timestamp: serverTimestamp(),
        source: 'footer',
        status: 'active'
      });

      // 2. Queue Welcome Email Transmission using template system
      await queueNotification(db, 'newsletterWelcome', email, {
        business_name: config?.businessName || ''
      }, config?.staffEmails);

      setIsSubmittingDone(true);
      setEmail('');
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Authoritative URL Resolution logic for absolute paths
  const ensureAbsoluteUrl = (url: string) => {
    if (!url || url === '#') return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  const mapsUrl = ensureAbsoluteUrl(config?.googleMapsUrl) || (config?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address)}` : '#');
  const bgColor = config?.footerBackgroundColor || '#f0f0f0';

  // Contrast helper for text color
  const getContrastColor = (hex: string) => {
    if (!hex || hex === 'transparent') return 'text-black';
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'text-black' : 'text-white';
  };

  const textColorClass = getContrastColor(bgColor);

  // Build social links from admin-saved individual fields
  const socialLinks = [
    { platform: 'Instagram', url: config?.instagramUrl, Icon: Instagram },
    { platform: 'TikTok',    url: config?.tiktokUrl,    Icon: Music },
    { platform: 'Twitter',   url: config?.twitterUrl,   Icon: Twitter },
    { platform: 'Facebook',  url: config?.facebookUrl,  Icon: Facebook },
    { platform: 'YouTube',   url: config?.youtubeUrl,   Icon: Youtube },
    { platform: 'Pinterest', url: config?.pinterestUrl, Icon: Globe },
    { platform: 'LinkedIn',  url: config?.linkedinUrl,  Icon: Linkedin },
    // Also support socialChannels array from settings page (legacy)
    ...(config?.socialChannels?.map((s: any) => {
      let Icon = Globe;
      if (s.platform === 'Instagram') Icon = Instagram;
      else if (s.platform === 'Twitter' || s.platform === 'X') Icon = Twitter;
      else if (s.platform === 'Facebook') Icon = Facebook;
      else if (s.platform === 'YouTube') Icon = Youtube;
      else if (s.platform === 'LinkedIn') Icon = Linkedin;
      else if (s.platform === 'TikTok') Icon = Music;
      return { platform: s.platform, url: s.url, Icon };
    }) || []),
  ].filter(s => !!s.url);

  const newsletterEnabled = config?.newsletterEnabled ?? true;
  const newsletterHeadline = config?.newsletterHeadline || 'JOIN THE COMMUNITY';
  const newsletterSubtext = config?.newsletterSubtext || 'Get our latest updates.';
  const copyrightText = config?.copyrightText || `© ${currentYear} ${config?.businessName || ''}. ALL RIGHTS RESERVED.`;
  const poweredByEnabled = config?.poweredByEnabled ?? false;
  const poweredByLabel = config?.poweredByLabel || 'Powered by';
  const poweredByName = config?.poweredByStudioName || '';
  const poweredByLogo = config?.poweredByLogoUrl || '';

  if (!mounted) return null;

  return (
    <footer 
      className={cn(textColorClass, "py-16 border-t border-black/5")} 
      style={{ backgroundColor: bgColor }}
      suppressHydrationWarning
    >
      <div className="max-w-[1440px] mx-auto px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-start">
          
          {/* Brand column */}
          <div className="space-y-8">
            <h2 className="text-4xl font-headline font-bold tracking-tighter uppercase min-h-[1em]">
              {config?.businessName || " "}
            </h2>
            <div className="space-y-6">
              <p className="max-w-xs text-xs font-bold uppercase tracking-widest opacity-60 leading-relaxed min-h-[2em]">
                {config?.footerDescription || " "}
              </p>
              
              <div className="space-y-4">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                  <MapPin className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] underline decoration-white/20 underline-offset-4">
                    {config?.getDirectionsLabel || "Get Directions"}
                  </span>
                </a>
                {config?.openingHours && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 opacity-40 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">Store Hours</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest whitespace-pre-wrap leading-relaxed italic">
                        {config.openingHours}
                      </p>
                    </div>
                  </div>
                )}

                {/* Social icons */}
                {socialLinks.length > 0 && (
                  <div className="flex items-center gap-5 pt-4">
                    {socialLinks.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-40 hover:opacity-100 transition-opacity"
                        aria-label={s.platform}
                      >
                        <s.Icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Support links */}
          <div className="space-y-6 flex flex-col">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Help</h4>
            <ul className="flex flex-col gap-4 text-[11px] font-bold uppercase tracking-widest">
              {(config?.footerSupportLinks?.length > 0)
                ? config.footerSupportLinks.map((link: any, idx: number) => (
                    <li key={idx}><Link href={link.url} className="hover:opacity-60 transition-opacity">{link.label}</Link></li>
                  ))
                : (
                  <>
                    <li><Link href="/shipping" className="hover:opacity-60 transition-opacity">Shipping</Link></li>
                    <li><Link href="/returns" className="hover:opacity-60 transition-opacity">Returns</Link></li>
                  </>
                )}
            </ul>
          </div>

          {/* Legal links */}
          <div className="space-y-6 flex flex-col">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Privacy & Terms</h4>
            <ul className="flex flex-col gap-4 text-[11px] font-bold uppercase tracking-widest">
              {(config?.footerLegalLinks?.length > 0)
                ? config.footerLegalLinks.map((link: any, idx: number) => (
                    <li key={idx}><Link href={link.url} className="hover:opacity-60 transition-opacity">{link.label}</Link></li>
                  ))
                : (
                  <>
                    <li><Link href="/terms" className="hover:opacity-60 transition-opacity">Terms of Service</Link></li>
                    <li><Link href="/privacy" className="hover:opacity-60 transition-opacity">Privacy Policy</Link></li>
                  </>
                )}
            </ul>
          </div>

          {/* Newsletter */}
          {newsletterEnabled && (
            <div className="md:ml-auto w-full max-w-sm">
              <div className="relative overflow-hidden flex flex-col gap-8">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-current/[0.02] rounded-full -mr-12 -mt-12" />
                
                <div className="space-y-4 relative z-10">
                  <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30">Newsletter</h4>
                  <div className="space-y-1">
                    <h3 className="text-3xl font-headline font-bold uppercase tracking-tight leading-none">
                      {newsletterHeadline}
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">
                      {newsletterSubtext}
                    </p>
                  </div>
                </div>
                
                <form onSubmit={handleSubscribe} className="space-y-6 w-full relative z-10">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-[0.1em] font-bold opacity-40">Email Address</Label>
                    <Input 
                      type="email" 
                      placeholder="ENTER YOUR EMAIL..." 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-current/[0.05] border-0 rounded-none h-12 px-4 focus-visible:ring-1 focus-visible:ring-current/20 placeholder:text-current/20 font-bold uppercase text-xs" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || isSubscribed}
                    className={cn(
                      "h-14 w-full rounded-none font-bold uppercase tracking-[0.3em] text-[10px] transition-all active:scale-[0.98] shadow-lg",
                      textColorClass === 'text-black' ? 'bg-black text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-100'
                    )}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isSubscribed ? <CheckCircle2 className="h-4 w-4" /> : "Subscribe"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom bar */}
        <div className="border-t border-primary-foreground/10 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-40">
              {copyrightText}
            </p>
            {poweredByEnabled && (
              <div className="flex items-center gap-2 opacity-30 hover:opacity-80 transition-opacity">
                {poweredByLogo && (
                  <div className="relative w-4 h-4">
                    <Image src={poweredByLogo} alt={poweredByName} fill sizes="16px" className="object-contain" />
                  </div>
                )}
                <span className="text-[8px] font-bold uppercase tracking-widest">{poweredByLabel} {poweredByName}</span>
              </div>
            )}
          </div>

          {/* Payment icons */}
          {config?.paymentIconsVisible?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-6 opacity-30 grayscale hover:opacity-100 transition-all duration-700">
              {config.paymentIconsVisible.map((icon: string) => (
                <span key={icon} className="text-[8px] font-bold uppercase tracking-[0.2em]">{icon}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
