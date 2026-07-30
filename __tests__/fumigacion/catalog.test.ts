import { describe, expect, it } from "vitest"
import { getIndustryTemplate } from "@/lib/comercial/industry-templates"
import { getNicheApp, getNicheAppBySku } from "@/lib/niche/niche-apps-catalog"
import { resolveGoLiveTier } from "@/lib/comercial/go-live-packs"
import { FUMIGACION_MENU_LABELS, FUMIGACION_TIPOS_PLAGA, FUMIGACION_TIPOS_SERVICIO } from "@/lib/fumigacion/constants"
import { isMenuItemAllowedInModoLite } from "@/lib/comercial/lite-sidebar"

describe("vertical fumigación", () => {
  it("tiene industry template con golden path de ruta", () => {
    const t = getIndustryTemplate("fumigacion")
    expect(t).toBeTruthy()
    expect(t!.goldenPath).toBe("/dashboard/fumigacion")
    expect(t!.engancheId).toBe("niche.fumigacion")
    expect(t!.menuLabels["/dashboard/fumigacion"]).toBeTruthy()
    expect(t!.menuLabels["/dashboard/ot"]).toBeTruthy()
    expect(t!.menuLabels["/dashboard/clientes"]).toBeTruthy()
    // Sin ruido retail / hospitalidad
    expect(t!.menuLabels["/dashboard/pos"]).toBeUndefined()
    expect(t!.menuLabels["/dashboard/hospitalidad"]).toBeUndefined()
  })

  it("tiene app de nicho y SKU", () => {
    expect(getNicheApp("fumigacion")?.sku).toBe("niche.fumigacion")
    expect(getNicheAppBySku("niche.fumigacion")?.goldenPath).toBe("/dashboard/fumigacion")
  })

  it("es piloto vendible (ya no no_vender)", () => {
    expect(resolveGoLiveTier({ industryId: "fumigacion" })).toBe("piloto")
    expect(resolveGoLiveTier({ engancheId: "niche.fumigacion" })).toBe("piloto")
  })

  it("catálogo de plagas y tipos de servicio", () => {
    expect(FUMIGACION_TIPOS_PLAGA.length).toBeGreaterThan(4)
    expect(FUMIGACION_TIPOS_SERVICIO.length).toBeGreaterThan(3)
    expect(Object.keys(FUMIGACION_MENU_LABELS)).toContain("/dashboard/fumigacion")
    expect(Object.keys(FUMIGACION_MENU_LABELS)).toContain("/dashboard/ventas")
  })

  it("modo niche permite ruta y OT de fumigación sin ruido", () => {
    expect(isMenuItemAllowedInModoLite("/dashboard/fumigacion", "niche")).toBe(true)
    expect(isMenuItemAllowedInModoLite("/dashboard/ot", "niche")).toBe(true)
    expect(isMenuItemAllowedInModoLite("/dashboard/clientes", "niche")).toBe(true)
    expect(isMenuItemAllowedInModoLite("/dashboard/ventas", "niche")).toBe(true)
    expect(isMenuItemAllowedInModoLite("/dashboard/cuentas-cobrar", "niche")).toBe(true)
    expect(isMenuItemAllowedInModoLite("/dashboard/facturacion-recurrente", "niche")).toBe(true)
  })
})
