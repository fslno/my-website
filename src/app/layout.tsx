'use client';

import React, { useState, useEffect } from 'react';
import './globals.css';
import { FirebaseClientProvider, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { ThemeStyleInjector } from '@/components/storefront/ThemeStyleInjector';
import { MetaTagInjector } from '@/components/storefront/MetaTagInjector';
import { Chatbot } from '@/components/storefront/Chatbot';
import { PromotionPopup } from '@/components/storefront/PromotionPopup';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { getLivePath } from '@/lib/deployment';

/**
 * Authoritative Unified Root Layout.
 * Forensicly hardened against visual flickering and hydration mismatches.
 * Features a high-fidelity branded text boot manifest to ensure zero-intrusion from broken media.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Forensic Delay to ensure stable hydration before revealing the Studio
    const timer = setTimeout(() => setMounted(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Anton&family=Bebas+Neue&family=Oswald:wght@200..700&family=Teko:wght@300..700&family=Kanit:ital,wght@0,100..900;1,100..900&family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&family=Chakra+Petch:ital,wght@0,300..700;1,300..700&family=Rajdhani:wght@300..700&family=Titillium+Web:ital,wght@0,200..900;1,200..900&family=Exo+2:ital,wght@0,100..900;1,100..900&family=Michroma&family=Orbitron:wght@400..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Squada+One&family=Racing+Sans+One&family=Archivo+Black&family=Russo+One&family=Black+Ops+One&family=Stardos+Stencil:wght@400;700&family=Syncopate:wght@400;700&family=Cinzel:wght@400..900&family=Syne:wght@400..800&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Unbounded:wght@200..900&family=Italiana&family=Tenor+Sans&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Outfit:wght@100..900&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Host+Grotesk:ital,wght@0,300..800;1,300..800&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased m-0 p-0 min-h-screen bg-background text-foreground overflow-x-hidden" suppressHydrationWarning>
        
        {/* BOOT OVERLAY: Branded Text Manifest to prevent visual flickering and broken images */}
        <div 
          className={cn(
            "fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center pointer-events-none transition-opacity duration-700",
            mounted ? "opacity-0 invisible" : "opacity-100"
          )}
        >
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <h1 className="font-headline font-bold text-6xl sm:text-8xl tracking-tighter uppercase text-primary">
              FSLNO
            </h1>
            <div className="h-px w-16 bg-primary/10" />
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.6em] font-bold text-muted-foreground ml-2">
              Studio
            </span>
          </div>
        </div>

        <FirebaseClientProvider>
          <ThemeStyleInjector />
          <MetaTagInjector />
          <WishlistProvider>
            <CartProvider>
              <LayoutContent pathname={pathname}>
                <div className="mobile-wrapper min-h-screen">
                  {children}
                </div>
              </LayoutContent>
              <Toaster />
              <Chatbot />
              <PromotionPopup />
            </CartProvider>
          </WishlistProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children, pathname }: { children: React.ReactNode, pathname: string | null }) {
  const isAdmin = pathname?.startsWith('/admin');
  const db = useFirestore();
  
  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const storeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/store')) : null, [db]);
  
  const { isLoading: themeLoading } = useDoc(themeRef);
  const { isLoading: storeLoading } = useDoc(storeRef);

  return (
    <>
      {!isAdmin && <Header />}
      <main className={cn("min-h-screen", !isAdmin && "pt-0")}>
        {children}
      </main>
      {!isAdmin && <Footer />}
      
      {(themeLoading || storeLoading) && !isAdmin && (
        <div className="fixed inset-0 bg-background z-[1000]" suppressHydrationWarning />
      )}
    </>
  );
}
