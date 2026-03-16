'use client';

/**
 * @fileOverview Environment & Deployment Orchestration Logic.
 * Authoritatively determines the system state (Staging vs Production) based on the current hostname.
 */

export const LIVE_DOMAIN = 'fslno.ca';

/**
 * Determines if the current execution context is the Live Production Domain.
 */
export const isLiveEnvironment = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === LIVE_DOMAIN;
};

/**
 * Returns the Authoritative collection path based on the environment.
 * Static/Catalog data is namespaced with 'live_' in production.
 * Transactional data (orders, users) remains shared for administrative visibility.
 */
export const getLivePath = (path: string) => {
  const transactionalCollections = ['orders', 'users', 'mail', 'reviews', 'staff', 'partners'];
  
  if (!isLiveEnvironment()) return path;
  
  // If the path is a root collection and not transactional, namespace it
  if (!path.includes('/') && !transactionalCollections.includes(path)) {
    return `live_${path}`;
  }
  
  // Handle nested paths (e.g., config/store -> live_config/store)
  const parts = path.split('/');
  if (parts.length > 0 && !transactionalCollections.includes(parts[0])) {
    parts[0] = `live_${parts[0]}`;
    return parts.join('/');
  }

  return path;
};
