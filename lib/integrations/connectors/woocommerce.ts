import type { ConnectionContext, IntegrationConnector } from "../types"
import { fail, ok, requireFields } from "./base"

export const wooCommerceConnector: IntegrationConnector = {
  id: "woocommerce",

  async testConnection(ctx: ConnectionContext) {
    const missing = requireFields(ctx, ["siteUrl", "consumerKey", "consumerSecret"])
    if (missing) return missing

    try {
      const site = ctx.credenciales.siteUrl.replace(/\/$/, "")
      const auth = Buffer.from(
        `${ctx.credenciales.consumerKey}:${ctx.credenciales.consumerSecret}`,
      ).toString("base64")
      const res = await fetch(`${site}/wp-json/wc/v3/system_status`, {
        headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
      })
      if (!res.ok) return fail("Credenciales WooCommerce inválidas o REST API deshabilitada")
      return ok(`WooCommerce conectado: ${site}`)
    } catch {
      return fail("Error de red al verificar WooCommerce")
    }
  },

  async onConnect(empresaId, credenciales) {
    const { guardarConfigWoo } = await import("@/lib/woocommerce/woocommerce-service")
    await guardarConfigWoo(empresaId, {
      siteUrl: credenciales.siteUrl,
      consumerKey: credenciales.consumerKey,
      consumerSecret: credenciales.consumerSecret,
    })
    return { cuentaExterna: credenciales.siteUrl, estado: "conectado" }
  },
}