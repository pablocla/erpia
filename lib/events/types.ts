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
  | "PRODUCTO_CREADO"
  | "PRODUCTO_ACTUALIZADO"
  | "PRODUCTO_ELIMINADO"
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
  depositoId?: number | null
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

export interface ProductoCreadoPayload {
  productoId: number
  empresaId: number
  codigo: string
  nombre: string
  activo: boolean
  categoriaId?: number | null
  precioVenta: number
  precioCompra: number
  porcentajeIva: number
  esPlato: boolean
  esInsumo: boolean
  stock: number
  stockMinimo: number
}

export interface ProductoActualizadoPayload {
  productoId: number
  empresaId: number
  cambios: {
    codigo?: string
    nombre?: string
    descripcion?: string | null
    precioVenta?: number
    precioCompra?: number
    porcentajeIva?: number
    stockMinimo?: number
    unidad?: string
    categoriaId?: number | null
    activo?: boolean
    esPlato?: boolean
    esInsumo?: boolean
  }
}

export interface ProductoEliminadoPayload {
  productoId: number
  empresaId: number
  activo: boolean
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
