'use client';

/**
 * @fileOverview Environment Protocol (Reverted).
 * The isolation protocol has been Authoritatively neutralized.
 * All environments now target the root collection manifest.
 */

export const LIVE_DOMAIN = 'fslno.ca';

/**
 * Determines if the current execution context is the primary domain.
 */
export const isLiveEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.includes(LIVE_DOMAIN);
};

/**
 * Returns the path as-is (Pass-through Protocol).
 * Direct mapping to root collections.
 */
export const getLivePath = (path: string) => path;
