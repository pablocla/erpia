import { obtenerCredencialesIntegracion } from "@/lib/integrations/credentials"

export class WooCommerceApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = "WooCommerceApiError"
  }
}

function normalizeSiteUrl(url: string): string {
  return url.trim().replace(/\/$/, "")
}

function authHeader(key: string, secret: string): string {
  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`
}

async function wooCreds(empresaId: number) {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "woocommerce")
  const { siteUrl, consumerKey, consumerSecret } = credenciales
  if (!siteUrl || !consumerKey || !consumerSecret) {
    throw new WooCommerceApiError("WOOCOMMERCE_NO_CONFIGURADO", 401)
  }
  return {
    siteUrl: normalizeSiteUrl(siteUrl),
    consumerKey,
    consumerSecret,
  }
}

export async function wooFetch<T>(
  empresaId: number,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { siteUrl, consumerKey, consumerSecret } = await wooCreds(empresaId)
  const res = await fetch(`${siteUrl}/wp-json/wc/v3${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(consumerKey, consumerSecret),
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new WooCommerceApiError(body || res.statusText, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export interface WooProduct {
  id: number
  name: string
  sku: string
  stock_quantity: number | null
  price: string
  status: string
}

export interface WooOrder {
  id: number
  number: string
  status: string
  total: string
  billing?: { first_name?: string; last_name?: string; email?: string; phone?: string }
  line_items: Array<{
    name: string
    quantity: number
    price: number
    sku: string
    product_id: number
  }>
}