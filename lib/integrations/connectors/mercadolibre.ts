import { obtenerConfigML } from "@/lib/mercadolibre/mercadolibre-service"
import type { ConnectionContext, IntegrationConnector } from "../types"
import { fail, ok, requireFields } from "./base"

export const mercadoLibreConnector: IntegrationConnector = {
  id: "mercado_libre",

  async testConnection(ctx: ConnectionContext) {
    const token = ctx.credenciales.accessToken
    if (!token?.trim()) {
      const legacy = await obtenerConfigML(ctx.empresaId)
      if (legacy?.accessToken) {
        return ok("Mercado Libre configurado (credenciales existentes)")
      }
      return fail("Conectá tu cuenta con OAuth o ingresá el Access Token")
    }

    try {
      const res = await fetch("https://api.mercadolibre.com/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return fail("Token de Mercado Libre inválido")
      const data = await res.json() as { nickname?: string; id?: number }
      return ok(`Vendedor ML: ${data.nickname ?? data.id}`)
    } catch {
      return fail("Error de red al verificar Mercado Libre")
    }
  },

  async onConnect(empresaId, credenciales) {
    const { guardarConfigML } = await import("@/lib/mercadolibre/mercadolibre-service")
    await guardarConfigML(empresaId, {
      clientId: credenciales.clientId ?? "",
      clientSecret: credenciales.clientSecret ?? "",
      accessToken: credenciales.accessToken,
      refreshToken: credenciales.refreshToken,
      sellerId: credenciales.sellerId,
    })
    return { cuentaExterna: credenciales.sellerId ?? "Mercado Libre", estado: "conectado" }
  },
}