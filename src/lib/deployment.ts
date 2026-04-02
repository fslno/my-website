'use client';

/**
 * @fileOverview Browser-only environment utilities.
 * This module is client-only (uses window). Do NOT import into Server Components.
 * For path utilities, import from '@/lib/paths' instead.
 */

import { LIVE_DOMAIN } from './paths';

export { LIVE_DOMAIN };

/**
 * Determines if the current execution context is the primary live domain.
 * Depends on the browser `window` object — client-only.
 */
export const isLiveEnvironment = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.includes(LIVE_DOMAIN);
};
