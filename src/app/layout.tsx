import type {Metadata, Viewport} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { ThemeStyleInjector } from '@/components/storefront/ThemeStyleInjector';
import { PushNotificationManager } from '@/components/storefront/PushNotificationManager';
import { Chatbot } from '@/components/storefront/Chatbot';

export const metadata: Metadata = {
  title: 'FSLNO | Luxury Studio Storefront',
  description: 'High-end minimalist studio e-commerce experience.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FSLNO Studio',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Anton&family=Bebas+Neue&family=Oswald:wght@200..700&family=Teko:wght@300..700&family=Kanit:ital,wght@0,100..900;1,100..900&family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&family=Chakra+Petch:ital,wght@0,300..700;1,300..700&family=Rajdhani:wght@300..700&family=Titillium+Web:ital,wght@0,200..900;1,200..900&family=Exo+2:ital,wght@0,100..900;1,100..900&family=Michroma&family=Orbitron:wght@400..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Squada+One&family=Racing+Sans+One&family=Archivo+Black&family=Russo+One&family=Black+Ops+One&family=Stardos+Stencil:wght@400;700&family=Syncopate:wght@400;700&family=Cinzel:wght@400..900&family=Syne:wght@400..800&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Unbounded:wght@200..900&family=Italiana&family=Tenor+Sans&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Outfit:wght@100..900&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Host+Grotesk:ital,wght@0,300..800;1,300..800&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          <ThemeStyleInjector />
          <PushNotificationManager />
          <WishlistProvider>
            <CartProvider>
              {children}
              <Chatbot />
              <Toaster />
            </CartProvider>
          </WishlistProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
