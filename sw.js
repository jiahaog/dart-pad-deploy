const VERSION = '5fecaf3e';
const CACHE_NAME = 'dartpad-poc-' + VERSION;

const PRECACHE_URLS = [
  './',
  './index.html',
  './require.js',
  './compiler_bundle.js',
  './assets/dart_sdk.js',
  './assets/ddc_outline.dill',
  './assets/libraries.json',
  './assets/dart_sdk_libraries.json',
  './assets/package_config.json',
  './assets/flutter_web.dill',
  './assets/flutter_web.js',
  './assets/flutter.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
