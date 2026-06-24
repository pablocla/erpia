import { obtenerCredencialesIntegracion, guardarCredencialesIntegracion } from "@/lib/integrations/credentials"
import { refreshMLToken } from "@/lib/integrations/oauth/mercadolibre-oauth"

const API = "https://api.mercadolibre.com"

export class MercadoLibreApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = "MercadoLibreApiError"
  }
}

async function ensureAccessToken(empresaId: number): Promise<{ token: string; sellerId: string }> {
  const { row, credenciales } = await obtenerCredencialesIntegracion(empresaId, "mercado_libre")
  const token = credenciales.accessToken
  const sellerId = credenciales.sellerId
  if (!token || !sellerId) {
    throw new MercadoLibreApiError("MERCADO_LIBRE_NO_CONFIGURADO", 401)
  }

  const expiresAt = row?.tokenExpiresAt
  const needsRefresh = expiresAt && expiresAt.getTime() < Date.now() + 60_000
  if (needsRefresh && credenciales.refreshToken) {
    const refreshed = await refreshMLToken(credenciales.refreshToken)
    await guardarCredencialesIntegracion(empresaId, "mercado_libre", {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      sellerId: String(refreshed.user_id),
    }, {
      tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
    })
    return { token: refreshed.access_token, sellerId: String(refreshed.user_id) }
  }

  return { token, sellerId }
}

export async function mlFetch<T>(
  empresaId: number,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { token } = await ensureAccessToken(empresaId)
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new MercadoLibreApiError(body || res.statusText, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export interface MLItemSearchResult {
  results: string[]
  paging: { total: number; offset: number; limit: number }
}

export interface MLItem {
  id: string
  title: string
  price: number
  available_quantity: number
  status: string
  permalink?: string
  seller_custom_field?: string | null
  attributes?: Array<{ id: string; value_name?: string }>
}

export interface MLOrder {
  id: number
  status: string
  total_amount: number
  buyer: { id: number; nickname?: string; first_name?: string; last_name?: string }
  order_items: Array<{
    item: { id: string; title: string; seller_custom_field?: string | null }
    quantity: number
    unit_price: number
  }>
  date_created: string
}

export interface MLOrderSearchResult {
  results: MLOrder[]
  paging: { total: number; offset: number; limit: number }
}