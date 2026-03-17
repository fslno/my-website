'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, ArrowRight } from 'lucide-react';
import { getLivePath } from '@/lib/deployment';

/**
 * Authoritative Promotion Manifest Popup.
 * Forensicly synchronizes with the Admin BOGO protocol to alert participants of rewards.
 * Utilizes persistent storage to ensure a zero-intrusion, first-time-only experience.
 */
export function PromotionPopup() {
  const pathname = usePathname();
  const db = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const promoConfigRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/promotions')) : null, [db]);
  const { data: config, isLoading } = useDoc(promoConfigRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 01. Logic Gate: Ensure component is mounted, config is loaded, and BOGO is active
    if (!mounted || isLoading || !config || !config.bogoEnabled) return;
    
    // 02. Privacy Gate: Do not manifest popup within administrative workspace
    if (pathname?.startsWith('/admin')) return;

    // 03. Entry Protocol: Check for previous acknowledgment in archival storage
    const hasSeenPopup = localStorage.getItem('fslno_promo_seen');
    if (!hasSeenPopup) {
      // Small temporal delay for high-fidelity entrance
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [config, isLoading, mounted, pathname]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('fslno_promo_seen', 'true');
  };

  // Authoritative Guard: return null if conditions are not met
  if (!mounted || !config || !config.bogoEnabled || pathname?.startsWith('/admin')) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-md bg-white border-none rounded-none p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Limited Offer Promotion</DialogTitle>
          <DialogDescription>Information about the current archival reward protocol.</DialogDescription>
        </DialogHeader>
        <div className="relative p-8 sm:p-12 text-center space-y-8">
          
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center shadow-xl border border-black/5 relative">
              <Gift className="h-8 w-8 text-primary" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.5em] font-bold text-muted-foreground block">Limited Offer</span>
            <h2 className="text-2xl sm:text-3xl font-headline font-bold uppercase tracking-tight text-primary leading-tight">
              Archival Reward<br />Protocol Active
            </h2>
            <div className="space-y-4">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-widest leading-relaxed max-w-[280px] mx-auto">
                Purchase {config.bogoMinQty || 2} pieces from our selected drops and manifest a free {config.bogoItemName || 'Archive Gift'} at checkout.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleClose}
              className="w-full h-14 bg-black text-white font-bold uppercase tracking-[0.3em] text-[10px] rounded-none hover:bg-black/90 transition-all shadow-xl group"
            >
              Enter Studio <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="pt-2 flex flex-col items-center gap-2">
            <p className="text-[8px] text-gray-400 uppercase font-bold tracking-widest">
              Reward automatically manifests in cart.
            </p>
            <button 
              onClick={handleClose}
              className="text-[8px] font-bold uppercase tracking-widest text-gray-300 hover:text-primary transition-colors underline underline-offset-4"
            >
              Decline offer
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
