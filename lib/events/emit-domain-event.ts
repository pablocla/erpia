/**
 * Sprint 3 — Emisión unificada de eventos de dominio.
 * Evita doble llamada directa a hooks + eventBus en rutas dispersas.
 */

import "@/lib/events/bootstrap"
import { eventBus } from "@/lib/events/event-bus"
import { onFacturaEmitida, onCompraRegistrada, onNCEmitida } from "@/lib/contabilidad/factura-hooks"
import type {
  CompraRegistradaPayload,
  FacturaEmitidaPayload,
  NCEmitidaPayload,
} from "@/lib/events/types"

export async function emitFacturaEmitida(payload: FacturaEmitidaPayload): Promise<void> {
  await eventBus.emit<FacturaEmitidaPayload>({
    type: "FACTURA_EMITIDA",
    payload,
    timestamp: new Date(),
  })
}

/** Compat: rutas legacy que solo llamaban onFacturaEmitida directo */
export async function emitFacturaEmitidaLegacy(
  facturaId: number,
  empresaId: number,
  extra?: Partial<FacturaEmitidaPayload>,
): Promise<void> {
  await emitFacturaEmitida({
    facturaId,
    empresaId,
    clienteId: extra?.clienteId ?? 0,
    total: extra?.total ?? 0,
    condicionPagoId: extra?.condicionPagoId ?? null,
    depositoId: extra?.depositoId ?? null,
  })
}

export async function emitCompraRegistrada(payload: CompraRegistradaPayload): Promise<void> {
  await eventBus.emit<CompraRegistradaPayload>({
    type: "COMPRA_REGISTRADA",
    payload,
    timestamp: new Date(),
  })
}

export async function emitNcEmitida(payload: NCEmitidaPayload): Promise<void> {
  await eventBus.emit<NCEmitidaPayload>({
    type: "NC_EMITIDA",
    payload,
    timestamp: new Date(),
  })
}

export { onFacturaEmitida, onCompraRegistrada, onNCEmitida }