'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getLivePath } from '@/lib/deployment';

/**
 * Authoritative MetaTag Ingestion Protocol.
 * Dynamically synchronizes Firestore SEO configurations with the document head.
 * Handles site verification, custom meta tags, and robots indexing controls.
 */
export function MetaTagInjector() {
  const pathname = usePathname();
  const db = useFirestore();

  // 1. Domain Manifest (Verification Tags & Indexing)
  const domainRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/domain')) : null, [db]);
  const { data: domain } = useDoc(domainRef);

  // 2. Theme Manifest (Home Page SEO)
  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme } = useDoc(themeRef);

  useEffect(() => {
    // Only proceed if domain config is manifested
    if (!domain) return;

    const injectedClass = 'fslno-meta-injected';
    
    // Cleanup Protocol: Purge previous high-fidelity injections to prevent duplication
    const existing = document.querySelectorAll(`.${injectedClass}`);
    existing.forEach(el => el.remove());

    // --- 01. Site Verification & Custom Header Tags ---
    // Specifically targets the "Header Meta Tags & Site Verification" manifest
    const metaTags = domain.metaTags || [];
    metaTags.forEach((tag: any) => {
      if (tag.name && tag.content) {
        const meta = document.createElement('meta');
        meta.name = tag.name;
        meta.content = tag.content;
        meta.classList.add(injectedClass);
        document.head.appendChild(meta);
      }
    });

    // --- 02. Search Indexing Orchestration ---
    // Authoritatively block indexing if explicitly disabled in the Admin UI
    if (domain.searchIndexingEnabled === false) {
      const robots = document.createElement('meta');
      robots.name = 'robots';
      robots.content = 'noindex, nofollow';
      robots.classList.add(injectedClass);
      document.head.appendChild(robots);
    }

    // --- 03. Home Page SEO Synchronization ---
    // Ingests the "Home Page SEO Manifest" from the Storefront settings
    if (pathname === '/' && theme?.homepageSeo) {
      const { title, description } = theme.homepageSeo;
      
      if (title) {
        document.title = title;
      }

      if (description) {
        // Forensicly target or create the description manifest
        let descMeta = document.querySelector('meta[name="description"]');
        if (descMeta) {
          descMeta.setAttribute('content', description);
        } else {
          const meta = document.createElement('meta');
          meta.name = 'description';
          meta.content = description;
          meta.classList.add(injectedClass);
          document.head.appendChild(meta);
        }
      }
    }

    // --- 04. Canonical URL Handshake ---
    if (domain.primaryDomain) {
      const canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = `https://${domain.primaryDomain}${pathname === '/' ? '' : pathname}`;
      canonical.classList.add(injectedClass);
      document.head.appendChild(canonical);
    }

  }, [domain, theme, pathname]);

  return null;
}
