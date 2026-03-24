const CACHE_NAME = 'flashmind-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js',
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Handle share_target POST request
  if (event.request.method === 'POST' && event.request.url.includes('/import-share')) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const file = formData.get('deck');
        if (file) {
          const cache = await caches.open('shared-files');
          await cache.put('/shared-deck.json', new Response(file));
        }
        // Redirect to home with shared flag
        return Response.redirect('/?shared=true', 303);
      } catch (e) {
        console.error('Share target error', e);
        return Response.redirect('/', 303);
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});