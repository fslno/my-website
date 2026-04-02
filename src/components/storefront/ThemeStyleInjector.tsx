'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getLivePath } from '@/lib/paths';

/**
 * Listens for global theme configuration from Firestore
 * and injects dynamic styles into the page.
 * Automatically scales fonts and layouts for mobile devices.
 */
export function ThemeStyleInjector({ initialTheme }: { initialTheme?: any }) {
  const db = useFirestore();
  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme } = useDoc(themeRef, { initialData: initialTheme });

  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;

    // Contrast Helper: Returns white or black based on background hex with safety buffer
    const getContrastColor = (hexcolor: string | undefined) => {
      if (!hexcolor || hexcolor === 'transparent' || typeof hexcolor !== 'string' || hexcolor.length < 6) {
        return '#000000';
      }

      try {
        const cleanHex = hexcolor.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);

        if (isNaN(r) || isNaN(g) || isNaN(b)) return '#000000';

        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#FFFFFF';
      } catch (e) {
        return '#000000';
      }
    };

    if (theme.primaryColor) {
      root.style.setProperty('--primary', theme.primaryColor);
      root.style.setProperty('--foreground', theme.primaryColor);
      root.style.setProperty('--primary-foreground', getContrastColor(theme.primaryColor));
    }

    const bgColor = theme.accentColor || '#FFFFFF';
    root.style.setProperty('--background', bgColor);

    if (theme.accentColor) {
      root.style.setProperty('--accent', theme.accentColor);
      root.style.setProperty('--accent-foreground', getContrastColor(theme.accentColor));
    }

    if (theme.borderRadius !== undefined) {
      root.style.setProperty('--radius', `${theme.borderRadius}px`);
    }

    const styleId = 'fslno-theme-overrides';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const headlineFont = theme.headlineFont || 'Playfair Display';
    const bodyFont = theme.bodyFont || 'Inter';

    // Robust Google Fonts injection
    const injectFonts = () => {
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

      const fontParams = fonts.map(font => {
        const encoded = font.replace(/ /g, '+');
        if (['Inter', 'Montserrat', 'Playfair Display', 'Open Sans', 'Roboto'].includes(font)) {
          return `family=${encoded}:ital,wght@0,400;0,700;1,400`;
        }
        return `family=${encoded}:wght@400;700`;
      }).join('&');

      const fontHref = `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
      let linkTag = document.getElementById('dynamic-google-fonts') as HTMLLinkElement;
      
      if (!linkTag) {
        linkTag = document.createElement('link');
        linkTag.id = 'dynamic-google-fonts';
        linkTag.rel = 'stylesheet';
        document.head.appendChild(linkTag);
      }
      
      if (linkTag.href !== fontHref) {
        linkTag.href = fontHref;
      }
    };

    injectFonts();

    const bannerFont = theme.bannerFont || 'Inter';
    const bannerFontSize = theme.bannerFontSize || 10;

    const heroTextAlign = theme.heroTextAlign || 'center';
    const heroVerticalAlign = theme.heroVerticalAlign || 'center';
    const heroHeadlineSize = theme.heroHeadlineSize || 72;
    const heroSubheadlineSize = theme.heroSubheadlineSize || 10;
    const heroHeadlineColor = theme.heroHeadlineColor || theme.primaryColor || '#000000';
    const heroSubheadlineColor = theme.heroSubheadlineColor || '#8c9196';

    const categoryTextAlign = theme.categoryTextAlign || 'left';
    const categoryVerticalAlign = theme.categoryVerticalAlign || 'center';
    const categoryTitleSize = theme.categoryTitleSize || 40;
    const categoryTitleColor = theme.categoryTitleColor || theme.primaryColor || '#000000';

    const categoryCardTextAlign = theme.categoryCardTextAlign || 'left';
    const categoryCardVerticalAlign = theme.categoryCardVerticalAlign || 'bottom';
    const categoryCardTitleSize = theme.categoryCardTitleSize || 24;
    const categoryCardTitleColor = theme.categoryCardTitleColor || '#FFFFFF';

    const archiveTextAlign = theme.archiveTextAlign || 'left';
    const archiveTitleSize = theme.archiveTitleSize || 40;
    const archiveTitleColor = theme.archiveTitleColor || theme.primaryColor || '#000000';

    const featuredTextAlign = theme.featuredTextAlign || 'left';
    const featuredTitleSize = theme.featuredTitleSize || 40;
    const featuredTitleColor = theme.featuredTitleColor || theme.primaryColor || '#000000';

    const productTextAlign = theme.productTextAlign || 'left';
    const productTitleSize = theme.productTitleSize || 14;
    const productTitleColor = theme.productTitleColor || theme.primaryColor || '#000000';
    const productPriceSize = theme.productPriceSize || 14;
    const productPriceColor = theme.productPriceColor || theme.primaryColor || '#000000';

    const heroButtonBg = theme.heroButtonBgColor || theme.accentColor || '#FFFFFF';
    const heroButtonText = theme.heroButtonTextColor || getContrastColor(heroButtonBg);

    const getFlexAlign = (align: string) => align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
    const getVerticalAlign = (align: string) => align === 'bottom' ? 'flex-end' : align === 'top' ? 'flex-start' : 'center';

    styleTag.innerHTML = `
      :root {
        --font-headline: "${headlineFont}", "Playfair Display", serif;
        --font-body: "${bodyFont}", "Inter", sans-serif;
        --banner-font: "${bannerFont}", sans-serif;
        --banner-font-size: ${bannerFontSize}px;
        --hero-text-align: ${heroTextAlign};
        --hero-vertical-align: ${getVerticalAlign(heroVerticalAlign)};
        --hero-flex-align: ${getFlexAlign(heroTextAlign)};
        
        --category-text-align: ${categoryTextAlign};
        --category-vertical-align: ${getVerticalAlign(categoryVerticalAlign)};
        --category-flex-align: ${getFlexAlign(categoryTextAlign)};
        --category-title-size: ${categoryTitleSize}px;
        --category-title-color: ${categoryTitleColor};

        --category-card-text-align: ${categoryCardTextAlign};
        --category-card-vertical-align: ${getVerticalAlign(categoryCardVerticalAlign)};
        --category-card-flex-align: ${getFlexAlign(categoryCardTextAlign)};
        --category-card-title-size: ${categoryCardTitleSize}px;
        --category-card-title-color: ${categoryCardTitleColor};

        --archive-text-align: ${archiveTextAlign};
        --archive-flex-align: ${getFlexAlign(archiveTextAlign)};
        --archive-title-size: ${archiveTitleSize}px;
        --archive-title-color: ${archiveTitleColor};
        
        --featured-text-align: ${featuredTextAlign};
        --featured-title-size: ${featuredTitleSize}px;
        --featured-title-color: ${featuredTitleColor};
        
        --product-text-align: ${productTextAlign};
        --product-flex-align: ${getFlexAlign(productTextAlign)};
        --product-title-size: ${productTitleSize}px;
        --product-title-color: ${productTitleColor};
        --product-price-size: ${productPriceSize}px;
        --product-price-color: ${productPriceColor};
        
        /* Product Card Advanced Controls */
        --card-sku-size: ${theme.cardSkuSize || 9}px;
        --card-sku-color: ${theme.cardSkuColor || '#666666'};
        --card-review-scale: ${theme.cardReviewScale || 1.0};
        --card-review-color: ${theme.cardReviewColor || '#facc15'};

        /* Product Detail Advanced Controls */
        --detail-title-size: ${theme.detailTitleSize || 24}px;
        --detail-title-color: ${theme.detailTitleColor || '#000000'};
        --detail-price-size: ${theme.detailPriceSize || 18}px;
        --detail-price-color: ${theme.detailPriceColor || '#000000'};
        --detail-sku-size: ${theme.detailSkuSize || 10}px;
        --detail-sku-color: ${theme.detailSkuColor || '#666666'};
        --detail-brand-size: ${theme.detailBrandSize || 10}px;
        --detail-brand-color: ${theme.detailBrandColor || '#000000'};
        --detail-review-scale: ${theme.detailReviewScale || 1.2};
        --detail-review-color: ${theme.detailReviewColor || '#facc15'};
        
        --hero-headline-size: ${heroHeadlineSize}px;
        --hero-subheadline-size: ${heroSubheadlineSize}px;
        --hero-headline-color: ${heroHeadlineColor};
        --hero-subheadline-color: ${heroSubheadlineColor};
        --hero-button-bg: ${heroButtonBg};
        --hero-button-text: ${heroButtonText};

        /* Review Badge Subsystem */
        --review-badge-size: ${theme.reviewBadgeSize || 1.0};
        --review-badge-color: ${theme.reviewBadgeColor || '#000000'};
        --review-badge-right: ${theme.reviewBadgeRight || 32}px;
        --review-badge-visibility: ${theme.reviewBadgeVisibility === false ? 'none' : 'block'};
        
        /* Responsive Offsets */
        --review-badge-top: ${theme.reviewBadgeTopDesktop || 80}px;
      }

      /* Global Selectors for Advanced Product Styling */
      .card-sku-style {
        font-size: var(--card-sku-size) !important;
        color: var(--card-sku-color) !important;
      }
      .card-review-style {
        transform: scale(var(--card-review-scale)) !important;
        transform-origin: left center !important;
        color: var(--card-review-color) !important;
      }
      .card-review-star-fill {
        fill: var(--card-review-color) !important;
        color: var(--card-review-color) !important;
      }

      .detail-title-style {
        font-size: clamp(20px, 5vw, var(--detail-title-size)) !important;
        color: var(--detail-title-color) !important;
      }
      .detail-price-style {
        font-size: var(--detail-price-size) !important;
        color: var(--detail-price-color) !important;
      }
      .detail-sku-style {
        font-size: var(--detail-sku-size) !important;
        color: var(--detail-sku-color) !important;
      }
      .detail-brand-style {
        font-size: var(--detail-brand-size) !important;
        color: var(--detail-brand-color) !important;
      }
      .detail-review-style {
        transform: scale(var(--detail-review-scale)) !important;
        transform-origin: left center !important;
        color: var(--detail-review-color) !important;
      }
      .detail-review-star-fill {
        fill: var(--detail-review-color) !important;
        color: var(--detail-review-color) !important;
      }

      @media (max-width: 640px) {
        :root {
          --review-badge-top: ${theme.reviewBadgeTopMobile || 60}px;
        }
      }
      body, html, .font-body {
        font-family: var(--font-body) !important;
      }
      h1, h2, h3, h4, h5, h6, .font-headline {
        font-family: var(--font-headline) !important;
      }
      .bg-primary {
        background-color: var(--primary) !important;
        color: var(--primary-foreground) !important;
      }
      .text-primary {
        color: var(--primary) !important;
      }
      .border-primary {
        border-color: var(--primary) !important;
      }
      .bg-accent {
        background-color: var(--accent) !important;
        color: var(--accent-foreground) !important;
      }
      .text-accent {
        color: var(--accent) !important;
      }
      .border-accent {
        border-color: var(--accent) !important;
      }
      
      /* BANNER STYLES */
      .banner-style {
        font-family: var(--banner-font) !important;
        font-size: clamp(7px, 2.5vw, var(--banner-font-size)) !important;
      }
      
      .hero-text-align {
        text-align: var(--hero-text-align) !important;
      }
      .hero-vertical-align {
        justify-content: var(--hero-vertical-align) !important;
        align-items: var(--hero-flex-align) !important;
      }
      
      /* AUTOMATIC SCALING */
      .hero-headline-size {
        font-size: clamp(calc(var(--hero-headline-size) * 0.5), 8vw, var(--hero-headline-size)) !important;
        color: var(--hero-headline-color) !important;
      }
      .hero-subheadline-size {
        font-size: clamp(calc(var(--hero-subheadline-size) * 0.7), 3vw, var(--hero-subheadline-size)) !important;
      }
      .hero-subheadline-color {
        color: var(--hero-subheadline-color) !important;
      }
      .category-title-size {
        font-size: clamp(calc(var(--category-title-size) * 0.6), 6vw, var(--category-title-size)) !important;
      }
      
      .category-card-content {
        display: flex !important;
        flex-direction: column !important;
        justify-content: var(--category-card-vertical-align) !important;
        align-items: var(--category-card-flex-align) !important;
        text-align: var(--category-card-text-align) !important;
      }
      .category-card-title {
        font-size: clamp(calc(var(--category-card-title-size) * 0.6), 5vw, var(--category-card-title-size)) !important;
        color: var(--category-card-title-color) !important;
      }

      .archive-title-size {
        font-size: clamp(calc(var(--archive-title-size) * 0.6), 6vw, var(--archive-title-size)) !important;
      }
      .featured-title-size {
        font-size: clamp(calc(var(--featured-title-size) * 0.6), 6vw, var(--featured-title-size)) !important;
      }
      .product-title-size {
        font-size: clamp(calc(var(--product-title-size) * 0.8), 4vw, var(--product-title-size)) !important;
      }
      .product-price-size {
        font-size: clamp(calc(var(--product-price-size) * 0.8), 4vw, var(--product-price-size)) !important;
      }

      .category-text-align {
        text-align: var(--category-text-align) !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: var(--category-flex-align) !important;
      }
      .archive-text-align {
        text-align: var(--archive-text-align) !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: var(--archive-flex-align) !important;
      }
      .featured-text-align {
        text-align: var(--featured-text-align) !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: var(--featured-flex-align) !important;
      }
      .product-text-align {
        text-align: var(--product-text-align) !important;
      }
      .product-flex-align {
        display: flex !important;
        flex-direction: column !important;
        align-items: var(--product-flex-align) !important;
      }
      
      .category-title-color { color: var(--category-title-color) !important; }
      .archive-title-color { color: var(--archive-title-color) !important; }
      .featured-title-color { color: var(--featured-title-color) !important; }
      .product-title-color { color: var(--product-title-color) !important; }
      .product-price-color { color: var(--product-price-color) !important; }
      
      .hero-button {
        background-color: var(--hero-button-bg) !important;
        color: var(--hero-button-text) !important;
      }
    `;

  }, [theme]);

  return null;
}
