'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getLivePath } from '@/lib/paths';

/**
 * SEO Meta Tag Manager.
 * Updates the page's search engine settings across the whole site.
 * Handles site verification, custom meta tags, and robots indexing controls.
 */
export function MetaTagInjector() {
  const pathname = usePathname();
  const db = useFirestore();

  // 1. Domain Settings (Verification Tags & Indexing)
  const domainRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/domain')) : null, [db]);
  const { data: domain } = useDoc(domainRef);

  // 2. Theme Settings (Home Page SEO)
  const themeRef = useMemoFirebase(() => db ? doc(db, getLivePath('config/theme')) : null, [db]);
  const { data: theme } = useDoc(themeRef);

  // 3. Product Settings (Product Detail SEO)
  const productId = pathname?.startsWith('/products/') ? pathname.split('/')[2] : null;
  const productRef = useMemoFirebase(() => db && productId ? doc(db, getLivePath(`products/${productId}`)) : null, [db, productId]);
  const { data: product } = useDoc(productRef);

  useEffect(() => {
    // Only proceed if domain config is available
    if (!domain) return;

    const injectedClass = 'fslno-meta-injected';
    
    // Clean up old meta tags before adding new ones
    const existing = document.querySelectorAll(`.${injectedClass}`);
    existing.forEach(el => el.remove());

    // --- 01. Site Verification & Custom Header Tags ---
    // Specifically targets the "Header Meta Tags & Site Verification" list
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

    // --- 02. Search Engine Settings ---
    // Block search engines if disabled in settings
    if (domain.searchIndexingEnabled === false) {
      const robots = document.createElement('meta');
      robots.name = 'robots';
      robots.content = 'noindex, nofollow';
      robots.classList.add(injectedClass);
      document.head.appendChild(robots);
    }

    // --- 03. Home Page SEO Updates ---
    // Get SEO settings from the store config
    if (pathname === '/' && theme?.homepageSeo) {
      const { title, description } = theme.homepageSeo;
      
      if (title) {
        document.title = title;
      }

      if (description) {
        // Update or create the page description
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

    // --- 04. Product Page SEO Updates ---
    if (productId && product) {
      const productTitle = `${product.name} | ${product.brand || 'FSLNO'}`;
      const productDescription = product.description?.substring(0, 160) || `Buy ${product.name} at our store. High-quality jerseys and apparel.`;
      
      document.title = productTitle;

      let descMeta = document.querySelector('meta[name="description"]');
      if (descMeta) {
        descMeta.setAttribute('content', productDescription);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = productDescription;
        meta.classList.add(injectedClass);
        document.head.appendChild(meta);
      }
    }

    // --- 05. Canonical URL Settings ---
    if (domain.primaryDomain) {
      const canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = `https://${domain.primaryDomain}${pathname === '/' ? '' : pathname}`;
      canonical.classList.add(injectedClass);
      document.head.appendChild(canonical);
    }

  }, [domain, theme, pathname, product, productId]);

  return null;
}
