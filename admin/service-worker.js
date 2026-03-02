const CACHE_NAME = "pineapple-farm-shell-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css?v=20260220-4",
  "./css/firebase-app.css?v=20260220-4",
  "./js/firebase-config.js?v=20260220-4",
  "./js/theme.js?v=20260220-4",
  "./js/firebase-app.js?v=20260220-4",
  "./js/pwa.js?v=20260220-4",
  "./manifest.webmanifest?v=20260220-4",
  "./Img/logo.png",
  "./Img/icon-192.png",
  "./Img/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "./index.html"));
    return;
  }

  const destination = request.destination;

  if (["style", "script", "worker", "manifest", "font"].includes(destination)) {
    event.respondWith(networkOnly(request));
    return;
  }

  if (destination === "image") {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request, fallbackUrl = null) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === "basic") {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function networkOnly(request) {
  return fetch(request, { cache: "no-store" });
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.status === 200 && response.type === "basic") {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200 && response.type === "basic") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise;
}

self.addEventListener("notificationclick", (event) => {
  event.notification?.close();

  const targetUrl = event.notification?.data?.url || "./index.html?section=tasks";

  event.waitUntil((async () => {
    const windowClients = await clients.matchAll({ type: "window", includeUncontrolled: true });

    for (const client of windowClients) {
      try {
        if ("navigate" in client) {
          await client.navigate(targetUrl);
        }
      } catch (error) {
        // Ignore navigation errors and still try to focus.
      }

      if ("focus" in client) {
        await client.focus();
        return;
      }
    }

    if (clients.openWindow) {
      await clients.openWindow(targetUrl);
    }
  })());
});
