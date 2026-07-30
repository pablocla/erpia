/**
 * Logging centralizado de request/response AFIP para auditoría.
 */

import { prisma } from "@/lib/prisma"

export async function logAfip(params: {
  empresaId: number
  webservice: string
  operacion: string
  requestBody?: string
  responseBody?: string
  statusCode?: string
  cae?: string
  facturaId?: number
  duracionMs?: number
  errorMsg?: string
}): Promise<void> {
  try {
    // Truncar bodies enormes para no saturar DB
    const req =
      params.requestBody && params.requestBody.length > 200_000
        ? params.requestBody.slice(0, 200_000) + "…[truncated]"
        : params.requestBody
    const res =
      params.responseBody && params.responseBody.length > 200_000
        ? params.responseBody.slice(0, 200_000) + "…[truncated]"
        : params.responseBody

    await prisma.afipWebserviceLog.create({
      data: {
        ...params,
        requestBody: req,
        responseBody: res,
      },
    })
  } catch {
    console.error("[AfipLog] No se pudo guardar log AFIP")
  }
}

/** Serializa payload SOAP de forma legible (JSON). Preferimos JSON estable sobre XML del lib. */
export function serializeAfipPayload(payload: unknown): string {
  try {
    return JSON.stringify(payload, null, 0)
  } catch {
    return String(payload)
  }
}
