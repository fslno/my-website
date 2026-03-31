'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Phone, Mail, Instagram, Twitter, MessageSquare, X, Globe, Facebook, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLivePath } from '@/lib/deployment';

/**
 * High-fidelity Floating Dispatch UI.
 * Manifests a radial staggered animation when active.
 * Each platform icon is Authoritatively differentiated by its brand-specific color.
 */
export function Chatbot() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const db = useFirestore();
  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme, isLoading: themeLoading } = useDoc(themeRef);

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/store')) : null, [db]);
  const { data: config, isLoading: configLoading } = useDoc(storeConfigRef);

  const [isOpen, setIsOpen] = useState(false);

  // Authoritative Guard: Manifest by default unless explicitly disabled in theme config.
  if (!mounted || themeLoading) return null;
  if (theme && theme.chatbotEnabled === false) return null;
  if (pathname?.startsWith('/admin')) return null;

  const phoneNumbers = config?.phoneNumbers || (config?.phone ? [{ label: 'Voice', value: config.phone }] : []);
  // Authoritative Restriction: Strictly suppress config.email from Chatbot display as it is for internal logistics only.
  const emailAddresses = config?.emailAddresses || [];
  const socialChannels = config?.socialChannels || [];

  const contactMethods: any[] = [];
  
  // 01. Phone Paths
  phoneNumbers.forEach((p: any) => contactMethods.push({ 
    type: 'phone', 
    label: p.label, 
    value: p.value, 
    icon: <Phone className="h-4 w-4" />, 
    href: `tel:${p.value}`,
    color: '#3B82F6'
  }));
  
  // 02. WhatsApp Path - High-Fidelity API Link
  if (config?.whatsAppNumber) {
    contactMethods.push({
      type: 'social',
      label: 'WhatsApp',
      value: config.whatsAppNumber,
      icon: <MessageCircle className="h-4 w-4" />,
      href: `https://wa.me/${config.whatsAppNumber}`,
      color: '#25D366'
    });
  }

  // 03. Email Paths
  emailAddresses.forEach((e: any) => contactMethods.push({ 
    type: 'email', 
    label: e.label, 
    value: e.value, 
    icon: <Mail className="h-4 w-4" />, 
    href: `mailto:${e.value}`,
    color: '#8B5CF6'
  }));
  
  // 04. Social Channels
  socialChannels.forEach((s: any) => {
    if (s.platform === 'WhatsApp') return;

    let icon = <Globe className="h-4 w-4" />;
    let color = '#000000';
    
    if (s.platform === 'Instagram') {
      icon = <Instagram className="h-4 w-4" />;
      color = '#E1306C';
    } else if (s.platform === 'Twitter' || s.platform === 'X') {
      icon = <Twitter className="h-4 w-4" />;
      color = '#000000';
    } else if (s.platform === 'TikTok') {
      icon = <MessageCircle className="h-4 w-4" />;
      color = '#FF0050';
    } else if (s.platform === 'Messenger') {
      icon = <Facebook className="h-4 w-4" />;
      color = '#0084FF';
    }
    
    contactMethods.push({ type: 'social', label: s.platform, value: s.url, icon, href: s.url, color });
  });

  const ChatIcon = () => (
    <svg viewBox="0 0 100 100" className="w-[60%] h-[60%] fill-white">
      <rect x="15" y="20" width="70" height="50" rx="8" />
      <rect x="30" y="35" width="40" height="6" rx="3" fill="currentColor" className="text-gray-200 opacity-20" />
      <rect x="30" y="50" width="40" height="6" rx="3" fill="currentColor" className="text-gray-200 opacity-20" />
      <path d="M60 70 L70 85 L80 70 Z" />
    </svg>
  );

  const getAnimationClass = () => {
    switch (theme?.chatbotEffect) {
      case 'pulsate': return 'animate-[pulsate_2s_infinite]';
      case 'bounce': return 'animate-bounce';
      case 'breathe': return 'animate-pulse';
      case 'glow': return 'animate-[slow-glow_4s_infinite]';
      case 'float': return 'animate-[slow-float_6s_infinite]';
      case 'orbit': return 'animate-[slow-orbit_12s_linear_infinite]';
      case 'drift': return 'animate-[slow-drift_8s_infinite]';
      case 'expand': return 'animate-[slow-expand_5s_infinite]';
      default: return '';
    }
  };

  return (
    <div 
      className="fixed z-[70]"
      style={{ 
        bottom: `${theme?.chatbotGapBottom ?? 32}px`,
        right: theme?.chatbotPosition === 'right' ? `${theme?.chatbotGapSide ?? 32}px` : 'auto',
        left: theme?.chatbotPosition === 'left' ? `${theme?.chatbotGapSide ?? 32}px` : 'auto'
      }}
    >
      <div className="absolute bottom-full left-0 right-0 flex flex-col-reverse items-center gap-2 mb-3">
        {contactMethods.map((method, index) => (
          <a
            key={index}
            href={method.href}
            target={method.type === 'social' ? "_blank" : undefined}
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center rounded-full border border-black/5 shadow-lg text-white transition-all duration-500 ease-out hover:scale-110 group relative",
              isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-0 pointer-events-none"
            )}
            style={{ 
              backgroundColor: method.color,
              width: `${(theme?.chatbotSize || 60) * 0.75}px`,
              height: `${(theme?.chatbotSize || 60) * 0.75}px`,
              transitionDelay: `${index * 40}ms`
            }}
          >
            {method.icon}
            <div className={cn(
              "absolute px-3 py-1.5 bg-black text-white text-[8px] font-bold uppercase tracking-widest rounded-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl",
              theme?.chatbotPosition === 'right' ? "right-full mr-4" : "left-full ml-4"
            )}>
              {method.label}: {method.value}
            </div>
          </a>
        ))}
      </div>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex items-center justify-center rounded-full shadow-2xl transition-all duration-500 ease-in-out hover:scale-110 active:scale-95 group z-10",
          isOpen ? 'rotate-90' : getAnimationClass()
        )}
        style={{ 
          backgroundColor: theme?.chatbotColor || '#000000',
          width: `${theme?.chatbotSize || 60}px`,
          height: `${theme?.chatbotSize || 60}px`,
          animationDuration: !isOpen && theme?.chatbotDuration ? `${theme.chatbotDuration}s` : undefined
        }}
      >
        {isOpen ? (
          <X className="w-[50%] h-[50%] text-white" />
        ) : (
          <ChatIcon />
        )}
      </button>
    </div>
  );
}
