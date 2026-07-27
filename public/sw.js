const CACHE_NAME = 'transitops-operational-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Operational Cache Initialized');
      return cache.addAll(STATIC_ASSETS).catch((err) => console.log('[SW] AddAll warning:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback response for offline status requests
        if (event.request.url.includes('/api/fleet')) {
          return new Response(
            JSON.stringify({
              vehicles: [],
              drivers: [],
              status: 'OFFLINE_CACHE_ACTIVE'
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (event.request.url.includes('/api/orders')) {
          return new Response(
            JSON.stringify([]),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (event.request.url.includes('/api/')) {
          return new Response(
            JSON.stringify({
              status: 'OFFLINE_CACHE_ACTIVE',
              message: 'Operational logs and fleet status retrieved from ServiceWorker local storage.',
              timestamp: new Date().toISOString()
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
        return caches.match('/');
      })
  );
});
