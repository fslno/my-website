'use client';

import React, { useState, useEffect } from 'react';
import { FirebaseClientProvider, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { LoadingProvider, useLoading } from '@/context/LoadingContext';
import { ThemeStyleInjector } from '@/components/storefront/ThemeStyleInjector';
import { Chatbot } from '@/components/storefront/Chatbot';
import { PromotionPopup } from '@/components/storefront/PromotionPopup';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { getLivePath } from '@/lib/paths';
import { AuthDialogProvider } from '@/context/AuthDialogContext';
import { SocialPixels } from '@/components/shared/SocialPixels';
import { RoutePrefetcher } from '@/components/shared/RoutePrefetcher';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { ReturnTransition } from '@/components/storefront/ReturnTransition';

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
        <LanguageProvider>
          <LoadingProvider>
            <ThemeStyleInjector initialTheme={initialTheme} />
            <WishlistProvider>
              <CartProvider>
                <LayoutContent pathname={pathname} initialTheme={initialTheme} initialStore={initialStore}>
                  <div className="mobile-wrapper">
                    {children}
                  </div>
                </LayoutContent>
                <ReturnTransition />
                <Toaster />
                <Chatbot />
                <PromotionPopup />
                <SocialPixels />
                <RoutePrefetcher />
              </CartProvider>
            </WishlistProvider>
          </LoadingProvider>
        </LanguageProvider>
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
  const [isAppReady, setIsAppReady] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const { isLoading: isGlobalLoading } = useLoading();

  const db = useFirestore();
  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme } = useDoc(themeRef, { initialData: initialTheme });

  useEffect(() => {
    // Mount initialization
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      
    }
    setIsMounted(true);
    
    // DELAY app readiness to cover all flickering of initial mount/fonts/layout
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // Service Worker Management
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV === 'development') {
      // FORCE UNREGISTER in development to prevent "Module factory not available" errors
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) console.log('Successfully unregistered stale Service Worker');
          });
        }
      });
    } else {
      // Standard Production Registration
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((_err) => {
          // Fail silently
        });
      });
    }
  }, []);

  // Global Scroll Management & Transition Trigger
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

      // Trigger brief transition overlay on route change
      if (isMounted) {
        setIsPageLoading(true);
        const timer = setTimeout(() => {
          setIsPageLoading(false);
        }, 200); // Short duration to cover render/shift
        return () => clearTimeout(timer);
      }
    }
  }, [pathname, isMounted]);

  const showMaintenance = isMounted && !!theme?.maintenanceMode && !isAdmin;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Global Splash Screen — covers everything until app is ready, root navigation finishes, or custom components are loading */}
      <SplashScreen isVisible={!isAdmin && (!isAppReady || isPageLoading || isGlobalLoading)} />

      {/* Maintenance overlay — always rendered but hidden via CSS when not active */}
      <div
        aria-hidden={!showMaintenance}
        style={{ display: showMaintenance ? 'flex' : 'none' }}
        className="fixed inset-0 z-[10000] bg-black flex-col items-center justify-center p-6 sm:p-12 overflow-hidden"
      >
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

        <div className="relative z-10 max-w-2xl w-full text-center space-y-12">
          <div className="flex justify-center">
            <img src="/icon.png" alt="FSLNO" className="w-20 h-20 object-contain invert" />
          </div>

          <div className="space-y-6">
            <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-tighter text-white leading-none font-headline">
              {theme?.maintenanceMessage?.split('.')[0] || 'Store Maintenance'}
            </h1>
            <div className="w-12 h-1 bg-white mx-auto" />
            <p className="text-sm sm:text-base text-gray-400 uppercase tracking-widest font-medium max-w-lg mx-auto leading-relaxed">
              {theme?.maintenanceMessage || 'We are currently updating the store. We will be back online shortly.'}
            </p>
          </div>

          <div className="pt-8">
            <div className="inline-flex items-center gap-3 px-6 py-2 border border-white/20 bg-white/5 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/60">Coming Back Soon</span>
            </div>
          </div>

          <footer className="pt-24 opacity-30">
            <p className="text-[8px] uppercase tracking-[0.8em] text-white">© {new Date().getFullYear()} {theme?.businessName || ''}</p>
          </footer>
        </div>
      </div>

      {/* Main layout — with entrance animation directly on semantic elements (Fixes Hydration Mismatch) */}
      {!isAdmin && (
        <div className={cn("transition-opacity duration-700 ease-out", isAppReady ? "opacity-100" : "opacity-0")}>
          <Header initialTheme={theme || initialTheme} initialStore={initialStore} />
        </div>
      )}
      
      <main className={cn(
        'flex-grow transition-opacity duration-700 ease-out', 
        !isAdmin && 'pt-0',
        isAppReady ? "opacity-100" : "opacity-0"
      )}>
        {children}
      </main>
      
      {!isAdmin && (
        <div className={cn("transition-opacity duration-700 ease-out", isAppReady ? "opacity-100" : "opacity-0")}>
          <Footer initialTheme={theme || initialTheme} />
        </div>
      )}
    </div>
  );
}
