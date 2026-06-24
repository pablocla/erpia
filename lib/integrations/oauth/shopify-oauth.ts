import { guardarCredencialesIntegracion } from "../credentials"
import { normalizeShopDomain } from "@/lib/shopify/shopify-api"

const SCOPES = "read_products,write_products,read_orders,read_inventory,write_inventory"

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL
    ?? process.env.NEXT_PUBLIC_APP_URL
    ?? "http://localhost:3000"
}

export function shopifyRedirectUri(): string {
  return process.env.SHOPIFY_REDIRECT_URI
    ?? `${baseUrl()}/api/integrations/oauth/shopify/callback`
}

export function buildShopifyAuthUrl(shopDomain: string, state: string): string | null {
  const clientId = process.env.SHOPIFY_CLIENT_ID
  if (!clientId) return null
  const shop = normalizeShopDomain(shopDomain)
  const params = new URLSearchParams({
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: shopifyRedirectUri(),
    state,
  })
  return `https://${shop}/admin/oauth/authorize?${params}`
}

export async function exchangeShopifyCode(shopDomain: string, code: string) {
  const clientId = process.env.SHOPIFY_CLIENT_ID
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("SHOPIFY_CLIENT_ID y SHOPIFY_CLIENT_SECRET no configurados")
  }

  const shop = normalizeShopDomain(shopDomain)
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  })

  if (!res.ok) {
    throw new Error(`Error OAuth Shopify: ${await res.text()}`)
  }

  return res.json() as Promise<{ access_token: string; scope: string }>
}

export async function guardarTokensShopify(
  empresaId: number,
  shopDomain: string,
  accessToken: string,
) {
  const shop = normalizeShopDomain(shopDomain)
  return guardarCredencialesIntegracion(
    empresaId,
    "shopify",
    { accessToken, shopDomain: shop },
    { cuentaExterna: shop, estado: "conectado" },
  )
}