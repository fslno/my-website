import React from 'react';
import './globals.css';
import { getCachedTheme, getCachedStore, getCachedDomain, getCachedCategories } from '@/lib/firebase-admin';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Metadata } from "next";
import Script from "next/script";
import { RealTimeTracker } from '@/components/shared/RealTimeTracker';

export const revalidate = 300; // 5 minutes cache for all pages (ISR)

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [theme, domain, categories] = await Promise.all([
      getCachedTheme(),
      getCachedDomain(),
      getCachedCategories()
    ]);

    const title = theme?.homepageSeo?.title || "Feiselino (FSLNO) | Sport Jerseys";
    const description = theme?.homepageSeo?.description || "Official Feiselino (FSLNO) Sport Website. High-quality jerseys and apparel.";
    const primaryDomain = (domain?.primaryDomain || "fslno.ca").trim();
    const baseUrl = `https://${primaryDomain}`;
    const logoUrl = "https://i.ibb.co/PGbDVWTg/fslno-icon-192-x-192.png";

    // Dynamic keywords from categories
    const categoryKeywords = categories?.map((c: any) => c.name).join(', ') || "";
    const keywords = `jerseys, soccer jerseys, custom jerseys, sport apparel, FSLNO, Feiselino, ${categoryKeywords}`;

    const metadata: Metadata = {
      title: {
        default: title,
        template: `%s | ${theme?.businessName || 'FSLNO'}`
      },
      description,
      keywords,
      metadataBase: new URL(baseUrl),
      alternates: {
        canonical: '/',
      },
      openGraph: {
        title,
        description,
        url: baseUrl,
        siteName: theme?.businessName || 'FSLNO',
        images: [
          {
            url: logoUrl,
            width: 512,
            height: 512,
            alt: theme?.businessName || 'FSLNO Logo',
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
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      manifest: '/manifest.webmanifest',
      icons: {
        icon: '/icon.png',
        apple: '/icon.png',
        shortcut: '/icon.png',
      },
      appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: theme?.businessName || 'FSLNO',
      },
      formatDetection: {
        telephone: false,
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
    const [themeConfig, storeConfig] = await Promise.all([
      getCachedTheme(),
      getCachedStore()
    ]);
    theme = themeConfig || {};
    store = storeConfig || {};
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
        
        {/* Dynamic Font Loading: Only load the fonts currently selected in the theme + fallback defaults */}
        {(() => {
          const fonts = Array.from(new Set([
            headlineFont, 
            bodyFont, 
            'Inter', 
            'Playfair Display', 
            'Anton', 
            'Bebas Neue', 
            'Oswald', 
            'Montserrat'
          ])).filter(Boolean);
          
          // Request fonts more safely to avoid 400 errors if italics/weights are missing
          const fontParams = fonts.map(font => {
            const encoded = font.replace(/ /g, '+');
            // Advanced fonts with full weight/italic support
            if (['Inter', 'Montserrat', 'Playfair Display', 'Open Sans', 'Roboto'].includes(font)) {
              return `family=${encoded}:ital,wght@0,400;0,700;1,400`;
            }
            // Standard/Display fonts
            return `family=${encoded}:wght@400;700`;
          }).join('&');
            
          return <link href={`https://fonts.googleapis.com/css2?${fontParams}&display=swap`} rel="stylesheet" />;
        })()}

        {/* Critical Asset Preloading for Instant feel */}
        <link rel="preload" as="image" href="https://i.ibb.co/Ld5KV35V/fslno-icon-512-x-512.png" />
        {theme?.heroImages?.[0] && (
          <link rel="preload" as="image" href={theme.heroImages[0]} fetchPriority="high" />
        )}
        
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

            /* Button Theme Engine Variables */
            --btn-scale: ${theme.buttonStyles?.scale || 1.0};
            --btn-radius: ${theme.buttonStyles?.borderRadius ?? 4}px;
            --btn-primary: ${theme.buttonStyles?.primaryColor || '#000000'};
            --btn-primary-foreground: ${getContrastColor(theme.buttonStyles?.primaryColor || '#000000')};
            --btn-hover: ${theme.buttonStyles?.hoverColor || '#D3D3D3'};
            --btn-hover-foreground: ${getContrastColor(theme.buttonStyles?.hoverColor || '#D3D3D3')};
            --btn-font-weight: ${theme.buttonStyles?.fontWeight || 500};
            --btn-text-transform: ${theme.buttonStyles?.textTransform || 'none'};
            --btn-border-width: ${theme.buttonStyles?.borderWidth ?? 0}px;
            --btn-padding-x: ${theme.buttonStyles?.paddingX ?? 16}px;
            --btn-padding-y: ${theme.buttonStyles?.paddingY ?? 8}px;
          }
          @media (max-width: 640px) {
            :root {
              --hero-headline-size: 32px !important;
            }
          }
          body { font-family: var(--font-body) !important; background-color: var(--background) !important; }
          h1, h2, h3, h4, h5, h6, .font-headline { font-family: var(--font-headline) !important; }

          /* Static Splash Screen Styles - Instant Load and Zero Flicker */
          #initial-splash-screen {
            position: fixed;
            inset: 0;
            background: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100001; /* Very high */
            opacity: 1;
            transition: opacity 0.4s ease-in-out;
          }
          #initial-splash-screen.hidden {
            opacity: 0;
            pointer-events: none;
          }
          #initial-splash-screen img {
            width: 120px;
            height: 120px;
            max-width: 50vw;
            animation: splash-pulse 2.2s infinite ease-in-out;
          }
          @keyframes splash-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.04); opacity: 0.85; }
          }
        `}} />

        <Script
          id="unregister-sw-dev"
          dangerouslySetInnerHTML={{ __html: `
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            }
          `}}
        />
        <Script
          id="json-ld-org"
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
          <RealTimeTracker />
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
