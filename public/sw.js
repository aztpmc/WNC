/* =========================================================================
   Service worker -- makes the "offline-first" claim in package.json's own
   description (and trade-finance-reference's on-page copy: "It is
   offline, works entirely in your browser") actually true after a first
   visit, rather than just a description nobody enforces. Hand-rolled, no
   build-time precache manifest (Vite's hashed filenames aren't known
   ahead of time without adding a bundler plugin) -- runtime caching only,
   consistent with this project's zero-runtime-dependency architecture.

   Strategy:
     - HTML navigations: network-first, falling back to the cache when
       offline, so a visitor who's online always sees the current page
       rather than a possibly-stale cached one, while an offline visitor
       who has loaded the page before still gets it.
     - Everything else same-origin (JS/CSS/SVG/fonts, Vite's hashed
       assets): stale-while-revalidate -- serve the cached copy instantly
       if there is one, and refresh the cache from the network in the
       background for next time.
     - Cross-origin and non-GET requests are left alone entirely.
   ========================================================================= */

const CACHE_NAME = 'wnc-static-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
  } else {
    event.respondWith(staleWhileRevalidate(req));
  }
});

// Only ever cache a genuinely successful response (response.ok, i.e. a
// 2xx status) -- fetch() only REJECTS on a true network failure, not on
// an HTTP error status, so without this guard a 404/500 would get cached
// and then replayed as if it were valid content on every later request,
// even after the real resource becomes available again.
async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(req);
    if (fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then((fresh) => {
    if (fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  }).catch(() => undefined);

  return cached || (await networkPromise) || Response.error();
}
