/* eslint-env serviceworker */
var CACHE_VERSION = "f0ba2812283761d5-d97369e8";
var CACHE_NAME = "dartpad-compiler-poc-" + CACHE_VERSION;

var PRECACHE_URLS = [
  "./",
  "./assets/AssetManifest.json",
  "./assets/FontManifest.json",
  "./assets/canvaskit/canvaskit.js",
  "./assets/canvaskit/canvaskit.js.symbols",
  "./assets/canvaskit/canvaskit.wasm",
  "./assets/canvaskit/canvaskit/canvaskit.js",
  "./assets/canvaskit/canvaskit/canvaskit.js.symbols",
  "./assets/canvaskit/canvaskit/canvaskit.wasm",
  "./assets/canvaskit/canvaskit/chromium/canvaskit.js",
  "./assets/canvaskit/canvaskit/chromium/canvaskit.js.symbols",
  "./assets/canvaskit/canvaskit/chromium/canvaskit.wasm",
  "./assets/canvaskit/canvaskit/skwasm.js",
  "./assets/canvaskit/canvaskit/skwasm.js.symbols",
  "./assets/canvaskit/canvaskit/skwasm.wasm",
  "./assets/canvaskit/canvaskit/skwasm_heavy.js",
  "./assets/canvaskit/canvaskit/skwasm_heavy.js.symbols",
  "./assets/canvaskit/canvaskit/skwasm_heavy.wasm",
  "./assets/canvaskit/chromium/canvaskit.js",
  "./assets/canvaskit/chromium/canvaskit.js.symbols",
  "./assets/canvaskit/chromium/canvaskit.wasm",
  "./assets/canvaskit/skwasm.js",
  "./assets/canvaskit/skwasm.js.symbols",
  "./assets/canvaskit/skwasm.wasm",
  "./assets/canvaskit/skwasm_heavy.js",
  "./assets/canvaskit/skwasm_heavy.js.symbols",
  "./assets/canvaskit/skwasm_heavy.wasm",
  "./assets/dart_sdk.js",
  "./assets/dart_sdk_libraries.json",
  "./assets/ddc_outline.dill",
  "./assets/flutter.js",
  "./assets/flutter_web.dill",
  "./assets/flutter_web.js",
  "./assets/libraries.json",
  "./assets/package_config.json",
  "./compiler_bundle.js",
  "./compiler_bundle.js.deps",
  "./compiler_bundle.js.map",
  "./index.html",
  "./preview.html",
  "./require.js"
];

self.addEventListener("install", function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names
          .filter(function(name) {
            return name.indexOf("dartpad-compiler-poc-") === 0 && name !== CACHE_NAME;
          })
          .map(function(name) {
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
  self.clients.matchAll({ type: "window" }).then(function(clients) {
    clients.forEach(function(client) {
      client.postMessage({ type: "sw-ready" });
    });
  });
});

self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then(function(response) {
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      });
    })
  );
});
