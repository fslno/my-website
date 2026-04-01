import React from 'react';
import './globals.css';
import { getAdminDb } from '@/lib/firebase-admin';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Metadata } from 'next';
import { serializeData } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const adminDb = getAdminDb();
    const [themeDoc, domainDoc] = await Promise.all([
      adminDb.doc('config/theme').get(),
      adminDb.doc('config/domain').get()
    ]);

    const theme = themeDoc?.data() || {};
    const domain = domainDoc?.data() || {};

    const title = theme?.homepageSeo?.title || "Feiselino (FSLNO) | Sport Jerseys";
    const description = theme?.homepageSeo?.description || "Official Feiselino (FSLNO) Sport Website. High-quality jerseys and apparel.";
    const primaryDomain = domain?.primaryDomain || "fslno.ca";
    const logoUrl = "https://i.ibb.co/PGbDVWTg/fslno-icon-192-x-192.png";

    const metadata: Metadata = {
      title: {
        default: title,
        template: `%s | ${theme?.businessName || 'FSLNO'}`
      },
      description,
      metadataBase: primaryDomain ? new URL(`https://${primaryDomain.trim()}`) : null,
      alternates: {
        canonical: '/',
      },
      openGraph: {
        title,
        description,
        url: `https://${primaryDomain}`,
        siteName: theme?.businessName || 'FSLNO',
        images: [
          {
            url: logoUrl,
            width: 800,
            height: 600,
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [logoUrl],
      },
      robots: {
        index: domain?.searchIndexingEnabled !== false,
        follow: domain?.searchIndexingEnabled !== false,
      },
      manifest: '/manifest.webmanifest',
      icons: {
        icon: '/icon.png',
        apple: '/icon.png',
      },
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'FSLNO',
      },
    };

    if (domain?.metaTags && Array.isArray(domain.metaTags)) {
      const other: Record<string, string> = {};
      domain.metaTags.forEach((tag: { name: string; content: string }) => {
        if (tag && tag.name && tag.content) {
          other[tag.name] = tag.content;
        }
      });
      metadata.other = other;
    }

    return metadata;
  } catch (err: any) {
    console.warn("[LAYOUT_METADATA_CAUGHT]", typeof err === 'object' ? err.message : String(err));
    return {
      title: "Feiselino (FSLNO)",
      description: "Official Feiselino (FSLNO) Sport Website.",
      icons: { icon: '/favicon.ico', apple: '/apple-icon.png' },
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // SSR Theme Injection (Anti-Flicker)
  let theme: any = {};
  let store: any = {};
  
  try {
    const adminDb = getAdminDb();
    const [themeDoc, storeDoc] = await Promise.all([
      adminDb.doc('config/theme').get().catch((e: Error) => { 
        console.warn("[ADMIN_THEME_FETCH_FAIL]", e.message); 
        return null; 
      }),
      adminDb.doc('config/store').get().catch((e: Error) => { 
        console.warn("[ADMIN_STORE_FETCH_FAIL]", e.message); 
        return null; 
      })
    ]);
    theme = serializeData(themeDoc?.data()) || {};
    store = serializeData(storeDoc?.data()) || {};
  } catch (err) {
    console.error("[SSR_DATA_FETCH_CRITICAL_FAILURE]", err);
  }

  // Contrast Calculation logic on server
  const getContrastColor = (hexcolor: string | undefined) => {
    if (!hexcolor || hexcolor === 'transparent' || typeof hexcolor !== 'string' || hexcolor.length < 6) return '#000000';
    try {
      const cleanHex = hexcolor.replace('#', '');
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
      return (yiq >= 128) ? '#000000' : '#FFFFFF';
    } catch { return '#000000'; }
  };

  const primaryColor = theme.primaryColor || '#000000';
  const accentColor = theme.accentColor || '#FFFFFF';
  const headlineFont = theme.headlineFont || 'Playfair Display';
  const bodyFont = theme.bodyFont || 'Inter';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Enhanced font library: Athletic, E-commerce, Modern, and Luxury collections */}
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Oswald:wght@400;700&family=Teko:wght@400;700&family=Kanit:wght@400;700&family=Archivo+Black&family=Russo+One&family=Black+Ops+One&family=Squada+One&family=Racing+Sans+One&family=Staatliches&family=Big+Shoulders+Display:wght@400;700&family=Saira+Stencil+One&family=Chakra+Petch:wght@400;700&family=Rajdhani:wght@400;700&family=Inter:wght@300;400;500;600&family=Montserrat:wght@400;700&family=Outfit:wght@400;700&family=Urbanist:wght@400;700&family=Plus+Jakarta+Sans:wght@400;700&family=Public+Sans:wght@400;700&family=Lexend:wght@400;700&family=Space+Grotesk:wght@400;700&family=DM+Sans:wght@400;700&family=Host+Grotesk:wght@400;700&family=Bricolage+Grotesque:wght@400;700&family=Work+Sans:wght@400;700&family=Jost:wght@400;700&family=Syncopate:wght@400;700&family=Michroma&family=Syne:wght@400;700&family=Unbounded:wght@400;700&family=Bodoni+Moda:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Cinzel:wght@400;700&family=Tenor+Sans&family=Italiana&family=Fraunces:ital,wght@0,400;0,700;1,400&family=Belleza&family=Space+Mono&family=Orbitron:wght@400;700&family=Righteous&family=Stardos+Stencil&family=Titillium+Web:wght@400;700&family=Exo+2:wght@400;700&display=swap" rel="stylesheet" />
        
        {/* Critical CSS Injection for instant theme application */}
        <style id="ssr-theme-style" dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${primaryColor};
            --primary-foreground: ${getContrastColor(primaryColor)};
            --background: ${accentColor};
            --accent: ${accentColor};
            --accent-foreground: ${getContrastColor(accentColor)};
            --radius: ${theme.borderRadius || 0}px;
            --font-headline: "${headlineFont}", "Playfair Display", serif;
            --font-body: "${bodyFont}", "Inter", sans-serif;
            --hero-headline-size: ${theme.heroHeadlineSize || 72}px;
            --hero-subheadline-size: ${theme.heroSubheadlineSize || 10}px;
            --archive-title-size: ${theme.archiveTitleSize || 40}px;
            --archive-title-color: ${theme.archiveTitleColor || primaryColor};
            --product-title-size: ${theme.productTitleSize || 14}px;
            --product-price-size: ${theme.productPriceSize || 14}px;
          }
          @media (max-width: 640px) {
            :root {
              --hero-headline-size: 32px !important;
            }
          }
          body { font-family: var(--font-body) !important; background-color: var(--background) !important; }
          h1, h2, h3, h4, h5, h6, .font-headline { font-family: var(--font-headline) !important; }

          /* Static Splash Screen Styles - Instant Load */
          #initial-splash-screen {
            position: fixed;
            inset: 0;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
            opacity: 1;
          }
          #initial-splash-screen.fade-out {
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease-in-out;
          }
          #initial-splash-screen img {
            width: 120px;
            height: 120px;
            max-width: 50vw;
            animation: splash-pulse 2s infinite ease-in-out;
          }
          @keyframes splash-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
        `}} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": store.businessName || "Feiselino (FSLNO)",
                "url": "https://fslno.ca",
                "logo": "https://i.ibb.co/PGbDVWTg/fslno-icon-192-x-192.png",
                "sameAs": [
                  store.instagramUrl,
                  store.facebookUrl,
                  store.twitterUrl
                ].filter(Boolean)
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": store.businessName || "Feiselino (FSLNO)",
                "url": "https://fslno.ca",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://fslno.ca/products?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              }
            ])
          }}
        />
      </head>
      <body className="font-body antialiased m-0 p-0 min-h-screen bg-white text-foreground overflow-x-hidden" suppressHydrationWarning>
        {/* Static SplashScreen - Present in raw HTML for instant render */}
        <div id="initial-splash-screen">
          <img 
            src="https://i.ibb.co/Ld5KV35V/fslno-icon-512-x-512.png" 
            alt="FSLNO Loading"
          />
        </div>
        <ClientLayout initialTheme={theme} initialStore={store}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
