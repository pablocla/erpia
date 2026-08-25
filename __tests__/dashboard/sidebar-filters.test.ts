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

describe("sidebar-filters — Claver Cloud", () => {
  const cloudItem = DASHBOARD_SIDEBAR_MODULOS.flatMap((m) => m.items).find(
    (i) => i.href === "/claver-cloud",
  )!

  it("oculta Torre a dueños que no son analistas", () => {
    expect(
      canRenderMenuItem(cloudItem, "dueno", null, null, null, null, "kiosco", false, ar),
    ).toBe(false)
  })

  it("muestra Torre a analistas Claver", () => {
    expect(
      canRenderMenuItem(cloudItem, "dueno", null, null, null, null, "kiosco", true, ar),
    ).toBe(true)
  })
})

describe("sidebar-filters — coherencia rubro", () => {
  const ventas = DASHBOARD_SIDEBAR_MODULOS.find((m) => m.moduloKey === "ventas")!
  const facturacion = ventas.items.find((i) => i.href === "/dashboard/ventas")!
  const oficios = DASHBOARD_SIDEBAR_MODULOS.flatMap((m) => m.items).find(
    (i) => i.href === "/dashboard/oficios",
  )!

  it("dueño ve facturación y oficios se condiciona por SKU/rubro", () => {
    expect(render(facturacion, "dueno", "kiosco")).toBe(true)
    expect(render(oficios, "administrador", "ferreteria", { "niche.oficios": true })).toBe(true)
    expect(render(oficios, "administrador", "kiosco", { "niche.oficios": false })).toBe(false)
  })

  it("respeta allowedRubros aunque el rol sea dueño", () => {
    const soloVet = {
      ...facturacion,
      href: "/dashboard/veterinaria",
      allowedRubros: ["veterinaria" as const],
    }
    expect(render(soloVet, "dueno", "kiosco")).toBe(false)
    expect(render(soloVet, "dueno", "veterinaria")).toBe(true)
  })

  it("SKU requerido oculta ítem si el mapa está cargado y false", () => {
    const contador = {
      ...facturacion,
      href: "/dashboard/contador",
      skuKey: "core.claver",
    }
    expect(render(contador, "dueno", "kiosco", { "core.claver": false })).toBe(false)
    expect(render(contador, "dueno", "kiosco", { "core.claver": true })).toBe(true)
  })

  it("módulos con moduloKey de ventas quedan antes que secciones sin key", () => {
    const ordenados = ordenarModulosPorRubro(DASHBOARD_SIDEBAR_MODULOS, "kiosco")
    const idxVentas = ordenados.findIndex((m) => m.moduloKey === "ventas")
    const idxCloud = ordenados.findIndex((m) => m.label === "Claver Cloud & Admin")
    expect(idxVentas).toBeGreaterThanOrEqual(0)
    expect(idxCloud).toBeGreaterThanOrEqual(0)
    expect(idxVentas).toBeLessThan(idxCloud)
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
