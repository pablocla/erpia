import { describe, it, expect } from "vitest"
import { canRenderMenuItem, ordenarModulosPorRubro } from "@/lib/dashboard/sidebar-filters"
import { DASHBOARD_SIDEBAR_MODULOS } from "@/lib/dashboard/sidebar-modules"
import { getCountryFeatures } from "@/lib/country/country-features"
import {
  getNavAllowlistForRubro,
  getTopActionsForContext,
  defaultModoLiteForRubro,
} from "@/lib/comercial/nav-matrix"
import { getSidebarAllowlist, isMenuHrefVisibleInAllowlist } from "@/lib/comercial/sidebar-rubro-filter"
import { isPathAllowedInSidebarAllowlist } from "@/lib/marketplace/sku-availability"

const ar = getCountryFeatures("AR")

function render(
  item: Parameters<typeof canRenderMenuItem>[0],
  role: string,
  rubro: Parameters<typeof canRenderMenuItem>[6],
  skus: Record<string, boolean> | null = null,
) {
  return canRenderMenuItem(item, role, null, null, skus, null, rubro, false, ar)
}

describe("sidebar-filters — coherencia rubro", () => {
  const ventas = DASHBOARD_SIDEBAR_MODULOS.find((m) => m.label === "Ventas")!
  const pos = ventas.items.find((i) => i.href === "/dashboard/pos")!
  const vetItem = DASHBOARD_SIDEBAR_MODULOS.flatMap((m) => m.items).find(
    (i) => i.href === "/dashboard/veterinaria",
  )!
  const agroItem = DASHBOARD_SIDEBAR_MODULOS.flatMap((m) => m.items).find(
    (i) => i.href === "/dashboard/agro/balanza",
  )!

  it("dueño de kiosco VE el POS", () => {
    expect(render(pos, "dueno", "kiosco")).toBe(true)
    expect(render(pos, "administrador", "kiosco")).toBe(true)
  })

  it("dueño de kiosco NO ve veterinaria ni balanza agro", () => {
    expect(render(vetItem, "dueno", "kiosco")).toBe(false)
    expect(render(agroItem, "dueno", "kiosco")).toBe(false)
  })

  it("dueño de veterinaria VE historia clínica / vet", () => {
    expect(render(vetItem, "dueno", "veterinaria")).toBe(true)
  })

  it("dueño de veterinaria NO ve balanza agro", () => {
    expect(render(agroItem, "dueno", "veterinaria")).toBe(false)
  })

  it("SKU requerido oculta ítem si el mapa está cargado y false", () => {
    const platform = DASHBOARD_SIDEBAR_MODULOS.find((m) => m.label === "Claver Platform")!
    const contador = platform.items.find((i) => i.href === "/dashboard/contador")!
    expect(render(contador, "dueno", "kiosco", { "core.claver": false })).toBe(false)
    expect(render(contador, "dueno", "kiosco", { "core.claver": true })).toBe(true)
  })

  it("ordena Principal antes que Configuración", () => {
    const ordenados = ordenarModulosPorRubro(DASHBOARD_SIDEBAR_MODULOS, "kiosco")
    const idxPrincipal = ordenados.findIndex((m) => m.label === "Principal")
    const idxConfig = ordenados.findIndex((m) => m.label === "Configuración")
    expect(idxPrincipal).toBeLessThan(idxConfig)
  })
})

describe("nav-matrix", () => {
  it("kiosco tiene allowlist con POS y sin agro balanza", () => {
    const list = getNavAllowlistForRubro("kiosco")
    expect(list).toBeTruthy()
    expect(isPathAllowedInSidebarAllowlist("/dashboard/pos", list!)).toBe(true)
    expect(isPathAllowedInSidebarAllowlist("/dashboard/fiado", list!)).toBe(true)
    expect(isPathAllowedInSidebarAllowlist("/dashboard/agro/balanza", list!)).toBe(false)
  })

  it("otro no fuerza allowlist de matriz", () => {
    expect(getNavAllowlistForRubro("otro")).toBeNull()
  })

  it("default modoLite no es completo en altas", () => {
    expect(defaultModoLiteForRubro("kiosco")).toBe("pos")
    expect(defaultModoLiteForRubro("veterinaria")).toBe("niche")
    expect(defaultModoLiteForRubro(null)).toBe("pos")
  })

  it("top actions cobranza no prioriza POS", () => {
    expect(getTopActionsForContext({ modoLite: "cobranza" })).toEqual(["cobrar"])
  })
})

describe("getSidebarAllowlist", () => {
  it("modo pos no usa allowlist industria (lite se aplica aparte)", () => {
    expect(
      getSidebarAllowlist({
        rubro: "kiosco",
        modoLite: "pos",
        presentMode: false,
        isAdmin: true,
      }),
    ).toBeNull()
  })

  it("modo completo + kiosco restringe a matriz", () => {
    const list = getSidebarAllowlist({
      rubro: "kiosco",
      modoLite: "completo",
      presentMode: false,
      isAdmin: true,
    })
    expect(list).toBeTruthy()
    expect(isMenuHrefVisibleInAllowlist("/dashboard/pos", list)).toBe(true)
    expect(isMenuHrefVisibleInAllowlist("/dashboard/veterinaria", list)).toBe(false)
  })
})
