'use client';

import React, { useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Phone, Mail, Instagram, Twitter, MessageSquare, X, Globe, Facebook } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  // Add legacy socials if they aren't in the new array to prevent breaking
  const allSocials = [...socialChannels];
  if (config?.instagramUrl && !allSocials.find(s => s.platform === 'Instagram')) {
    allSocials.push({ platform: 'Instagram', url: config.instagramUrl });
  }
  if (config?.tiktokUrl && !allSocials.find(s => s.platform === 'TikTok')) {
    allSocials.push({ platform: 'TikTok', url: config.tiktokUrl });
  }
  if (config?.twitterUrl && !allSocials.find(s => s.platform === 'Twitter')) {
    allSocials.push({ platform: 'Twitter', url: config.twitterUrl });
  }

  const ChatIcon = () => (
    <svg viewBox="0 0 100 100" className="w-[60%] h-[60%] fill-white">
      <rect x="15" y="20" width="70" height="50" rx="8" />
      <rect x="30" y="35" width="40" height="6" rx="3" fill="currentColor" className="text-gray-200 opacity-20" />
      <rect x="30" y="50" width="40" height="6" rx="3" fill="currentColor" className="text-gray-200 opacity-20" />
      <path d="M60 70 L70 85 L80 70 Z" />
    </svg>
  );

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram': return <Instagram className="h-4 w-4" />;
      case 'Twitter': return <Twitter className="h-4 w-4" />;
      case 'TikTok': return <MessageSquare className="h-4 w-4" />;
      case 'Messenger': return <Facebook className="h-4 w-4" />;
      case 'WhatsApp': return <MessageCircle className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const MessageCircle = ({ className }: { className?: string }) => (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.38 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.38 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );

  return (
    <div 
      className="fixed bottom-8 z-[70] transition-all duration-500 animate-in fade-in slide-in-from-bottom-10"
      style={{ 
        right: theme?.chatbotPosition === 'right' ? '2rem' : 'auto',
        left: theme?.chatbotPosition === 'left' ? '2rem' : 'auto'
      }}
    >
      {/* Contact Panel */}
      {isOpen && (
        <div className={cn(
          "absolute bottom-20 w-80 bg-white border border-black/10 shadow-2xl rounded-sm p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-300",
          theme?.chatbotPosition === 'right' ? 'right-0' : 'left-0'
        )}>
          <div className="flex justify-between items-center p-6 bg-gray-50 border-b">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Contact Studio</h3>
              <p className="text-[9px] uppercase font-bold text-muted-foreground mt-1 tracking-tighter">Support Dispatch Active</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-primary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <ScrollArea className="max-h-[400px]">
            <div className="p-6 space-y-8">
              {phoneNumbers.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[9px] font-bold uppercase text-gray-400 tracking-[0.2em]">Voice Channels</p>
                  <div className="grid gap-4">
                    {phoneNumbers.map((p, i) => (
                      <a key={i} href={`tel:${p.value}`} className="flex items-center gap-4 group">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-primary group-hover:text-white transition-all">
                          <Phone className="h-3.5 w-3.5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">{p.label || 'Voice'}</p>
                          <p className="text-[10px] font-bold text-primary uppercase">{p.value}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {emailAddresses.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[9px] font-bold uppercase text-gray-400 tracking-[0.2em]">Digital Dispatch</p>
                  <div className="grid gap-4">
                    {emailAddresses.map((e, i) => (
                      <a key={i} href={`mailto:${e.value}`} className="flex items-center gap-4 group">
                        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-primary group-hover:text-white transition-all">
                          <Mail className="h-3.5 w-3.5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">{e.label || 'Dispatch'}</p>
                          <p className="text-[10px] font-bold text-primary uppercase truncate max-w-[180px]">{e.value}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {allSocials.length > 0 && (
                <div className="pt-4 border-t space-y-4">
                  <p className="text-[9px] font-bold uppercase text-gray-400 tracking-[0.2em]">Discovery Channels</p>
                  <div className="flex flex-wrap gap-3">
                    {allSocials.map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 border rounded flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all">
                        {getSocialIcon(s.platform)}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Identical Chat Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex items-center justify-center rounded-full shadow-2xl transition-all duration-500 ease-in-out hover:scale-110 active:scale-95 group",
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
