/* ToeicHub Service Worker — v1
 * 策略:
 *   - HTML pages: network-first (try latest, fall back to cache if offline)
 *   - api/levels/: stale-while-revalidate (show cache fast, background refresh)
 *   - icons + manifest: cache-first (immutable assets)
 *   - 其他 GET: 預設 network-first with cache fallback
 *
 * 注意: Next.js build 出的 _next/static/* JS 我們也想 cache (PWA 標準)
 */

const VERSION = 'v1';
const RUNTIME_CACHE = `toeichub-runtime-${VERSION}`;
const STATIC_CACHE = `toeichub-static-${VERSION}`;

const PRECACHE = [
  '/',
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE).catch((err) => {
        console.warn('[SW] precache partial fail', err);
      }),
    ),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![RUNTIME_CACHE, STATIC_CACHE].includes(k))
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

function isApiLevels(url) {
  return url.pathname.startsWith('/api/levels/');
}

function isStaticIcon(url) {
  return /\.(png|svg|webmanifest|ico)$/.test(url.pathname);
}

function isNextStatic(url) {
  return url.pathname.startsWith('/_next/static/');
}

function isHtmlRequest(request, accept) {
  if (request.mode === 'navigate') return true;
  if (request.destination === 'document') return true;
  if (accept && accept.includes('text/html')) return true;
  return false;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 1. icon / static: cache-first
  if (isStaticIcon(url) || isNextStatic(url)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 2. HTML 頁面: network-first
  if (isHtmlRequest(req, req.headers.get('Accept'))) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 3. /api/levels/* : stale-while-revalidate
  if (isApiLevels(url)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // 4. fallback: network-first w/ cache fallback
  event.respondWith(networkFirst(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

async function networkFirst(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(req);
    if (hit) return hit;
    // 沒 cache: 對於 HTML 請求, 給離線頁
    if (isHtmlRequest(req, req.headers.get('Accept'))) {
      const offlinePage = await cache.match('/offline.html') ||
        (await caches.open(STATIC_CACHE)).match('/offline.html');
      if (offlinePage) return offlinePage;
    }
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached ?? new Response('', { status: 504 }));
  return cached ?? fetchPromise;
}
