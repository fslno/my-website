'use client';

/**
 * @fileOverview Environment Protocol (Restored).
 * The isolation protocol has been Authoritatively neutralized.
 * All environments now target the root collection manifest for immediate manifestation.
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
 * Direct mapping to root collections ensures Studio edits show on domain immediately.
 */
export const getLivePath = (path: string) => path;
