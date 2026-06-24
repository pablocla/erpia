import { obtenerConfigMP } from "@/lib/mercadopago/mercadopago-service"
import type { ConnectionContext, IntegrationConnector } from "../types"
import { fail, ok, requireFields } from "./base"

export const mercadoPagoConnector: IntegrationConnector = {
  id: "mercado_pago",

  async testConnection(ctx: ConnectionContext) {
    const missing = requireFields(ctx, ["accessToken", "publicKey"])
    if (missing) {
      const legacy = await obtenerConfigMP(ctx.empresaId)
      if (legacy?.accessToken && legacy?.publicKey) {
        return ok("Mercado Pago conectado (configuración existente)")
      }
      return missing
    }

    try {
      const res = await fetch("https://api.mercadopago.com/users/me", {
        headers: { Authorization: `Bearer ${ctx.credenciales.accessToken}` },
      })
      if (!res.ok) return fail("Token de Mercado Pago inválido o expirado")
      const data = await res.json() as { nickname?: string; id?: number }
      return ok(`Cuenta MP verificada: ${data.nickname ?? data.id ?? "OK"}`)
    } catch {
      return fail("No se pudo contactar a Mercado Pago")
    }
  },

  async onConnect(empresaId, credenciales) {
    const { guardarConfigMP } = await import("@/lib/mercadopago/mercadopago-service")
    await guardarConfigMP(empresaId, {
      accessToken: credenciales.accessToken,
      publicKey: credenciales.publicKey,
      nombreCuenta: credenciales.nombreCuenta,
      webhookSecret: credenciales.webhookSecret,
    })
    return {
      cuentaExterna: credenciales.nombreCuenta ?? "Mercado Pago",
      estado: "conectado",
    }
  },
}