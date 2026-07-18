import { describe, it, expect } from "vitest"
import { ENGANCHES } from "@/lib/marketplace/enganche-catalog"
import { SUB_SAAS_APPS } from "@/lib/comercial/sub-saas-catalog"
import { NICHE_APPS } from "@/lib/niche/niche-apps-catalog"

const PISO_ARS = 10_000
const ANCLAS_GRATIS = new Set(["pos.fiado_barrio", "core.claver"])

describe("Política Comercial - Precio Mínimo", () => {
  it("todo precio de pago en ENGANCHES debe ser >= 10000 o ser ancla gratis", () => {
    for (const e of ENGANCHES) {
      if (!ANCLAS_GRATIS.has(e.sku) && e.precioArs > 0) {
        expect(e.precioArs, `SKU enganche ${e.sku} tiene precio ${e.precioArs} menor a ${PISO_ARS}`).toBeGreaterThanOrEqual(PISO_ARS)
      }
    }
  })

  it("todo precio de pago en SUB_SAAS_APPS debe ser >= 10000 o ser ancla gratis", () => {
    for (const app of SUB_SAAS_APPS) {
      if (!ANCLAS_GRATIS.has(app.sku) && app.precioArs > 0) {
        expect(app.precioArs, `App ${app.slug} (sku: ${app.sku}) tiene precio ${app.precioArs} menor a ${PISO_ARS}`).toBeGreaterThanOrEqual(PISO_ARS)
      }
    }
  })

  it("todo precio de pago en NICHE_APPS debe ser >= 10000 o ser ancla gratis", () => {
    for (const app of NICHE_APPS) {
      if (!ANCLAS_GRATIS.has(app.sku) && app.precioArs > 0) {
        expect(app.precioArs, `Niche app ${app.appId} (sku: ${app.sku}) tiene precio ${app.precioArs} menor a ${PISO_ARS}`).toBeGreaterThanOrEqual(PISO_ARS)
      }
    }
  })
})
