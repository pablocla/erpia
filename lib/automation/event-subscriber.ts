import { eventBus } from "@/lib/events/event-bus"
import type { ERPEvent, StockActualizadoPayload } from "@/lib/events/types"
import { emitToN8n } from "./n8n-bridge"
import { mapErpEventToNop } from "./events-catalog"
import { buildIdempotencyKey } from "./sign-payload"

const HANDLER = "automation_n8n_bridge"

async function handleErpEvent(event: ERPEvent) {
  const empresaId = event.empresaId ?? (event.payload as { empresaId?: number })?.empresaId
  if (!empresaId) return

  const nopKey = mapErpEventToNop(event.type)
  if (!nopKey) return

  await emitToN8n(
    empresaId,
    nopKey,
    { erpEvent: event.type, payload: event.payload },
    buildIdempotencyKey(empresaId, nopKey, `${event.type}-${Date.now()}`)
  )
}

async function handleStockBajo(event: ERPEvent<StockActualizadoPayload>) {
  const { productoId, cantidadNueva } = event.payload
  const producto = await prismaProductoStock(productoId)
  if (!producto) return
  const empresaId = producto.empresaId
  if (cantidadNueva > producto.stockMinimo) return

  await emitToN8n(
    empresaId,
    "STOCK_BAJO",
    {
      productoId,
      nombre: producto.nombre,
      stock: cantidadNueva,
      stockMinimo: producto.stockMinimo,
    },
    buildIdempotencyKey(empresaId, "STOCK_BAJO", `prod-${productoId}`)
  )
}

async function prismaProductoStock(productoId: number) {
  const { prisma } = await import("@/lib/prisma")
  return prisma.producto.findUnique({
    where: { id: productoId },
    select: { empresaId: true, nombre: true, stockMinimo: true },
  })
}

export function registerAutomationEventHandlers() {
  const types = [
    "FACTURA_EMITIDA",
    "NC_EMITIDA",
    "CAJA_CERRADA",
    "COMPRA_REGISTRADA",
    "OC_APROBADA",
    "PRESUPUESTO_APROBADO",
  ] as const

  for (const t of types) {
    eventBus.on(t, HANDLER, handleErpEvent)
  }

  eventBus.on<StockActualizadoPayload>(
    "STOCK_ACTUALIZADO",
    `${HANDLER}_stock`,
    handleStockBajo
  )
}