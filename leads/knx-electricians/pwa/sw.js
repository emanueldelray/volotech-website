// Service worker: app shell cache-first, lead data network-first, everything available offline.
// __VERSION__ is replaced at build time (s08_export.py) so each new build replaces the old cache.
const CACHE = "knx-leads-__VERSION__";
const SHELL = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    // leads.json is optional: a public deployment ships without it and the user imports it instead
    try {
      const r = await fetch("leads.json", { cache: "no-cache" });
      if (r.ok) await cache.put("leads.json", r);
    } catch (e) { /* offline or not deployed */ }
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith("knx-leads-") && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  if (url.pathname.endsWith("/leads.json")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const r = await fetch(req, { cache: "no-cache" });
        if (r.ok) { cache.put("leads.json", r.clone()); return r; }
        return (await cache.match("leads.json")) || r;
      } catch (e) {
        return (await cache.match("leads.json")) || new Response("", { status: 504 });
      }
    })());
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match("index.html")) || fetch(req);
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const r = await fetch(req);
    if (r.ok) cache.put(req, r.clone());
    return r;
  })());
});
