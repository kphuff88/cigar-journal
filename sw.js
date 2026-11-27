// ============================================================
// Cigar Log — service worker RETIRED.
// It caused stale/blank loads, so this version unregisters itself and
// clears all caches. The app now always loads fresh from the web.
// ============================================================

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) { /* ignore */ }
    try { await self.clients.claim(); } catch (e) { /* ignore */ }
    try { await self.registration.unregister(); } catch (e) { /* ignore */ }
    try {
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((c) => { try { c.navigate(c.url); } catch (e) { /* ignore */ } });
    } catch (e) { /* ignore */ }
  })());
});

// Never serve from cache — let every request hit the network.
self.addEventListener("fetch", () => {});
