import { describe, it, expect } from "vitest"
import { canRenderMenuItem, ordenarModulosPorRubro } from "@/lib/dashboard/sidebar-filters"
import { DASHBOARD_SIDEBAR_MODULOS } from "@/lib/dashboard/sidebar-modules"
import { getCountryFeatures } from "@/lib/country/country-features"

describe("sidebar-filters", () => {
  it("admin ve ítems sin restricción de rol", () => {
    const ventas = DASHBOARD_SIDEBAR_MODULOS.find((m) => m.label === "Ventas")!
    const pos = ventas.items.find((i) => i.href === "/dashboard/pos")!
    expect(
      canRenderMenuItem(
        pos,
        "administrador",
        null,
        null,
        null,
        null,
        "kiosco",
        false,
        getCountryFeatures("AR"),
      ),
    ).toBe(true)
  })

  it("ordena Principal antes que Configuración", () => {
    const ordenados = ordenarModulosPorRubro(DASHBOARD_SIDEBAR_MODULOS, "kiosco")
    const idxPrincipal = ordenados.findIndex((m) => m.label === "Principal")
    const idxConfig = ordenados.findIndex((m) => m.label === "Configuración")
    expect(idxPrincipal).toBeLessThan(idxConfig)
  })
})