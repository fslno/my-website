'use client';

/**
 * @fileOverview Browser-only environment utilities.
 * This module is client-only (uses window). Do NOT import into Server Components.
 * For path utilities, import from '@/lib/paths' instead.
 */

export const LIVE_DOMAIN = 'fslno.ca';

/**
 * Determines if the current execution context is the primary live domain.
 * Depends on the browser `window` object — client-only.
 */
export const isLiveEnvironment = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes(LIVE_DOMAIN);
};
