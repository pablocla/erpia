import { describe, expect, it } from "vitest"
import {
  CLAVER_PRODUCTION_ORIGIN,
  CORE_ERP_MODULES,
  FACEBOOK_CAMPAIGN_ERP_CORE,
  FACEBOOK_LANDING_PATH,
  buildFacebookCampaignUrl,
  isSafeDashboardPath,
  productionFacebookUrl,
} from "@/lib/marketing/facebook-campaigns"
import {
  emptyAttribution,
  hasCampaignSignal,
  mergeAttribution,
  parseAttributionFromSearch,
} from "@/lib/analytics/campaign-attribution"
import { allNavItems, isNavItemActive } from "@/lib/claver-cloud/nav-config"

describe("Facebook campaigns — link y CORE ERP", () => {
  it("arma el link de producción con UTMs de Facebook hacia /erp", () => {
    const url = productionFacebookUrl()
    expect(url.startsWith(`${CLAVER_PRODUCTION_ORIGIN}${FACEBOOK_LANDING_PATH}?`)).toBe(true)
    expect(url).toContain("utm_source=facebook")
    expect(url).toContain("utm_medium=paid")
    expect(url).toContain("utm_campaign=erp-core")
    expect(url).toContain("utm_content=video")
    expect(url).toContain("ref=fb")
    expect(url).not.toContain("/f?")
    expect(url.toLowerCase()).not.toContain("fiado")
  })

  it("usa el mismo path en localhost", () => {
    const local = buildFacebookCampaignUrl("http://localhost:3000")
    expect(local).toBe(
      "http://localhost:3000/erp?utm_source=facebook&utm_medium=paid&utm_campaign=erp-core&utm_content=video&ref=fb",
    )
  })

  it("expone módulos CORE con rutas de dashboard", () => {
    expect(CORE_ERP_MODULES.length).toBeGreaterThanOrEqual(12)
    for (const mod of CORE_ERP_MODULES) {
      expect(isSafeDashboardPath(mod.dashboardPath)).toBe(true)
    }
    const ids = CORE_ERP_MODULES.map((m) => m.id)
    expect(ids).toEqual(expect.arrayContaining(["pos", "caja", "stock", "facturas", "compras", "contabilidad"]))
    expect(ids).not.toContain("fiado")
  })

  it("el copy de la campaña no ancla en fiado", () => {
    expect(FACEBOOK_CAMPAIGN_ERP_CORE.headline.toLowerCase()).not.toContain("fiado")
    expect(FACEBOOK_CAMPAIGN_ERP_CORE.textoPrincipal.toLowerCase()).not.toContain("fiado")
  })
})

describe("Atribución de campaña", () => {
  it("parsea utm y fbclid de la query", () => {
    const attr = parseAttributionFromSearch(
      "?utm_source=facebook&utm_campaign=erp-core&fbclid=abc123&ref=fb",
      "/erp",
    )
    expect(attr.utmSource).toBe("facebook")
    expect(attr.utmCampaign).toBe("erp-core")
    expect(attr.fbclid).toBe("abc123")
    expect(attr.landingPath).toBe("/erp")
    expect(hasCampaignSignal(attr)).toBe(true)
  })

  it("conserva la atribución previa si la URL siguiente no trae UTM", () => {
    const stored = parseAttributionFromSearch("?utm_source=facebook&ref=fb", "/erp")
    const next = mergeAttribution(parseAttributionFromSearch("", "/dashboard/pos"), stored)
    expect(next.utmSource).toBe("facebook")
    expect(next.ref).toBe("fb")
  })

  it("emptyAttribution no tiene señal", () => {
    expect(hasCampaignSignal(emptyAttribution())).toBe(false)
  })
})

describe("Claver Cloud nav — Campañas Facebook", () => {
  it("incluye el ítem admin bajo /claver-cloud/campanas/facebook", () => {
    const item = allNavItems.find((i) => i.name === "facebookCampaigns")
    expect(item).toBeDefined()
    expect(item?.href).toBe("/claver-cloud/campanas/facebook")
    expect(isNavItemActive("/claver-cloud/campanas/facebook", item!)).toBe(true)
    expect(isNavItemActive("/claver-cloud/analytics", item!)).toBe(false)
  })
})
