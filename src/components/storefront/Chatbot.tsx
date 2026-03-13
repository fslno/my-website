'use client';

import React, { useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Phone, Mail, Instagram, Twitter, MessageSquare, X, Globe, Facebook, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * High-fidelity Floating Dispatch UI.
 * Manifests a radial staggered animation when active.
 * Each platform icon is Authoritatively differentiated by its brand-specific color.
 */
export function Chatbot() {
  const db = useFirestore();
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: theme } = useDoc(themeRef);

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: config } = useDoc(storeConfigRef);

  const [isOpen, setIsOpen] = useState(false);

  if (theme?.chatbotEnabled === false) return null;

  const phoneNumbers = config?.phoneNumbers || (config?.phone ? [{ label: 'Voice', value: config.phone }] : []);
  const emailAddresses = config?.emailAddresses || (config?.email ? [{ label: 'Dispatch', value: config.email }] : []);
  const socialChannels = config?.socialChannels || [];

  // Unified Manifest for staggered circles with Authoritative brand colors
  const contactMethods: any[] = [];
  
  phoneNumbers.forEach(p => contactMethods.push({ 
    type: 'phone', 
    label: p.label, 
    value: p.value, 
    icon: <Phone className="h-4 w-4" />, 
    href: `tel:${p.value}`,
    color: '#3B82F6' // Standard Blue for Voice
  }));
  
  emailAddresses.forEach(e => contactMethods.push({ 
    type: 'email', 
    label: e.label, 
    value: e.value, 
    icon: <Mail className="h-4 w-4" />, 
    href: `mailto:${e.value}`,
    color: '#8B5CF6' // Sophisticated Purple for Dispatch
  }));
  
  socialChannels.forEach(s => {
    let icon = <Globe className="h-4 w-4" />;
    let color = '#000000';
    
    if (s.platform === 'Instagram') {
      icon = <Instagram className="h-4 w-4" />;
      color = '#E1306C'; // Instagram Brand Identity
    } else if (s.platform === 'Twitter' || s.platform === 'X') {
      icon = <Twitter className="h-4 w-4" />;
      color = '#000000'; // X Brand Identity
    } else if (s.platform === 'TikTok') {
      icon = <MessageCircle className="h-4 w-4" />;
      color = '#FF0050'; // TikTok Brand Identity
    } else if (s.platform === 'Messenger') {
      icon = <Facebook className="h-4 w-4" />;
      color = '#0084FF'; // Meta Messenger Blue
    } else if (s.platform === 'WhatsApp') {
      icon = <MessageSquare className="h-4 w-4" />;
      color = '#25D366'; // WhatsApp Green
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

  return (
    <div 
      className="fixed bottom-8 z-[70]"
      style={{ 
        right: theme?.chatbotPosition === 'right' ? '2rem' : 'auto',
        left: theme?.chatbotPosition === 'left' ? '2rem' : 'auto'
      }}
    >
      {/* Pop-up Circles Container - Positioned Authoritatively above the button */}
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
            
            {/* Tooltip Label */}
            <div className={cn(
              "absolute px-3 py-1.5 bg-black text-white text-[8px] font-bold uppercase tracking-widest rounded-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl",
              theme?.chatbotPosition === 'right' ? "right-full mr-4" : "left-full ml-4"
            )}>
              {method.label}: {method.value}
            </div>
          </a>
        ))}
      </div>

      {/* Main Chat Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex items-center justify-center rounded-full shadow-2xl transition-all duration-500 ease-in-out hover:scale-110 active:scale-95 group z-10",
          isOpen ? 'rotate-90' : 'hover:animate-[pulsate_2s_infinite]'
        )}
        style={{ 
          backgroundColor: theme?.chatbotColor || '#1c4673',
          width: `${theme?.chatbotSize || 60}px`,
          height: `${theme?.chatbotSize || 60}px`
        }}
      >
        {isOpen ? (
          <X className="w-[50%] h-[50%] text-white" />
        ) : (
          <ChatIcon />
        )}
      </button>

      <style jsx global>{`
        @keyframes pulsate {
          0% { box-shadow: 0 0 0 0 rgba(0,0,0,0.4); }
          70% { box-shadow: 0 0 0 15px rgba(0,0,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
        }
      `}</style>
    </div>
  );
}