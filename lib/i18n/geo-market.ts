/**
 * Edge-safe geo → market detection (Vercel / Cloudflare / custom headers).
 * Used by middleware and server locale resolution.
 */

import {
  DEFAULT_MARKET_ID,
  isMarketId,
  marketFromCountry,
  marketFromLocale,
  type MarketId,
} from "@/lib/comercial/markets"
import type { AppLocale } from "@/lib/i18n/types"
import { i18nConfig } from "@/lib/i18n/config"

/** Headers that may carry ISO country (checked in order). */
export const GEO_COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-country-code",
  "x-forwarded-country",
  "cloudfront-viewer-country",
] as const

export function countryFromHeaders(getHeader: (name: string) => string | null): string | null {
  for (const name of GEO_COUNTRY_HEADERS) {
    const raw = getHeader(name)
    if (!raw) continue
    const code = raw.trim().toUpperCase()
    if (code && code !== "XX" && code !== "T1" && code.length === 2) {
      return code
    }
  }
  return null
}

export function marketFromHeaders(getHeader: (name: string) => string | null): MarketId {
  const country = countryFromHeaders(getHeader)
  return marketFromCountry(country)
}

export function localeFromMarketId(marketId: MarketId): AppLocale {
  switch (marketId) {
    case "us":
      return "en-US"
    case "mx":
      return "es-MX"
    case "br":
      return "pt-BR"
    case "ar":
    default:
      return "es-AR"
  }
}

export function parseMarketQuery(
  marketParam: string | null | undefined,
  langParam: string | null | undefined,
): MarketId | null {
  if (marketParam && isMarketId(marketParam.trim().toLowerCase())) {
    return marketParam.trim().toLowerCase() as MarketId
  }
  if (langParam) {
    const l = langParam.trim().toLowerCase()
    if (l === "en" || l === "en-us") return "us"
    if (l === "es-mx" || l === "mx") return "mx"
    if (l === "pt" || l === "pt-br" || l === "br") return "br"
    if (l === "es" || l === "es-ar" || l === "ar") return "ar"
  }
  return null
}

export function isSupportedLocale(locale: string | null | undefined): locale is AppLocale {
  return !!locale && i18nConfig.supportedLocales.includes(locale as AppLocale)
}

export function resolveMarketFromCookiesAndGeo(input: {
  marketCookie?: string | null
  localeCookie?: string | null
  marketLocked?: string | null
  queryMarket?: string | null
  queryLang?: string | null
  getHeader: (name: string) => string | null
}): { marketId: MarketId; locale: AppLocale; source: "query" | "cookie" | "locale" | "geo" | "default" } {
  const fromQuery = parseMarketQuery(input.queryMarket, input.queryLang)
  if (fromQuery) {
    return { marketId: fromQuery, locale: localeFromMarketId(fromQuery), source: "query" }
  }

  if (input.marketCookie && isMarketId(input.marketCookie)) {
    return {
      marketId: input.marketCookie,
      locale: localeFromMarketId(input.marketCookie),
      source: "cookie",
    }
  }

  if (input.localeCookie && isSupportedLocale(input.localeCookie)) {
    const marketId = marketFromLocale(input.localeCookie)
    return { marketId, locale: input.localeCookie, source: "locale" }
  }

  const geoMarket = marketFromHeaders(input.getHeader)
  if (geoMarket !== DEFAULT_MARKET_ID || countryFromHeaders(input.getHeader)) {
    return {
      marketId: geoMarket,
      locale: localeFromMarketId(geoMarket),
      source: "geo",
    }
  }

  return {
    marketId: DEFAULT_MARKET_ID,
    locale: i18nConfig.defaultLocale,
    source: "default",
  }
}
