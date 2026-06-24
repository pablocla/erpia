import type { ConnectionContext, IntegrationConnector } from "../types"
import { fail, ok } from "./base"

export function createWebhookConnector(
  id: string,
  nombre: string,
  urlKey: string,
): IntegrationConnector {
  return {
    id,
    async testConnection(ctx: ConnectionContext) {
      const url = ctx.credenciales[urlKey]?.trim()
      if (!url) return fail(`Ingresá la URL del webhook de ${nombre}`)

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "claverp.test_connection",
            integracion: id,
            timestamp: new Date().toISOString(),
            mensaje: "Prueba de conexión desde Claverp ERP",
          }),
        })
        if (res.ok || res.status === 204) {
          return ok(`${nombre}: webhook respondió OK (${res.status})`)
        }
        return fail(`${nombre}: webhook respondió ${res.status}`)
      } catch {
        return fail(`No se pudo contactar el webhook de ${nombre}`)
      }
    },
  }
}