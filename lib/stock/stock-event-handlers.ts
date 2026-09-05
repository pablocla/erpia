import { eventBus } from "@/lib/events/event-bus";
import type { FacturaEmitidaPayload } from "@/lib/events/types";

/**
 * Handler de auditoría para FACTURA_EMITIDA en el módulo de stock.
 * Se evita la duplicación de MovimientoStock delegando la deducción real exclusivamente
 * a stockService.decrementarStockPorFactura (registrado bajo el handler "stock_por_venta").
 */
eventBus.on<FacturaEmitidaPayload>("FACTURA_EMITIDA", "audit_stock_por_venta", async (event) => {
  console.info(
    `[STOCK AUDIT] FACTURA_EMITIDA verificada para facturaId=${event.payload.facturaId} (empresaId=${event.payload.empresaId})`
  );
});