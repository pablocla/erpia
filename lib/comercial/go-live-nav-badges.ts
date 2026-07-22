/**
 * Badges de profundidad go-live para ítems del sidebar.
 * prd → sin badge (o "Listo" sutil)
 * piloto / demo → badge visible
 * no_vender → ocultar en menú comercial
 */

import type { GoLiveTier } from "@/lib/comercial/go-live-packs"
import {
  GO_LIVE_PACKS_PILOTO,
  GO_LIVE_PACKS_PRD,
  GO_LIVE_NO_VENDER,
} from "@/lib/comercial/go-live-packs"

export type NavDepthBadge = {
  tier: GoLiveTier
  label: string
  /** variant shadcn Badge */
  variant: "default" | "secondary" | "outline" | "destructive"
}

/** Prefijos de ruta → tier (más específico primero) */
const PATH_RULES: Array<{ prefix: string; tier: GoLiveTier }> = [
  // PRD
  { prefix: "/dashboard/fiado", tier: "prd" },
  { prefix: "/dashboard/pos", tier: "prd" },
  { prefix: "/dashboard/caja", tier: "prd" },
  { prefix: "/dashboard/clientes", tier: "prd" },
  { prefix: "/dashboard/productos", tier: "prd" },
  { prefix: "/dashboard/cuentas-cobrar", tier: "prd" },
  { prefix: "/dashboard/ventas", tier: "prd" },
  { prefix: "/dashboard/membresias", tier: "prd" },
  { prefix: "/dashboard/ventas/presupuestos", tier: "prd" },
  { prefix: "/dashboard/empleados-digitales", tier: "prd" },
  // Piloto
  { prefix: "/dashboard/historia-clinica", tier: "piloto" },
  { prefix: "/dashboard/veterinaria", tier: "piloto" },
  { prefix: "/dashboard/agenda", tier: "piloto" },
  { prefix: "/dashboard/nicho/taller", tier: "piloto" },
  { prefix: "/dashboard/ot", tier: "piloto" },
  // Demo / no maduro
  { prefix: "/dashboard/agro", tier: "demo" },
  { prefix: "/dashboard/prestamos", tier: "demo" },
  { prefix: "/dashboard/concesionaria", tier: "demo" },
  { prefix: "/dashboard/importacion", tier: "demo" },
  { prefix: "/dashboard/reventas", tier: "demo" },
  { prefix: "/dashboard/industria", tier: "demo" },
  { prefix: "/dashboard/iot", tier: "demo" },
  { prefix: "/dashboard/picking", tier: "demo" },
  { prefix: "/dashboard/hospitalidad", tier: "demo" },
  { prefix: "/dashboard/peluqueria", tier: "demo" },
]

// Completar con goldenPath de packs
for (const p of GO_LIVE_PACKS_PRD) {
  if (p.goldenPath && !PATH_RULES.some((r) => r.prefix === p.goldenPath)) {
    PATH_RULES.unshift({ prefix: p.goldenPath, tier: "prd" })
  }
}
for (const p of GO_LIVE_PACKS_PILOTO) {
  if (p.goldenPath && !PATH_RULES.some((r) => r.prefix === p.goldenPath)) {
    PATH_RULES.unshift({ prefix: p.goldenPath, tier: "piloto" })
  }
}

// Sort longest prefix first
PATH_RULES.sort((a, b) => b.prefix.length - a.prefix.length)

export function resolveHrefGoLiveTier(href: string | undefined | null): GoLiveTier {
  if (!href) return "demo"
  const path = href.split("?")[0]
  for (const rule of PATH_RULES) {
    if (path === rule.prefix || path.startsWith(rule.prefix + "/")) {
      return rule.tier
    }
  }
  // Core dashboard / config: listo
  if (
    path === "/dashboard" ||
    path.startsWith("/dashboard/configuracion") ||
    path.startsWith("/dashboard/mi-plan") ||
    path.startsWith("/dashboard/usuarios") ||
    path.startsWith("/dashboard/apps") ||
    path.startsWith("/dashboard/mis-tareas")
  ) {
    return "prd"
  }
  return "demo"
}

export function goLiveBadgeForHref(href: string | undefined | null): NavDepthBadge | null {
  const tier = resolveHrefGoLiveTier(href)
  if (tier === "prd") return null // limpio: sin badge
  if (tier === "piloto") {
    return { tier, label: "Piloto", variant: "secondary" }
  }
  if (tier === "no_vender") {
    return { tier, label: "No vender", variant: "destructive" }
  }
  return { tier: "demo", label: "Demo", variant: "outline" }
}

/** Ocultar del menú comercial (salvo forceShowDemo) */
export function shouldHideHrefForGoLive(
  href: string | undefined | null,
  opts?: { showDemo?: boolean; showNoVender?: boolean },
): boolean {
  const tier = resolveHrefGoLiveTier(href)
  if (tier === "no_vender" && !opts?.showNoVender) return true
  // Opcional: ocultar demo en packs lite — por ahora solo badge, no hide
  void opts?.showDemo
  return false
}

export function isIndustryNoVender(industryId: string | null | undefined): boolean {
  if (!industryId) return false
  return (GO_LIVE_NO_VENDER as readonly string[]).includes(industryId)
}

export function badgeLabelForTier(tier: GoLiveTier): string | null {
  if (tier === "prd") return "Listo"
  if (tier === "piloto") return "Piloto"
  if (tier === "demo") return "Demo"
  return "No vender"
}
