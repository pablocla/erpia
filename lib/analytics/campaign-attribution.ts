/**
 * Atribución de campañas (UTM + fbclid) persistida en la sesión del navegador.
 * El pulso de Facebook se mide en Claver Cloud aunque el visitante navegue al ERP.
 */

export const CAMPAIGN_STORAGE_KEY = "clv_utm"

export type CampaignAttribution = {
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
  fbclid: string | null
  ref: string | null
  landingPath: string | null
}

export function emptyAttribution(): CampaignAttribution {
  return {
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    fbclid: null,
    ref: null,
    landingPath: null,
  }
}

export function parseAttributionFromSearch(
  search: string,
  pathname: string,
): CampaignAttribution {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
  return {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmContent: params.get("utm_content"),
    fbclid: params.get("fbclid"),
    ref: params.get("ref"),
    landingPath: pathname || null,
  }
}

export function hasCampaignSignal(attr: CampaignAttribution): boolean {
  return Boolean(attr.utmSource || attr.fbclid || attr.ref === "fb")
}

export function mergeAttribution(
  incoming: CampaignAttribution,
  stored: CampaignAttribution | null,
): CampaignAttribution {
  if (hasCampaignSignal(incoming)) return incoming
  return stored ?? incoming
}

export function readStoredAttribution(): CampaignAttribution | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(CAMPAIGN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CampaignAttribution
    if (!parsed || typeof parsed !== "object") return null
    return parsed
  } catch {
    return null
  }
}

export function persistAttribution(attr: CampaignAttribution): void {
  if (typeof window === "undefined") return
  if (!hasCampaignSignal(attr)) return
  try {
    sessionStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(attr))
  } catch {
    // quota / private mode
  }
}

export function captureCampaignAttribution(): CampaignAttribution {
  if (typeof window === "undefined") return emptyAttribution()
  const incoming = parseAttributionFromSearch(window.location.search, window.location.pathname)
  const merged = mergeAttribution(incoming, readStoredAttribution())
  persistAttribution(merged)
  return merged
}

export function attributionToMetadata(attr: CampaignAttribution): Record<string, string | null> {
  return {
    utmSource: attr.utmSource,
    utmMedium: attr.utmMedium,
    utmCampaign: attr.utmCampaign,
    utmContent: attr.utmContent,
    fbclid: attr.fbclid,
    ref: attr.ref,
    landingPath: attr.landingPath,
  }
}
