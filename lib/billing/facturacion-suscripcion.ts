/**
 * Facturación de suscripción → growth loop de afiliados.
 * Enganche desde activarSuscripcionPagada / webhooks MP.
 */

import { prisma } from "@/lib/prisma"
import { getOfertaEmpresa } from "@/lib/comercial/ofertas-comerciales"
import { aplicarPisoPrecioSuscripcion } from "@/lib/comercial/precio-minimo"
import { registrarComisionesPorPago } from "@/lib/partners/affiliate-service"

/**
 * Resuelve monto ARS del periodo a comisionar (mejor esfuerzo).
 * Usa precio de ProductoComercial del primer SKU monetizado o piso comercial.
 */
export async function resolverMontoSuscripcionPagada(
  empresaId: number,
  skus: string[],
): Promise<number> {
  for (const sku of skus) {
    const prod = await prisma.productoComercial.findUnique({
      where: { sku },
      select: { precioArs: true },
    })
    if (prod && Number(prod.precioArs) > 0) {
      return aplicarPisoPrecioSuscripcion(Number(prod.precioArs))
    }
  }

  try {
    const oferta = await getOfertaEmpresa(empresaId)
    // Algunas ofertas exponen precio en metadata — fallback fijo de pack base
    if (oferta.monetizar.includes("core.claver")) {
      return aplicarPisoPrecioSuscripcion(39900)
    }
  } catch {
    /* ignore */
  }

  return aplicarPisoPrecioSuscripcion(39900)
}

/**
 * Llamar cuando se confirma pago de suscripción (MP authorized / mock).
 */
export async function onSuscripcionPagada(params: {
  empresaId: number
  skus: string[]
  montoOverride?: number
}): Promise<{ comisionesCreadas: number }> {
  const monto =
    params.montoOverride != null && params.montoOverride > 0
      ? params.montoOverride
      : await resolverMontoSuscripcionPagada(params.empresaId, params.skus)

  const sku = params.skus[0] ?? "core.claver"
  const result = await registrarComisionesPorPago({
    empresaId: params.empresaId,
    montoPagado: monto,
    sku,
  })

  return { comisionesCreadas: result.creadas }
}
