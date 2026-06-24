import { normalizeShopDomain } from "@/lib/shopify/shopify-api"
import type { ConnectionContext, IntegrationConnector } from "../types"
import { fail, ok, requireFields } from "./base"

export const shopifyConnector: IntegrationConnector = {
  id: "shopify",

  async testConnection(ctx: ConnectionContext) {
    const token = ctx.credenciales.accessToken
    const shopDomain = ctx.credenciales.shopDomain
    if (!token?.trim() || !shopDomain?.trim()) {
      return fail("Conectá con OAuth o ingresá dominio + Access Token")
    }

    try {
      const shop = normalizeShopDomain(shopDomain)
      const res = await fetch(`https://${shop}/admin/api/2024-10/shop.json`, {
        headers: { "X-Shopify-Access-Token": token, Accept: "application/json" },
      })
      if (!res.ok) return fail("Token o dominio Shopify inválido")
      const data = await res.json() as { shop?: { name?: string; myshopify_domain?: string } }
      return ok(`Tienda: ${data.shop?.name ?? data.shop?.myshopify_domain ?? shop}`)
    } catch {
      return fail("Error de red al verificar Shopify")
    }
  },

  async onConnect(empresaId, credenciales) {
    const { guardarConfigShopify } = await import("@/lib/shopify/shopify-service")
    await guardarConfigShopify(empresaId, {
      accessToken: credenciales.accessToken,
      shopDomain: credenciales.shopDomain ?? "",
    })
    const shop = credenciales.shopDomain ? normalizeShopDomain(credenciales.shopDomain) : "Shopify"
    return { cuentaExterna: shop, estado: "conectado" }
  },
}