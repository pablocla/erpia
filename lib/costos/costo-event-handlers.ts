/**
 * Event handlers de costeo — debe registrarse ANTES que stock-service en bootstrap.
 */

import { eventBus } from "@/lib/events/event-bus"
import type { CompraRegistradaPayload, NCEmitidaPayload } from "@/lib/events/types"
import { prisma } from "@/lib/prisma"
import { actualizarPppPorCompra } from "@/lib/costos/costo-service"

eventBus.on<CompraRegistradaPayload>("COMPRA_REGISTRADA", "ppp_por_compra", async (event) => {
  const compra = await prisma.compra.findUnique({
    where: { id: event.payload.compraId },
    include: { lineas: true },
  })
  if (!compra) return

  for (const linea of compra.lineas) {
    if (!linea.productoId) continue
    await actualizarPppPorCompra(
      linea.productoId,
      linea.cantidad,
      Number(linea.precioUnitario),
      compra.empresaId,
    )
  }
})

eventBus.on<NCEmitidaPayload>("NC_EMITIDA", "cmv_reversa_nc", async (event) => {
  try {
    const { AsientoService } = await import("@/lib/contabilidad/asiento-service")
    const asientoService = new AsientoService()
    await asientoService.generarAsientoCMVReversa(event.payload.notaCreditoId)
  } catch (error) {
    console.error("[EVENT] Error al revertir CMV por NC:", error)
  }
})