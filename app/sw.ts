import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Ignorar llamadas API a supabase, auth, etc para evitar problemas de CORS/Auth en cache
      matcher: ({ request, url }) => {
        if (url.pathname.startsWith("/api/auth")) return true
        if (url.hostname.includes("supabase.co")) return true
        return false
      },
      handler: "NetworkOnly",
    },
    ...defaultCache,
    {
      // Estrategia StaleWhileRevalidate para páginas principales del POS
      matcher: ({ url }) => url.pathname.startsWith("/dashboard/pos"),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "pos-pages-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
        },
      },
    },
  ],
})

serwist.addEventListeners()
