/* CycleNova service worker
 * Strategy:
 *  - Precache the app shell (icons, manifest)
 *  - Network-first for navigations (HTML) with offline fallback
 *  - Stale-while-revalidate for static assets (JS/CSS/images/fonts)
 *  - Skip Supabase / API requests entirely (always go to network)
 */
const VERSION = "v3";
const STATIC_CACHE = `cn-static-${VERSION}`;
const RUNTIME_CACHE = `cn-runtime-${VERSION}`;
const HTML_CACHE = `cn-html-${VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico?v=2",
  "/icons/icon-192.png?v=2",
  "/icons/icon-512.png?v=2",
  "/icons/apple-touch-icon.png?v=2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {})),
  );
  // Don't auto-activate — wait for user confirmation via SKIP_WAITING message.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE, HTML_CACHE].includes(k))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function shouldBypass(url) {
  // Never intercept Supabase, auth, or any cross-origin API.
  if (url.origin !== self.location.origin) return true;
  if (url.pathname.startsWith("/api/")) return true;
  if (url.pathname.startsWith("/_server")) return true;
  if (url.pathname.includes("/auth/")) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (shouldBypass(url)) return;

  // HTML navigations: network-first, fall back to cached shell.
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(HTML_CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          const cached = (await caches.match(req)) || (await caches.match("/"));
          return (
            cached ||
            new Response("<h1>Offline</h1><p>CycleNova is offline.</p>", {
              status: 503,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            })
          );
        }
      })(),
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })(),
  );
});
