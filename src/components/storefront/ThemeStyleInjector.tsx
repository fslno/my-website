'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * Listens for global theme configuration from Firestore
 * and injects dynamic CSS variables and style rules into the document.
 */
export function ThemeStyleInjector() {
  const db = useFirestore();
  const themeRef = useMemoFirebase(() => db ? doc(db, 'config', 'theme') : null, [db]);
  const { data: theme } = useDoc(themeRef);

  useEffect(() => {
    if (!theme) return;

    // Apply global CSS variables to :root
    const root = document.documentElement;
    
    // Primary color (converts hex to HSL if needed, but here we'll use hex for direct overrides)
    if (theme.primaryColor) {
      root.style.setProperty('--primary', theme.primaryColor);
      root.style.setProperty('--foreground', theme.primaryColor);
    }

    if (theme.accentColor) {
      root.style.setProperty('--accent', theme.accentColor);
    }

    if (theme.borderRadius !== undefined) {
      root.style.setProperty('--radius', `${theme.borderRadius}px`);
    }

    // Dynamic Font Faces
    // For a real production app, we would load these from a CDN or self-host.
    // For the prototype, we apply the family name and fallback to standards.
    const styleId = 'fslno-theme-overrides';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const headlineFont = theme.headlineFont || 'Playfair Display';
    const bodyFont = theme.bodyFont || 'Inter';

    styleTag.innerHTML = `
      :root {
        --font-headline: "${headlineFont}", serif;
        --font-body: "${bodyFont}", sans-serif;
      }
      body {
        font-family: var(--font-body) !important;
      }
      h1, h2, h3, h4, h5, h6, .font-headline {
        font-family: var(--font-headline) !important;
      }
      .bg-primary {
        background-color: ${theme.primaryColor || '#000'} !important;
      }
      .text-primary {
        color: ${theme.primaryColor || '#000'} !important;
      }
      .border-primary {
        border-color: ${theme.primaryColor || '#000'} !important;
      }
    `;

  }, [theme]);

  return null;
}
