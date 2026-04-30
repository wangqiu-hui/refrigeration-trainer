const APP_VERSION = "20260430-subject-one-v8";
const CACHE_NAME = `refrigeration-trainer-mobile-${APP_VERSION}`;

const CORE_ASSETS = [
  "./",
  "./index.html",
  `./style.css?v=${APP_VERSION}`,
  `./app.js?v=${APP_VERSION}`,
  `./steps.json?v=${APP_VERSION}`,
  `./manifest.webmanifest?v=${APP_VERSION}`,
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

const NETWORK_FIRST_SUFFIXES = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/steps.json",
  "/manifest.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  if (shouldUseNetworkFirst(request)) {
    return networkFirst(request);
  }

  return cacheFirst(request);
}

function shouldUseNetworkFirst(request) {
  if (request.mode === "navigate") {
    return true;
  }

  const url = new URL(request.url);
  return NETWORK_FIRST_SUFFIXES.some(suffix => url.pathname.endsWith(suffix));
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const fallbackPage = await caches.match("./index.html");
    if (fallbackPage) {
      return fallbackPage;
    }

    throw error;
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}
