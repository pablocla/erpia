import { describe, it, expect } from "vitest"
import { resolveSku } from "@/lib/marketplace/catalog-resolver"
import { NICHE_APPS } from "@/lib/niche/niche-apps-catalog"
import { NICHE_MARKETPLACE_CATALOG } from "@/lib/niche/niche-marketplace-entries"
import { NICHE_AUTOPOOL_ENTRIES } from "@/lib/niche/niche-marketplace-entries"

describe("niche marketplace catalog", () => {
  it("resolveSku encuentra los 11 SKUs de nicho", () => {
    for (const app of NICHE_APPS) {
      const resolved = resolveSku(app.sku)
      expect(resolved, app.sku).not.toBeNull()
      expect(resolved?.nombre).toBe(app.nombre)
      expect(resolved?.autoCertLevel).toBe("GLOBAL_AUTO")
    }
  })

  it("NICHE_MARKETPLACE_CATALOG alineado con NICHE_APPS", () => {
    expect(NICHE_MARKETPLACE_CATALOG).toHaveLength(NICHE_APPS.length)
    for (const entry of NICHE_MARKETPLACE_CATALOG) {
      expect(entry.trialDias).toBe(14)
      expect(entry.paisesHabilitados).toContain("AR")
      expect(entry.status).toBe("disponible")
    }
  })

  it("NICHE_AUTOPOOL_ENTRIES usa nicho_latam", () => {
    expect(NICHE_AUTOPOOL_ENTRIES).toHaveLength(NICHE_APPS.length)
    for (const entry of NICHE_AUTOPOOL_ENTRIES) {
      expect(entry.nicho).toBe("nicho_latam")
      expect(entry.activacionMinutos).toBeLessThanOrEqual(5)
    }
  })

  it("prestamista depende de fiado en marketplace", () => {
    const prestamista = NICHE_MARKETPLACE_CATALOG.find((e) => e.sku === "niche.prestamo_barrio")
    expect(prestamista?.dependeDe).toContain("pos.fiado_barrio")
  })
})