'use client';

import React, { useState, useEffect } from 'react';
import './globals.css';
import { FirebaseClientProvider, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { ThemeStyleInjector } from '@/components/storefront/ThemeStyleInjector';
import { MetaTagInjector } from '@/components/storefront/MetaTagInjector';
import { PushNotificationManager } from '@/components/storefront/PushNotificationManager';
import { Chatbot } from '@/components/storefront/Chatbot';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { getLivePath } from '@/lib/deployment';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

/**
 * Authoritative Velocity Boot Layout.
 * Synchronizes the hydration handshake with a persistent shell to prevent server/client mismatches.
 * Implements a dynamic loading manifest using the FSLNO icon protocol.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Anton&family=Bebas+Neue&family=Oswald:wght@200..700&family=Teko:wght@300..700&family=Kanit:ital,wght@0,100..900;1,100..900&family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&family=Chakra+Petch:ital,wght@0,300..700;1,300..700&family=Rajdhani:wght@300..700&family=Titillium+Web:ital,wght@0,200..900;1,200..900&family=Exo+2:ital,wght@0,100..900;1,100..900&family=Michroma&family=Orbitron:wght@400..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Squada+One&family=Racing+Sans+One&family=Archivo+Black&family=Russo+One&family=Black+Ops+One&family=Stardos+Stencil:wght@400;700&family=Syncopate:wght@400;700&family=Cinzel:wght@400..900&family=Syne:wght@400..800&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Unbounded:wght@200..900&family=Italiana&family=Tenor+Sans&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Outfit:wght@100..900&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Host+Grotesk:ital,wght@0,300..800;1,300..800&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased m-0 p-0 min-h-screen bg-background text-foreground overflow-x-hidden" suppressHydrationWarning>
        
        {/* FIRST-FRAME HYDRATION GUARD: Permanent FSLNO Icon manifest */}
        <div 
          className={cn(
            "fixed inset-0 z-[9999] bg-white flex items-center justify-center pointer-events-none transition-opacity duration-500",
            mounted ? "opacity-0 invisible" : "opacity-100"
          )}
          suppressHydrationWarning
        >
          <div className="relative w-24 h-24">
            <Image 
              src="https://i.ibb.co/Ld5KV35V/fslno-icon-512-x-512.png" 
              alt="FSLNO Loading" 
              fill 
              className="object-contain"
              priority 
            />
          </div>
        </div>

        <FirebaseClientProvider>
          <ThemeStyleInjector />
          <MetaTagInjector />
          <PushNotificationManager />
          <WishlistProvider>
            <CartProvider>
              <LayoutContent pathname={pathname}>
                {children}
              </LayoutContent>
              <Toaster />
              <Chatbot />
            </CartProvider>
          </WishlistProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

/**
 * Nested Content Provider.
 * Forensicly manages the secondary data-loading manifest once the client has hydrated.
 */
function LayoutContent({ children, pathname }: { children: React.ReactNode, pathname: string | null }) {
  const isAdmin = pathname?.startsWith('/admin');
  const db = useFirestore();
  
  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const storeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/store')) : null, [db]);
  
  const { isLoading: themeLoading } = useDoc(themeRef);
  const { data: storeData, isLoading: storeLoading } = useDoc(storeRef);

  // Authoritative Data Sync Gate
  if (themeLoading || storeLoading) {
    return (
      <div className="fixed inset-0 bg-white z-[1000] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          <div className="relative w-24 h-24">
            <Image 
              src={storeData?.logoUrl || "https://i.ibb.co/Ld5KV35V/fslno-icon-512-x-512.png"} 
              alt="FSLNO Loading" 
              fill 
              className="object-contain"
              priority 
            />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-black/20" />
        </div>
      </div>
    );
  }

  return (
    <>
      {!isAdmin && <Header />}
      <main className={cn("min-h-screen", !isAdmin && "pt-0")}>
        {children}
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}
