/**
 * Minimal service worker: installability only. Does not cache /api or HTML aggressively.
 * Replace with a real offline strategy only if product requirements justify cache invalidation.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
