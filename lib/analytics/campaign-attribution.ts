/**
 * Atribucion de campanas (UTM + fbclid) persistida hasta el registro.
 */

export const CAMPAIGN_STORAGE_KEY = "clv_utm"

export type CampaignAttribution = {
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
  utmTerm: string | null
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
    utmTerm: null,
    fbclid: null,
    ref: null,
    landingPath: null,
  }
}

export function parseAttributionFromSearch(search: string, pathname: string): CampaignAttribution {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
  return {
    utmSource: params.get("utm_source"),
    utmMedium: params.get("utm_medium"),
    utmCampaign: params.get("utm_campaign"),
    utmContent: params.get("utm_content"),
    utmTerm: params.get("utm_term"),
    fbclid: params.get("fbclid"),
    ref: params.get("ref"),
    landingPath: pathname || null,
  }
}

export function hasCampaignSignal(attr: CampaignAttribution): boolean {
  return Boolean(attr.utmSource || attr.utmMedium || attr.utmCampaign || attr.utmContent || attr.utmTerm || attr.fbclid || attr.ref === "fb")
}

export function mergeAttribution(incoming: CampaignAttribution, stored: CampaignAttribution | null): CampaignAttribution {
  if (hasCampaignSignal(incoming)) return incoming
  return stored ?? incoming
}

export function readStoredAttribution(): CampaignAttribution | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY) ?? sessionStorage.getItem(CAMPAIGN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CampaignAttribution
    if (!parsed || typeof parsed !== "object") return null
    return parsed
  } catch {
    return null
  }
}

export function persistAttribution(attr: CampaignAttribution): void {
  if (typeof window === "undefined" || !hasCampaignSignal(attr)) return
  try {
    const value = JSON.stringify(attr)
    localStorage.setItem(CAMPAIGN_STORAGE_KEY, value)
    sessionStorage.setItem(CAMPAIGN_STORAGE_KEY, value)
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
    utmTerm: attr.utmTerm,
    fbclid: attr.fbclid,
    ref: attr.ref,
    landingPath: attr.landingPath,
  }
}
