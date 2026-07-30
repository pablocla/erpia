/**
 * Mercados Claver (multinacional) — país → mercado → locale / moneda / pagos / mensajería.
 * Fuente de verdad comercial-geo. Docs: docs/comercial/US_MARKET_APPS_MULTINATIONAL.md
 */

import type { AppLocale } from "@/lib/i18n/types"

export type MarketId = "ar" | "us" | "mx" | "br"

export type MarketCurrency = "ARS" | "USD" | "MXN" | "BRL"

export type MarketMessaging = "whatsapp" | "sms" | "email"

export type MarketPayments = "mercadopago" | "stripe" | "mercadopago_mx"

export interface MarketConfig {
  id: MarketId
  /** ISO 3166-1 alpha-2 countries that map to this market */
  countries: readonly string[]
  locale: AppLocale
  currency: MarketCurrency
  /** BCP 47 for Intl */
  localeTag: string
  messaging: MarketMessaging
  payments: MarketPayments
  /** Marketing flag emoji */
  flag: string
  /** Short label for UI */
  label: string
  labelEn: string
  /** Default home hero pain keys for this market */
  defaultHomePath: string
  appsCatalogPath: string
  /** Hide AR-only fiscal products in vitrines */
  hideFiscalLocal: boolean
}

export const MARKETS: Record<MarketId, MarketConfig> = {
  ar: {
    id: "ar",
    countries: ["AR", "UY", "PY", "BO", "CL"],
    locale: "es-AR",
    currency: "ARS",
    localeTag: "es-AR",
    messaging: "whatsapp",
    payments: "mercadopago",
    flag: "🇦🇷",
    label: "Argentina",
    labelEn: "Argentina",
    defaultHomePath: "/",
    appsCatalogPath: "/claver/apps",
    hideFiscalLocal: false,
  },
  us: {
    id: "us",
    countries: ["US", "CA", "GB", "AU", "NZ", "IE"],
    locale: "en-US",
    currency: "USD",
    localeTag: "en-US",
    messaging: "sms",
    payments: "stripe",
    flag: "🇺🇸",
    label: "United States",
    labelEn: "United States",
    defaultHomePath: "/",
    appsCatalogPath: "/claver/apps",
    hideFiscalLocal: true,
  },
  mx: {
    id: "mx",
    countries: ["MX", "CO", "PE", "EC", "CR", "PA", "GT", "HN", "SV", "NI", "DO"],
    locale: "es-MX",
    currency: "MXN",
    localeTag: "es-MX",
    messaging: "whatsapp",
    payments: "mercadopago_mx",
    flag: "🇲🇽",
    label: "México / LATAM",
    labelEn: "Mexico / LATAM",
    defaultHomePath: "/",
    appsCatalogPath: "/claver/apps",
    hideFiscalLocal: true,
  },
  br: {
    id: "br",
    countries: ["BR"],
    locale: "pt-BR",
    currency: "BRL",
    localeTag: "pt-BR",
    messaging: "whatsapp",
    payments: "mercadopago",
    flag: "🇧🇷",
    label: "Brasil",
    labelEn: "Brazil",
    defaultHomePath: "/",
    appsCatalogPath: "/claver/apps",
    hideFiscalLocal: true,
  },
}

export const DEFAULT_MARKET_ID: MarketId = "ar"

export const MARKET_COOKIE = "CLAVER_MARKET"
export const LOCALE_COOKIE = "NEXT_LOCALE"
/** User explicitly chose market/locale — do not override with IP */
export const MARKET_LOCKED_COOKIE = "CLAVER_MARKET_LOCKED"

const COUNTRY_TO_MARKET: Record<string, MarketId> = (() => {
  const map: Record<string, MarketId> = {}
  for (const market of Object.values(MARKETS)) {
    for (const c of market.countries) {
      map[c.toUpperCase()] = market.id
    }
  }
  return map
})()

export function isMarketId(value: string | null | undefined): value is MarketId {
  return value === "ar" || value === "us" || value === "mx" || value === "br"
}

export function marketFromCountry(countryCode: string | null | undefined): MarketId {
  if (!countryCode) return DEFAULT_MARKET_ID
  return COUNTRY_TO_MARKET[countryCode.trim().toUpperCase()] ?? DEFAULT_MARKET_ID
}

export function getMarketConfig(id: MarketId | string | null | undefined): MarketConfig {
  if (id && isMarketId(id)) return MARKETS[id]
  return MARKETS[DEFAULT_MARKET_ID]
}

export function marketFromLocale(locale: string | null | undefined): MarketId {
  switch (locale) {
    case "en-US":
    case "en":
      return "us"
    case "es-MX":
      return "mx"
    case "pt-BR":
      return "br"
    case "es-AR":
    case "es":
    default:
      return "ar"
  }
}

export function formatMarketPrice(
  amount: number,
  marketId: MarketId,
  opts?: { maximumFractionDigits?: number },
): string {
  const market = getMarketConfig(marketId)
  if (amount === 0) {
    return market.id === "us" ? "Free" : "Gratis"
  }
  return new Intl.NumberFormat(market.localeTag, {
    style: "currency",
    currency: market.currency,
    maximumFractionDigits: opts?.maximumFractionDigits ?? 0,
  }).format(amount)
}
