'use client';

import React, { useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Phone, Mail, Instagram, Twitter, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Chatbot() {
  const db = useFirestore();
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: theme } = useDoc(themeRef);

  const storeConfigRef = useMemoFirebase(() => db ? doc(db, 'config', 'store') : null, [db]);
  const { data: config } = useDoc(storeConfigRef);

  const [isOpen, setIsOpen] = useState(false);

  if (theme?.chatbotEnabled === false) return null;

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
      className="fixed bottom-8 z-[70] transition-all duration-500 animate-in fade-in slide-in-from-bottom-10"
      style={{ 
        right: theme?.chatbotPosition === 'right' ? '2rem' : 'auto',
        left: theme?.chatbotPosition === 'left' ? '2rem' : 'auto'
      }}
    >
      {/* Contact Panel */}
      {isOpen && (
        <div className={cn(
          "absolute bottom-20 w-72 bg-white border border-black/10 shadow-2xl rounded-sm p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300",
          theme?.chatbotPosition === 'right' ? 'right-0' : 'left-0'
        )}>
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Contact Studio</h3>
              <p className="text-[9px] uppercase font-bold text-muted-foreground mt-1 tracking-tighter">Support Dispatch Active</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-primary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {config?.phone && (
              <a href={`tel:${config.phone}`} className="flex items-center gap-4 group">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Voice</p>
                  <p className="text-[10px] font-bold text-primary uppercase">{config.phone}</p>
                </div>
              </a>
            )}
            
            <a href={`mailto:${config?.email || 'studio@fslno.com'}`} className="flex items-center gap-4 group">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                <Mail className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Dispatch</p>
                <p className="text-[10px] font-bold text-primary uppercase">{config?.email || 'studio@fslno.com'}</p>
              </div>
            </a>

            <div className="pt-4 border-t space-y-4">
              <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">Discovery Channels</p>
              <div className="flex gap-3">
                {config?.instagramUrl && (
                  <a href={config.instagramUrl} target="_blank" className="w-10 h-10 border rounded flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all">
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {config?.twitterUrl && (
                  <a href={config.twitterUrl} target="_blank" className="w-10 h-10 border rounded flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all">
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                <a href="#" className="w-10 h-10 border rounded flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all">
                  <MessageSquare className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
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
