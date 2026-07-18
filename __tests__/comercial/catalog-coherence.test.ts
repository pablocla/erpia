/**
 * Coherencia de catálogo comercial.
 * Combina checks del prompt (bloque Y) + validaciones post-auditoría Grok/Gemini.
 */

import { describe, expect, it } from "vitest"
import {
  COMBATE_APPS_SLUGS,
  HOME_COMBATE_SLUGS,
  PRODUCT_ENTRIES,
  isCombateAppSlug,
} from "@/lib/comercial/go-to-market-vitrine"
import {
  SUB_SAAS_APPS,
  SUB_SAAS_MARKETPLACE_ORDER,
  SUB_SAAS_SLUGS,
  getSubSaasApp,
  isSubSaasFuncionalActiva,
  sortSubSaasForMarketplace,
  subSaasMarketplaceGroups,
} from "@/lib/comercial/sub-saas-catalog"
import { resolveActivarIntent } from "@/lib/comercial/activar-intent"
import { PACKS_HOME_STRIP, PRODUCTOS_ENTRADA } from "@/lib/comercial/commercial-packaging"
import { MARKETPLACE_BUNDLES } from "@/lib/marketplace/bundles"
import { getEngancheBySku } from "@/lib/marketplace/enganche-catalog"
import {
  OFERTA_FIADO_ANCLA,
  OFERTAS_COMERCIALES,
  resolveOferta,
} from "@/lib/comercial/ofertas-comerciales"
import { isSkuProvisionable } from "@/lib/marketplace/sku-availability"

describe("catalog-coherence", () => {
  it("pos.fiado_barrio es ancla $0 en engache, sub-saas y ofertas", () => {
    const eng = getEngancheBySku("pos.fiado_barrio")
    const sub = getSubSaasApp("fiado")
    expect(eng?.precioArs).toBe(0)
    expect(sub?.precioArs).toBe(0)
    expect(OFERTA_FIADO_ANCLA.anclaGratis).toContain("pos.fiado_barrio")
    expect(OFERTAS_COMERCIALES.some((o) => o.anclaGratis.includes("pos.fiado_barrio"))).toBe(true)
    expect(resolveOferta("pos.fiado_barrio", "fiado").id).toBe("fiado-ancla")
  })

  it("HOME_COMBATE_SLUGS están en SUB_SAAS_APPS y resuelven activar intent", () => {
    for (const slug of HOME_COMBATE_SLUGS) {
      expect(SUB_SAAS_SLUGS).toContain(slug)
      expect(getSubSaasApp(slug)).toBeTruthy()
      const intent = resolveActivarIntent(slug)
      expect(intent, `activar intent null for ${slug}`).toBeTruthy()
      expect(intent!.landingPath.length).toBeGreaterThan(0)
    }
  })

  it("COMBATE_APPS_SLUGS tienen PRODUCT_ENTRIES (Record, no array)", () => {
    for (const slug of COMBATE_APPS_SLUGS) {
      expect(isCombateAppSlug(slug)).toBe(true)
      expect(PRODUCT_ENTRIES[slug], `PRODUCT_ENTRIES missing ${slug}`).toBeTruthy()
      expect(PRODUCT_ENTRIES[slug].ctaPrimaryActivar).toBe(slug)
      expect(PRODUCT_ENTRIES[slug].slug).toBe(slug)
    }
  })

  it("PACKS_HOME_STRIP existen en MARKETPLACE_BUNDLES por id (no sku)", () => {
    expect(PACKS_HOME_STRIP.length).toBeGreaterThanOrEqual(3)
    for (const pack of PACKS_HOME_STRIP) {
      const bundle = MARKETPLACE_BUNDLES.find((b) => b.id === pack.id)
      expect(bundle, `bundle missing ${pack.id}`).toBeTruthy()
      expect(pack.precioArs).toBeGreaterThan(0)
      expect(bundle!.precioPackArs).toBe(pack.precioArs)
    }
  })

  it("PRODUCTOS_ENTRADA y home combate son provisionables", () => {
    for (const p of PRODUCTOS_ENTRADA) {
      expect(isSkuProvisionable(p.sku), `${p.sku} planned-only`).toBe(true)
    }
    for (const slug of HOME_COMBATE_SLUGS) {
      const app = getSubSaasApp(slug)!
      expect(isSkuProvisionable(app.sku), app.sku).toBe(true)
    }
  })

  it("cobra y turnos tienen precio de pago; fiado no", () => {
    expect(getSubSaasApp("cobra")!.precioArs).toBeGreaterThan(0)
    expect(getSubSaasApp("turnos")!.precioArs).toBeGreaterThan(0)
    expect(getSubSaasApp("fiado")!.precioArs).toBe(0)
  })

  it("sub-saas disponibles tienen dashboard y listoPct >= 60", () => {
    const disponibles = SUB_SAAS_APPS.filter((a) => a.estado === "disponible")
    expect(disponibles.length).toBeGreaterThanOrEqual(8)
    for (const app of disponibles) {
      expect(app.dashboardPath.startsWith("/dashboard")).toBe(true)
      expect(app.listoPct).toBeGreaterThanOrEqual(60)
    }
  })

  it("marketplace ordena fiado/cobra/turnos primero y separa activas vs beta", () => {
    expect(SUB_SAAS_MARKETPLACE_ORDER.slice(0, 3)).toEqual(["fiado", "cobra", "turnos"])
    const ordered = sortSubSaasForMarketplace(SUB_SAAS_APPS)
    expect(ordered[0].slug).toBe("fiado")
    expect(ordered[1].slug).toBe("cobra")
    expect(ordered[2].slug).toBe("turnos")

    const { activas, beta } = subSaasMarketplaceGroups()
    expect(activas.every(isSubSaasFuncionalActiva)).toBe(true)
    expect(activas.map((a) => a.slug)).toContain("fiado")
    expect(activas.map((a) => a.slug)).toContain("cobra")
    expect(beta.every((a) => a.estado === "beta")).toBe(true)
    expect(beta.map((a) => a.slug)).not.toContain("fiado")
  })
})
