/**
 * @fileOverview Universal Path Utilities.
 * These functions are safe to use in both Client and Server contexts.
 * Direct mapping to root collections ensures edits show on domain immediately.
 */

/**
 * Returns the path as-is (Pass-through Protocol).
 * Direct mapping to root collections ensures edits manifest immediately.
 */
export const getLivePath = (path: string) => path;

/**
 * Primary domain for the platform.
 */
export const LIVE_DOMAIN = 'fslno.ca';
