'use client';

import React, { useState, useEffect } from 'react';
import { FirebaseClientProvider, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { ThemeStyleInjector } from '@/components/storefront/ThemeStyleInjector';
import { Chatbot } from '@/components/storefront/Chatbot';
import { PromotionPopup } from '@/components/storefront/PromotionPopup';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { getLivePath } from '@/lib/deployment';
import { AuthDialogProvider } from '@/context/AuthDialogContext';
import { SocialPixels } from '@/components/shared/SocialPixels';

export function ClientLayout({ 
  children,
  initialTheme,
  initialStore
}: { 
  children: React.ReactNode,
  initialTheme?: any,
  initialStore?: any
}) {
  const pathname = usePathname();
  
  return (
    <FirebaseClientProvider>
      <AuthDialogProvider>
        <ThemeStyleInjector initialTheme={initialTheme} />
        <WishlistProvider>
          <CartProvider>
            <LayoutContent pathname={pathname} initialTheme={initialTheme} initialStore={initialStore}>
              <div className="mobile-wrapper">
                {children}
              </div>
            </LayoutContent>
            <Toaster />
            <Chatbot />
            <PromotionPopup />
            <SocialPixels />
          </CartProvider>
        </WishlistProvider>
      </AuthDialogProvider>
    </FirebaseClientProvider>
  );
}

function LayoutContent({ 
  children, 
  pathname,
  initialTheme,
  initialStore 
}: { 
  children: React.ReactNode, 
  pathname: string | null,
  initialTheme?: any,
  initialStore?: any
}) {
  const isAdmin = pathname?.startsWith('/admin');
  const [isMounted, setIsMounted] = useState(false);

  const db = useFirestore();
  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme } = useDoc(themeRef, { initialData: initialTheme });

  useEffect(() => {
    // Small delay ensures fonts + styles are painted before revealing content
    const t = setTimeout(() => {
      setIsMounted(true);
      
      // Remove the opening cover smoothly
      const cover = document.getElementById('fslno-opening-cover');
      if (cover) {
        cover.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        cover.style.opacity = '0';
        setTimeout(() => cover.remove(), 900);
      }
    }, 150);

    // Register PWA Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
          console.log('SW registered: ', registration);
        }).catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }

    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* SSR data handles the initial paint, so we no longer need a blocking overlay */}

      {isMounted && theme?.maintenanceMode && !isAdmin ? (
        <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
          <div 
            className="absolute inset-0 z-0 opacity-40 scale-105"
            style={{
              backgroundImage: 'url("/maintenance-bg.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'grayscale(0.5) contrast(1.2)'
            }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
          
          <div className="relative z-10 max-w-2xl w-full text-center space-y-12 animate-in fade-in zoom-in duration-500">
            <div className="flex justify-center">
              <img src="/icon.png" alt="FSLNO" className="w-20 h-20 object-contain invert" />
            </div>
            
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-tighter text-white leading-none font-headline">
                {theme.maintenanceMessage?.split('.')[0] || "Store Maintenance"}
              </h1>
              <div className="w-12 h-1 bg-white mx-auto" />
              <p className="text-sm sm:text-base text-gray-400 uppercase tracking-widest font-medium max-w-lg mx-auto leading-relaxed">
                {theme.maintenanceMessage || "We are currently updating the store. We will be back online shortly."}
              </p>
            </div>

            <div className="pt-8">
              <div className="inline-flex items-center gap-3 px-6 py-2 border border-white/20 bg-white/5 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/60">Coming Back Soon</span>
              </div>
            </div>
            
            <footer className="pt-24 opacity-30">
              <p className="text-[8px] uppercase tracking-[0.8em] text-white">© {new Date().getFullYear()} {theme.businessName || ""}</p>
            </footer>
          </div>
        </div>
      ) : (
        <>
          {!isAdmin && <Header initialTheme={theme || initialTheme} initialStore={initialStore} />}
          <main className={cn("flex-grow", !isAdmin && "pt-0")}>
            {children}
          </main>
          {!isAdmin && <Footer initialTheme={theme || initialTheme} />}
        </>
      )}
    </div>
  );
}
