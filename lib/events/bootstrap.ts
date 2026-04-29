/**
 * Event Bus — Handler Bootstrap
 *
 * Import this file to register all event handlers at application startup.
 * Each module self-registers its handlers when imported.
 */

// Contabilidad handlers (asientos automáticos)
import { eventBus } from "./event-bus"
import { onFacturaEmitida, onCompraRegistrada, onNCEmitida } from "@/lib/contabilidad/factura-hooks"
import type { FacturaEmitidaPayload, CompraRegistradaPayload, NCEmitidaPayload } from "./types"

// Register contabilidad handlers
eventBus.on<FacturaEmitidaPayload>("FACTURA_EMITIDA", "asiento_venta", async (event) => {
  await onFacturaEmitida(event.payload.facturaId)
})

eventBus.on<CompraRegistradaPayload>("COMPRA_REGISTRADA", "asiento_compra", async (event) => {
  await onCompraRegistrada(event.payload.compraId)
})

eventBus.on<NCEmitidaPayload>("NC_EMITIDA", "asiento_nc", async (event) => {
  await onNCEmitida(event.payload.notaCreditoId)
})

// Stock handlers (self-registering)
import "@/lib/stock/stock-service"

// Producto handlers (self-registering)
import "@/lib/producto/producto-event-handlers"

// CC/CP handlers (self-registering)
import "@/lib/cc-cp/cuentas-service"

export { eventBus }
