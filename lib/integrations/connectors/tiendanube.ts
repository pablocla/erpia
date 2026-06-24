import type { ConnectionContext, IntegrationConnector } from "../types"
import { fail, ok } from "./base"

export const tiendaNubeConnector: IntegrationConnector = {
  id: "tienda_nube",

  async testConnection(ctx: ConnectionContext) {
    const token = ctx.credenciales.accessToken
    const storeId = ctx.credenciales.storeId
    if (!token?.trim() || !storeId?.trim()) {
      return fail("Conectá tu tienda con OAuth o ingresá Access Token y Store ID")
    }

    try {
      const appName = process.env.TN_APP_NAME ?? "Claverp ERP"
      const contact = process.env.TN_CONTACT_EMAIL ?? "soporte@claverp.com"
      const res = await fetch(`https://api.tiendanube.com/v1/${storeId}/store`, {
        headers: {
          Authentication: `bearer ${token}`,
          "User-Agent": `${appName} (${contact})`,
          Accept: "application/json",
        },
      })
      if (!res.ok) return fail("Token de Tienda Nube inválido")
      const data = await res.json() as { name?: { es?: string }; id?: number }
      return ok(`Tienda: ${data.name?.es ?? data.id ?? storeId}`)
    } catch {
      return fail("Error de red al verificar Tienda Nube")
    }
  },

  async onConnect(empresaId, credenciales) {
    const { guardarConfigTN } = await import("@/lib/tiendanube/tiendanube-service")
    await guardarConfigTN(empresaId, {
      accessToken: credenciales.accessToken ?? "",
      storeId: credenciales.storeId ?? "",
    })
    return {
      cuentaExterna: credenciales.storeId ? `TN #${credenciales.storeId}` : "Tienda Nube",
      estado: "conectado",
    }
  },
}