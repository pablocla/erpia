"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { trackMetaEvent } from "@/lib/analytics/meta-pixel"

type PixelPack = { contentName: string; contentId: string; category: string }

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const PIXEL_PATHS = new Set([
  "/software",
  "/f",
  "/f/servicios",
  "/claver/apps/servicios",
  "/claver/apps/cobra",
  "/claver/apps/pos",
  "/oficios",
  "/demo",
  "/login/register",
])

const PIXEL_PACKS: Array<{ prefix: string; pack: PixelPack }> = [
  { prefix: "/demo/ferreteria", pack: { contentName: "Claver Ferreteria", contentId: "ferreteria", category: "ferreteria" } },
  { prefix: "/demo/gimnasio", pack: { contentName: "Claver Gym", contentId: "gimnasio", category: "gimnasio" } },
  { prefix: "/claver/apps/servicios", pack: { contentName: "Claver Servicios", contentId: "servicios", category: "servicios" } },
  { prefix: "/f/servicios", pack: { contentName: "Claver Servicios", contentId: "servicios", category: "servicios" } },
  { prefix: "/oficios", pack: { contentName: "Claver Oficios", contentId: "oficios", category: "servicios" } },
  { prefix: "/claver/apps/cobra", pack: { contentName: "Claver Cobra WA", contentId: "cobra", category: "cobranzas" } },
  { prefix: "/claver/apps/pos", pack: { contentName: "Claver POS", contentId: "pos", category: "pos" } },
  { prefix: "/f", pack: { contentName: "Claver Fiado", contentId: "pos.fiado_barrio", category: "fiado" } },
  { prefix: "/software", pack: { contentName: "Claver Soft", contentId: "ferreteria", category: "ferreteria" } },
]

const DEFAULT_PACK: PixelPack = { contentName: "Claver", contentId: "claver", category: "claver" }

function getPixelPack(pathname: string): PixelPack {
  return PIXEL_PACKS.find(({ prefix }) => pathname === prefix || pathname.startsWith(prefix + "/"))?.pack ?? DEFAULT_PACK
}

function isPixelPath(pathname: string): boolean {
  return PIXEL_PATHS.has(pathname) || pathname.startsWith("/demo/")
}

type MetaFbq = ((...args: unknown[]) => void) & { q?: unknown[][] }

function ensurePixel(): void {
  if (typeof window === "undefined" || !PIXEL_ID) return
  if (!window.fbq) {
    const fbq = ((...args: unknown[]) => {
      fbq.q = fbq.q ?? []
      fbq.q.push(args)
    }) as MetaFbq
    window.fbq = fbq
  }
  if (window.__claverMetaPixelInitialized) return
  window.fbq("init", PIXEL_ID)
  window.__claverMetaPixelInitialized = true
  if (!document.getElementById("claver-meta-pixel")) {
    const script = document.createElement("script")
    script.id = "claver-meta-pixel"
    script.async = true
    script.src = "https://connect.facebook.net/en_US/fbevents.js"
    document.head.appendChild(script)
  }
}

export function MetaPixel() {
  const pathname = usePathname()

  useEffect(() => {
    if (!PIXEL_ID || !isPixelPath(pathname)) return
    ensurePixel()
    window.fbq?.("track", "PageView")
    if (pathname !== "/login/register") {
      const pack = getPixelPack(pathname)
      window.fbq?.("track", "ViewContent", {
        content_name: pack.contentName,
        content_category: pack.category,
        content_ids: [pack.contentId],
      })
    }
  }, [pathname])

  useEffect(() => {
    if (!PIXEL_ID) return
    const handleClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-meta-event]")
      if (!target || target.dataset.metaEvent !== "Lead") return
      const pack = getPixelPack(window.location.pathname)
      trackMetaEvent("Lead", {
        content_name: target.dataset.metaContentName ?? pack.contentName,
        content_category: target.dataset.metaContentCategory ?? pack.category,
      })
    }
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return null
}
