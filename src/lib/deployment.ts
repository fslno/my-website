'use client';

/**
 * @fileOverview Environment Protocol (Legacy/Pass-through).
 * Reverted to a unified state where all environments use the root manifest.
 */

export const LIVE_DOMAIN = 'fslno.ca';

/**
 * Determines if the current execution context is the primary domain.
 */
export const isLiveEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === LIVE_DOMAIN || host.endsWith('.' + LIVE_DOMAIN);
};

/**
 * Returns the path as-is (Isolation Protocol Reverted).
 */
export const getLivePath = (path: string) => path;
