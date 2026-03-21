'use client';

import React, { useState, useEffect } from 'react';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { ThemeStyleInjector } from '@/components/storefront/ThemeStyleInjector';
import { MetaTagInjector } from '@/components/storefront/MetaTagInjector';
import { Chatbot } from '@/components/storefront/Chatbot';
import { PromotionPopup } from '@/components/storefront/PromotionPopup';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { usePathname } from 'next/navigation';

/**
 * Authoritative Direct-Open Root Layout.
 * Refactored for zero-latency entry sequence by bypassing mounting gates.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  useEffect(() => {
    // Authoritative PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').catch(function(err) {
          console.error('PWA Registration Failure:', err);
        });
      });
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FSLNO" />
        <link rel="apple-touch-icon" href="https://placehold.co/192x192/000000/FFFFFF/png?text=F" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Anton&family=Bebas+Neue&family=Oswald:wght@200..700&family=Teko:wght@300..700&family=Kanit:ital,wght@0,100..900;1,100..900&family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&family=Chakra+Petch:ital,wght@0,300..700;1,300..700&family=Rajdhani:wght@300..700&family=Titillium+Web:ital,wght@0,200..900;1,200..900&family=Exo+2:ital,wght@0,100..900;1,100..900&family=Michroma&family=Orbitron:wght@400..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Squada+One&family=Racing+Sans+One&family=Archivo+Black&family=Russo+One&family=Black+Ops+One&family=Stardos+Stencil:wght@400;700&family=Syncopate:wght@400;700&family=Cinzel:wght@400..900&family=Syne:wght@400..800&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Unbounded:wght@200..900&family=Italiana&family=Tenor+Sans&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Outfit:wght@100..900&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Host+Grotesk:ital,wght@0,300..800;1,300..800&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased m-0 p-0 min-h-screen bg-white text-foreground overflow-x-hidden" suppressHydrationWarning>
        <FirebaseClientProvider>
          <ThemeStyleInjector />
          <MetaTagInjector />
          <WishlistProvider>
            <CartProvider>
              <LayoutContent pathname={pathname}>
                <div className="mobile-wrapper min-h-screen bg-white">
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

  return (
    <>
      {!isAdmin && <Header />}
      <main className="min-h-screen bg-white">
        {children}
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}