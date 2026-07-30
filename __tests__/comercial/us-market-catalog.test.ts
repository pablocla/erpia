import { describe, expect, it } from "vitest"
import {
  marketFromCountry,
  getMarketConfig,
  isMarketId,
  formatMarketPrice,
} from "@/lib/comercial/markets"
import {
  countryFromHeaders,
  marketFromHeaders,
  parseMarketQuery,
  resolveMarketFromCookiesAndGeo,
  localeFromMarketId,
} from "@/lib/i18n/geo-market"
import {
  US_SAAS_APPS,
  US_SAAS_SLUGS,
  getUsSaasApp,
  getUsAppBySku,
  usMarketplaceGroups,
  fmtPrecioUsd,
} from "@/lib/comercial/us-saas-catalog"
import {
  getMarketCatalogApp,
  getMarketCatalogApps,
  marketCatalogGroups,
  resolveMarketProductIntent,
} from "@/lib/comercial/market-catalog"
import { resolveActivarIntent } from "@/lib/comercial/activar-intent"

describe("markets", () => {
  it("maps countries to markets", () => {
    expect(marketFromCountry("US")).toBe("us")
    expect(marketFromCountry("CA")).toBe("us")
    expect(marketFromCountry("AR")).toBe("ar")
    expect(marketFromCountry("MX")).toBe("mx")
    expect(marketFromCountry("BR")).toBe("br")
    expect(marketFromCountry(null)).toBe("ar")
  })

  it("formats prices per market", () => {
    expect(formatMarketPrice(0, "us")).toBe("Free")
    expect(formatMarketPrice(0, "ar")).toBe("Gratis")
    expect(formatMarketPrice(39, "us")).toContain("39")
  })

  it("validates market ids", () => {
    expect(isMarketId("us")).toBe(true)
    expect(isMarketId("xx")).toBe(false)
    expect(getMarketConfig("us").locale).toBe("en-US")
  })
})

describe("geo-market", () => {
  it("reads vercel / cloudflare country headers", () => {
    const headers: Record<string, string> = { "x-vercel-ip-country": "US" }
    expect(countryFromHeaders((n) => headers[n] ?? null)).toBe("US")
    expect(marketFromHeaders((n) => headers[n] ?? null)).toBe("us")
  })

  it("parses query market/lang", () => {
    expect(parseMarketQuery("us", null)).toBe("us")
    expect(parseMarketQuery(null, "en")).toBe("us")
    expect(parseMarketQuery(null, "es-AR")).toBe("ar")
  })

  it("prefers query over cookie over geo", () => {
    const r = resolveMarketFromCookiesAndGeo({
      marketCookie: "ar",
      localeCookie: "es-AR",
      queryMarket: "us",
      queryLang: null,
      getHeader: () => "AR",
    })
    expect(r.source).toBe("query")
    expect(r.marketId).toBe("us")
    expect(r.locale).toBe("en-US")
  })

  it("uses geo when no cookies", () => {
    const r = resolveMarketFromCookiesAndGeo({
      getHeader: (n) => (n === "cf-ipcountry" ? "GB" : null),
    })
    expect(r.marketId).toBe("us")
    expect(r.source).toBe("geo")
    expect(localeFromMarketId("us")).toBe("en-US")
  })
})

describe("us-saas-catalog", () => {
  it("has unique slugs and real SKUs", () => {
    expect(US_SAAS_APPS.length).toBeGreaterThanOrEqual(12)
    expect(new Set(US_SAAS_SLUGS).size).toBe(US_SAAS_SLUGS.length)
    for (const app of US_SAAS_APPS) {
      expect(app.sku.length).toBeGreaterThan(0)
      expect(app.coreSlug.length).toBeGreaterThan(0)
      expect(app.dashboardPath.startsWith("/")).toBe(true)
      expect(app.pasosActivacion.length).toBeGreaterThan(0)
      expect(app.outcomes.length).toBeGreaterThan(0)
    }
  })

  it("house-tab is free anchor on fiado SKU", () => {
    const ht = getUsSaasApp("house-tab")
    expect(ht?.precioUsd).toBe(0)
    expect(ht?.sku).toBe("pos.fiado_barrio")
    expect(ht?.anclaGratis).toBe(true)
  })

  it("collect maps to cobranzas SKU", () => {
    expect(getUsAppBySku("intang.cobranzas_wa")?.slug).toBe("collect")
    expect(fmtPrecioUsd(39)).toMatch(/\$39/)
  })

  it("groups live apps", () => {
    const g = usMarketplaceGroups()
    expect(g.activas.length).toBeGreaterThan(0)
    expect(g.activas.every((a) => a.estado === "disponible")).toBe(true)
  })
})

describe("market-catalog + activar", () => {
  it("US catalog returns USD apps", () => {
    const apps = getMarketCatalogApps("us")
    expect(apps.some((a) => a.slug === "collect")).toBe(true)
    expect(apps.every((a) => a.currency === "USD")).toBe(true)
    expect(marketCatalogGroups("us").activas.length).toBeGreaterThan(0)
  })

  it("resolves US marketing slug without stealing AR cobra brand", () => {
    const collect = resolveMarketProductIntent("collect")
    expect(collect?.sku).toBe("intang.cobranzas_wa")
    expect(collect?.marca).toContain("Collect")

    const cobra = resolveMarketProductIntent("cobra")
    expect(cobra?.slug).toBe("cobra")
    expect(cobra?.marca).toMatch(/Cobr/i)
  })

  it("activar-intent accepts US slugs", () => {
    const intent = resolveActivarIntent("collect")
    expect(intent?.engancheId).toBe("intang.cobranzas_wa")
    expect(intent?.landingPath).toBe("/dashboard/cuentas-cobrar")
    expect(intent?.marca).toContain("Collect")

    const house = resolveActivarIntent("house-tab")
    expect(house?.engancheId).toBe("pos.fiado_barrio")
    expect(house?.modoLite).toBe("fiado")
  })

  it("getMarketCatalogApp remaps core slug on US market", () => {
    const app = getMarketCatalogApp("us", "cobra")
    expect(app?.slug).toBe("collect")
    expect(app?.marca).toContain("Collect")
  })
})
