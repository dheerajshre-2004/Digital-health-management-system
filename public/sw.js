const CACHE_NAME = 'dhms-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/pwa-icon.svg',
  '/manifest.json'
];

// Install event: cache static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event: clean up older caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first falling back to cache (for active views and offline support)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Bypass cache for Supabase API, WebSockets, or live syncing traffic
  if (
    url.hostname.includes('supabase') || 
    url.pathname.startsWith('/rest/') || 
    e.request.method !== 'GET'
  ) {
    return; // Let browser handle it natively (online only)
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Cache new successful GET requests on the fly
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If navigation, return index.html shell
          if (e.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});
