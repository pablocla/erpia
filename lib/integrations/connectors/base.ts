import type { ConnectionContext, IntegrationConnector, TestResult } from "../types"

export function ok(mensaje: string, detalle?: string): TestResult {
  return { ok: true, mensaje, detalle }
}

export function fail(mensaje: string, detalle?: string): TestResult {
  return { ok: false, mensaje, detalle }
}

export function requireFields(
  ctx: ConnectionContext,
  fields: string[],
): TestResult | null {
  for (const f of fields) {
    if (!ctx.credenciales[f]?.trim()) {
      return fail(`Falta el campo: ${f}`)
    }
  }
  return null
}

export function createStubConnector(
  id: string,
  nombre: string,
  requiredFields: string[] = [],
): IntegrationConnector {
  return {
    id,
    async testConnection(ctx) {
      const missing = requireFields(ctx, requiredFields)
      if (missing) return missing
      return ok(`${nombre}: credenciales guardadas. Sync disponible en próxima actualización.`)
    },
  }
}