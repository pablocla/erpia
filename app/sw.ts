import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { Serwist, NetworkOnly, StaleWhileRevalidate } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: any

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  // Preload de navegación + cache de /dashboard rompe rutas (oficios, etc.):
  // FetchEvent rejected. Solo el POS usa cache de páginas.
  navigationPreload: false,
  runtimeCaching: [
    {
      matcher: ({ request, url }: any) => {
        if (!url.origin.includes(self.location?.origin || "") && !url.hostname.includes("supabase.co")) {
          return true
        }
        if (url.pathname.startsWith("/api/")) return true
        if (url.pathname.startsWith("/login")) return true
        if (
          request.mode === "navigate" &&
          url.pathname.startsWith("/dashboard") &&
          !url.pathname.startsWith("/dashboard/pos")
        ) {
          return true
        }
        return false
      },
      handler: new NetworkOnly(),
    },
    ...defaultCache,
    {
      // Estrategia StaleWhileRevalidate para páginas principales del POS
      matcher: ({ url }: any) => url.pathname.startsWith("/dashboard/pos"),
      handler: new StaleWhileRevalidate({
        cacheName: "pos-pages-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
        },
      } as any),
    },
  ] as any,
})

serwist.addEventListeners()
