'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * RoutePrefetcher — silently pre-compiles all app routes in the background.
 * 
 * After the page loads, this fires prefetch requests for every known route.
 * Next.js compiles each route on first prefetch, so by the time the user
 * actually clicks a link, the page is already compiled and loads instantly.
 */

const ROUTES_TO_PREFETCH = [
  '/',
  '/collections/all',
  '/products',
  '/search',
  '/checkout',
  '/shipping',
  '/returns',
  '/privacy',
  '/terms',
  '/track',
  '/account',
];

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    // Wait for the first paint to finish, then prefetch all routes silently
    const timer = setTimeout(() => {
      ROUTES_TO_PREFETCH.forEach(route => {
        try {
          router.prefetch(route);
        } catch {
          // Silently ignore — non-critical
        }
      });
    }, 1500); // 1.5s delay so it doesn't compete with the initial page load

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
