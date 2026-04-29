import { eventBus } from "@/lib/events/event-bus";
import { prisma } from "@/lib/prisma";
import type { FacturaEmitidaPayload } from "@/lib/events/types";

// Handler for FACTURA_EMITIDA
eventBus.on<FacturaEmitidaPayload>("FACTURA_EMITIDA", async (event) => {
  console.info(`[EVENT] FACTURA_EMITIDA -> facturaId=${event.payload.facturaId}`);

  try {
    const factura = await prisma.factura.findUnique({
      where: { id: event.payload.facturaId },
      include: { items: true },
    });

    if (!factura) {
      console.error(`[EVENT] FACTURA_EMITIDA -> Factura no encontrada: ${event.payload.facturaId}`);
      return;
    }

    for (const item of factura.items) {
      await prisma.movimientoStock.create({
        data: {
          productoId: item.productoId,
          tipo: "salida",
          cantidad: item.cantidad,
          motivo: "Venta",
        },
      });
    }

    console.info(`[EVENT] FACTURA_EMITIDA -> Movimientos de stock creados para facturaId=${event.payload.facturaId}`);
  } catch (error) {
    console.error(`[EVENT] FACTURA_EMITIDA -> Error procesando evento:`, error);
  }
});