/**
 * Server-side effective market (cookie / locale / default).
 * Geo is applied in middleware before the request reaches here.
 */

import { cookies } from "next/headers"
import {
  DEFAULT_MARKET_ID,
  getMarketConfig,
  isMarketId,
  marketFromLocale,
  type MarketConfig,
  type MarketId,
  MARKET_COOKIE,
  LOCALE_COOKIE,
} from "@/lib/comercial/markets"
import type { AppLocale } from "@/lib/i18n/types"
import { isSupportedLocale, localeFromMarketId } from "@/lib/i18n/geo-market"

export async function getEffectiveMarketId(): Promise<MarketId> {
  const cookieStore = await cookies()
  const marketCookie = cookieStore.get(MARKET_COOKIE)?.value
  if (marketCookie && isMarketId(marketCookie)) return marketCookie

  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value
  if (localeCookie && isSupportedLocale(localeCookie)) {
    return marketFromLocale(localeCookie)
  }

  return DEFAULT_MARKET_ID
}

export async function getEffectiveMarket(): Promise<MarketConfig> {
  return getMarketConfig(await getEffectiveMarketId())
}

export async function getMarketLocale(): Promise<AppLocale> {
  const marketId = await getEffectiveMarketId()
  return localeFromMarketId(marketId)
}
