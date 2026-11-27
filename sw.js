// ============================================================
// Cigar Log — service worker (keeps the app auto-updating)
//
// Strategy:
//  • The app page (HTML) is "network-first": whenever you open the
//    app online, it loads the freshest version straight from the web,
//    so updates appear automatically with no re-install. If you're
//    offline, it falls back to the last saved copy.
//  • Icons/manifest are "stale-while-revalidate": shown instantly from
//    cache, quietly refreshed in the background.
//  • Anything on another website (the Supabase backend, the Supabase
//    library) is left completely alone, so logins and syncing are
//    never touched by this file.
// ============================================================

const VERSION = "2026-11-27b";
const CACHE = "cigar-log-" + VERSION;
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle our own site. Supabase (auth, database, storage) and the
  // Supabase library on its CDN must pass straight through, untouched.
  if (url.origin !== location.origin) return;

  // The version marker must always come from the network (never cached),
  // so the app can detect a new release.
  if (url.pathname.endsWith("/version.txt")) {
    e.respondWith(fetch(req).catch(() => caches.match(req) || Response.error()));
    return;
  }

  const isPage =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isPage) {
    // Network-first: always try to load the latest app from the web.
    e.respondWith((async () => {
      try {
        const net = await fetch(req);
        const c = await caches.open(CACHE);
        c.put("./index.html", net.clone());
        return net;
      } catch (err) {
        const cached =
          (await caches.match("./index.html")) || (await caches.match("./"));
        return cached || Response.error();
      }
    })());
    return;
  }

  // Everything else on our site: serve fast from cache, refresh in background.
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const live = fetch(req)
      .then((res) => {
        caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      })
      .catch(() => cached);
    return cached || live;
  })());
});
