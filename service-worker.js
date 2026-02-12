/* eslint-env serviceworker */
var CACHE_VERSION = "fa2a4763a055f89d-289f40ae";
var CACHE_NAME = "dartpad-compiler-poc-" + CACHE_VERSION;

var PRECACHE_URLS = [
  "./",
  "./index.html",
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
  "./assets/fonts/MaterialIcons-Regular.otf",
  "./assets/fonts/fonts/MaterialIcons-Regular.otf",
  "./assets/libraries.json",
  "./assets/package_config.json",
  "./compiler_worker.js",
  "./compiler_worker.js.deps",
  "./compiler_worker.js.map",
  "./preview.html",
  "./require.js"
];

function toAbsolute(url) {
  return new URL(url, self.registration.scope).toString();
}

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS.map(toAbsolute));
    }).then(function() {
      return self.skipWaiting();
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
    }).then(function() {
      return self.clients.claim();
    }).then(function() {
      return self.clients.matchAll({ type: "window", includeUncontrolled: true });
    }).then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage({ type: "sw-ready" });
      });
    })
  );
});

self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") {
    return;
  }

  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.open(CACHE_NAME).then(function(cache) {
          return cache.match(toAbsolute("./index.html"), { ignoreSearch: true });
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      var cacheKey = url.toString();
      return cache.match(cacheKey).then(function(cached) {
        if (cached) {
          return cached;
        }
        return fetch(event.request).then(function(response) {
          if (response && response.ok) {
            event.waitUntil(cache.put(cacheKey, response.clone()));
          }
          return response;
        });
      });
    })
  );
});
