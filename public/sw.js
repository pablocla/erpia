/// <reference lib="webworker" />

const CACHE_NAME = "negocioos-v1"
const OFFLINE_URL = "/offline"

// Assets to precache for offline shell
const PRECACHE_URLS = [
  "/dashboard",
  "/offline",
]

// Install: precache offline shell
self.addEventListener("install", (event) => {
  const e = event as ExtendableEvent
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  ;(self as unknown as ServiceWorkerGlobalScope).skipWaiting()
})

// Activate: clear old caches
self.addEventListener("activate", (event) => {
  const e = event as ExtendableEvent
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  ;(self as unknown as ServiceWorkerGlobalScope).clients.claim()
})

// Fetch strategy: Network-first for API, Cache-first for static assets
self.addEventListener("fetch", (event) => {
  const e = event as FetchEvent
  const { request } = e
  const url = new URL(request.url)

  // Skip non-GET and cross-origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return

  // API routes: network-only (don't cache mutable data)
  if (url.pathname.startsWith("/api/")) return

  // App pages: network-first with offline fallback
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r ?? new Response("Offline", { status: 503 }))
      )
    )
    return
  }

  // Static assets: cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            }
            return response
          })
      )
    )
    return
  }
})
