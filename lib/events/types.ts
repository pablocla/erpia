/**
 * Event Bus — Types
 *
 * Union type of all domain events emitted by the ERP.
 * Each event carries a typed payload used by handlers.
 */

export type ERPEventType =
  | "FACTURA_EMITIDA"
  | "COMPRA_REGISTRADA"
  | "NC_EMITIDA"
  | "STOCK_ACTUALIZADO"
  | "RECIBO_EMITIDO"
  | "ORDEN_PAGO_EMITIDA"
  | "PRESUPUESTO_APROBADO"
  | "OC_APROBADA"
  | "REMITO_EMITIDO"
  | "CAJA_CERRADA"
  | "CHEQUE_DEPOSITADO"
  | "CHEQUE_RECHAZADO"

export interface ERPEvent<T = unknown> {
  type: ERPEventType
  payload: T
  timestamp: Date
  userId?: number
  empresaId?: number
}

export interface FacturaEmitidaPayload {
  facturaId: number
  empresaId: number
  clienteId: number
  total: number
  condicionPagoId?: number | null
  depositoId?: number | null
}

export interface CompraRegistradaPayload {
  compraId: number
  proveedorId: number
  total: number
  condicionPagoId?: number | null
  depositoId?: number | null
}

export interface NCEmitidaPayload {
  notaCreditoId: number
  facturaId: number
  clienteId: number
  total: number
  motivo: string
}

export interface StockActualizadoPayload {
  productoId: number
  depositoId?: number
  cantidadAnterior: number
  cantidadNueva: number
  motivo: string
}

export interface ReciboEmitidoPayload {
  reciboId: number
  clienteId: number
  montoTotal: number
  medioPago: string
  cuentasCobrarIds: number[]
}

export interface OrdenPagoEmitidaPayload {
  ordenPagoId: number
  proveedorId: number
  montoTotal: number
  medioPago: string
  cuentasPagarIds: number[]
}

export interface PresupuestoAprobadoPayload {
  presupuestoId: number
  clienteId: number
  total: number
}

export interface OcAprobadaPayload {
  ordenCompraId: number
  proveedorId: number
  total: number
}

export interface RemitoEmitidoPayload {
  remitoId: number
  clienteId: number
  facturaId?: number | null
  depositoId?: number | null
}

export interface CajaCerradaPayload {
  cajaId: number
  empresaId: number
  saldoFinal: number
  diferencia: number
}

export interface ChequeDepositadoPayload {
  chequeId: number
  cuentaBancariaId: number
  monto: number
}

export interface ChequeRechazadoPayload {
  chequeId: number
  monto: number
  motivo: string
}

export type EventHandler<T = unknown> = (event: ERPEvent<T>) => Promise<void>
