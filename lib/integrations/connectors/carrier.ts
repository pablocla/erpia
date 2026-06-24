import { getCarrier } from "@/lib/logistica/carriers/registry"
import type { ConnectionContext, IntegrationConnector } from "../types"
import { fail, ok, requireFields } from "./base"

export function createCarrierConnector(
  id: string,
  requiredFields: string[],
): IntegrationConnector {
  return {
    id,
    async testConnection(ctx: ConnectionContext) {
      const adapter = getCarrier(id)
      if (!adapter) return fail("Carrier no registrado")

      const missing = requireFields(ctx, requiredFields)
      const result = await adapter.testConnection(ctx.credenciales)
      if (!result.ok && missing) return missing
      return result.ok ? ok(result.mensaje) : fail(result.mensaje)
    },

    async onConnect(empresaId, credenciales) {
      const { guardarCredencialesIntegracion } = await import("@/lib/integrations/credentials")
      await guardarCredencialesIntegracion(empresaId, id, credenciales, {
        cuentaExterna: id === "correo_argentino" ? "PAQ.AR" : id === "andreani" ? "Andreani" : "OCA ePak",
        estado: "conectado",
      })
      return { cuentaExterna: credenciales.contrato ?? credenciales.siteUrl ?? id, estado: "conectado" }
    },
  }
}