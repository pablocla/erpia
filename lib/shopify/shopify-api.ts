import { obtenerCredencialesIntegracion } from "@/lib/integrations/credentials"

const API_VERSION = "2024-10"

export class ShopifyApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = "ShopifyApiError"
  }
}

export function normalizeShopDomain(domain: string): string {
  let d = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "")
  if (!d.includes(".")) d = `${d}.myshopify.com`
  return d
}

async function shopCreds(empresaId: number) {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "shopify")
  const token = credenciales.accessToken
  const shopDomain = credenciales.shopDomain
  if (!token || !shopDomain) throw new ShopifyApiError("SHOPIFY_NO_CONFIGURADO", 401)
  return { token, shopDomain: normalizeShopDomain(shopDomain) }
}

export async function shopifyFetch<T>(
  empresaId: number,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { token, shopDomain } = await shopCreds(empresaId)
  const res = await fetch(`https://${shopDomain}/admin/api/${API_VERSION}${path}`, {
    ...init,
    headers: {
      "X-Shopify-Access-Token": token,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new ShopifyApiError(body || res.statusText, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export interface ShopifyProduct {
  id: number
  title: string
  status: string
  variants: Array<{
    id: number
    sku: string | null
    price: string
    inventory_quantity: number
    inventory_item_id: number
  }>
}

export interface ShopifyOrder {
  id: number
  name: string
  email?: string
  total_price: string
  financial_status: string
  line_items: Array<{
    name: string
    quantity: number
    price: string
    sku: string | null
    product_id: number | null
  }>
  customer?: { first_name?: string; last_name?: string; email?: string }
}

export interface ShopifyLocation {
  id: number
  name: string
  active: boolean
}