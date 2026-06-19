/** Eventos emitibles hacia n8n / Automation Hub */
export const NOP_AUTOMATION_EVENTS = [
  { key: "VENTA_EMITIDA", label: "Venta emitida", erpEvent: "FACTURA_EMITIDA" },
  { key: "NC_EMITIDA", label: "Nota de crédito", erpEvent: "NC_EMITIDA" },
  { key: "STOCK_BAJO", label: "Stock bajo mínimo", erpEvent: "STOCK_ACTUALIZADO" },
  { key: "CAJA_CERRADA", label: "Caja cerrada", erpEvent: "CAJA_CERRADA" },
  { key: "CAJA_ABIERTA_12H", label: "Caja abierta +12h", erpEvent: null },
  { key: "COMPRA_REGISTRADA", label: "Compra registrada", erpEvent: "COMPRA_REGISTRADA" },
  { key: "OC_APROBADA", label: "OC aprobada", erpEvent: "OC_APROBADA" },
  { key: "PRESUPUESTO_APROBADO", label: "Presupuesto aprobado", erpEvent: "PRESUPUESTO_APROBADO" },
  { key: "PEDIDO_CONFIRMADO", label: "Pedido B2B confirmado", erpEvent: null },
  { key: "CAE_RECHAZADO", label: "CAE rechazado o error", erpEvent: null },
  { key: "CAE_OBTENIDO", label: "CAE obtenido", erpEvent: null },
  { key: "USUARIO_CREADO", label: "Usuario invitado/creado", erpEvent: null },
  { key: "APROBACION_PENDIENTE", label: "Aprobación pendiente", erpEvent: null },
  { key: "TURNO_AGENDA_CREADO", label: "Turno de agenda", erpEvent: null },
  { key: "WEBHOOK_TEST", label: "Prueba de conexión", erpEvent: null },
  { key: "PAGO_MP_RECIBIDO", label: "Pago Mercado Pago", erpEvent: null },
  { key: "CUENTA_VENCIDA", label: "Cuenta por cobrar vencida", erpEvent: null },
  { key: "PEDIDO_ML_RECIBIDO", label: "Pedido Mercado Libre", erpEvent: null },
] as const

export type NopAutomationEventKey = (typeof NOP_AUTOMATION_EVENTS)[number]["key"]

const ERP_TO_NOP: Record<string, NopAutomationEventKey> = {
  FACTURA_EMITIDA: "VENTA_EMITIDA",
  NC_EMITIDA: "NC_EMITIDA",
  CAJA_CERRADA: "CAJA_CERRADA",
  COMPRA_REGISTRADA: "COMPRA_REGISTRADA",
  OC_APROBADA: "OC_APROBADA",
  PRESUPUESTO_APROBADO: "PRESUPUESTO_APROBADO",
}

export function mapErpEventToNop(erpType: string): NopAutomationEventKey | null {
  return ERP_TO_NOP[erpType] ?? null
}