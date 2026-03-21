/**
 * Authoritative PWA Service Worker.
 * Satisfies installability criteria and claims clients for zero-latency activation.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Required fetch handler for PWA "Install" prompt manifestation.
  // Standard pass-through protocol for high-velocity data ingestion.
});