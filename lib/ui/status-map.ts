export type StatusVariant = "success" | "warning" | "error" | "info" | "neutral"

const FACTURA: Record<string, { variant: StatusVariant; label: string }> = {
  emitida: { variant: "success", label: "Emitida" },
  pendiente_cae: { variant: "warning", label: "Sin CAE" },
  error_cae: { variant: "error", label: "Error CAE" },
  pendiente: { variant: "warning", label: "Pendiente" },
  ticket: { variant: "neutral", label: "Ticket" },
  anulada: { variant: "error", label: "Anulada" },
  borrador: { variant: "neutral", label: "Borrador" },
  rechazada_afip: { variant: "error", label: "Rechazada AFIP" },
  caea_emitida: { variant: "info", label: "CAEA (pend. informar)" },
  caea_informada: { variant: "success", label: "CAEA informada" },
}

const PEDIDO: Record<string, { variant: StatusVariant; label: string }> = {
  borrador: { variant: "neutral", label: "Borrador" },
  confirmado: { variant: "info", label: "Confirmado" },
  en_picking: { variant: "info", label: "En picking" },
  remitido: { variant: "info", label: "Remitido" },
  facturado: { variant: "success", label: "Facturado" },
  anulado: { variant: "error", label: "Anulado" },
}

const NC: Record<string, { variant: StatusVariant; label: string }> = {
  emitida: { variant: "success", label: "Emitida" },
  pendiente_cae: { variant: "warning", label: "Sin CAE" },
  pendiente: { variant: "warning", label: "Pendiente" },
  anulada: { variant: "error", label: "Anulada" },
  error_cae: { variant: "error", label: "Error CAE" },
}

const ND: Record<string, { variant: StatusVariant; label: string }> = {
  emitida: { variant: "success", label: "Emitida" },
  anulada: { variant: "error", label: "Anulada" },
}

const OC: Record<string, { variant: StatusVariant; label: string }> = {
  borrador: { variant: "neutral", label: "Borrador" },
  aprobada: { variant: "info", label: "Aprobada" },
  enviada: { variant: "info", label: "Enviada" },
  parcial: { variant: "warning", label: "Parcial" },
  recibida: { variant: "success", label: "Recibida" },
  facturada: { variant: "success", label: "Facturada" },
  anulada: { variant: "error", label: "Anulada" },
}

const ENVIO: Record<string, { variant: StatusVariant; label: string }> = {
  pendiente: { variant: "warning", label: "Pendiente" },
  en_transito: { variant: "info", label: "En tránsito" },
  entregado: { variant: "success", label: "Entregado" },
  devuelto: { variant: "error", label: "Devuelto" },
}

const PICKING: Record<string, { variant: StatusVariant; label: string }> = {
  pendiente: { variant: "warning", label: "Pendiente" },
  en_proceso: { variant: "info", label: "En proceso" },
  completada: { variant: "success", label: "Completada" },
  anulada: { variant: "error", label: "Anulada" },
}

const PRIORIDAD: Record<string, { variant: StatusVariant; label: string }> = {
  baja: { variant: "neutral", label: "Baja" },
  normal: { variant: "info", label: "Normal" },
  media: { variant: "info", label: "Media" },
  alta: { variant: "warning", label: "Alta" },
  urgente: { variant: "error", label: "Urgente" },
  critica: { variant: "error", label: "Crítica" },
}

const MANTENIMIENTO: Record<string, { variant: StatusVariant; label: string }> = {
  pendiente: { variant: "warning", label: "Pendiente" },
  en_proceso: { variant: "info", label: "En proceso" },
  completada: { variant: "success", label: "Completada" },
  cancelada: { variant: "neutral", label: "Cancelada" },
}

const ORDEN_PRODUCCION: Record<string, { variant: StatusVariant; label: string }> = {
  borrador: { variant: "neutral", label: "Borrador" },
  en_proceso: { variant: "info", label: "En proceso" },
  pausada: { variant: "warning", label: "Pausada" },
  terminada: { variant: "success", label: "Terminada" },
  anulada: { variant: "error", label: "Anulada" },
}

const MERCADOPAGO: Record<string, { variant: StatusVariant; label: string }> = {
  approved: { variant: "success", label: "Aprobado" },
  pending: { variant: "warning", label: "Pendiente" },
  rejected: { variant: "error", label: "Rechazado" },
  refunded: { variant: "info", label: "Reembolsado" },
  cancelled: { variant: "neutral", label: "Cancelado" },
}

const TURNO: Record<string, { variant: StatusVariant; label: string }> = {
  confirmado: { variant: "success", label: "Confirmado" },
  pendiente: { variant: "warning", label: "Pendiente" },
  cancelado: { variant: "error", label: "Cancelado" },
  completado: { variant: "info", label: "Completado" },
}

const CHEQUE: Record<string, { variant: StatusVariant; label: string }> = {
  cartera: { variant: "info", label: "En cartera" },
  depositado: { variant: "info", label: "Depositado" },
  endosado: { variant: "info", label: "Endosado" },
  rechazado: { variant: "error", label: "Rechazado" },
  debitado: { variant: "success", label: "Debitado" },
  anulado: { variant: "neutral", label: "Anulado" },
}

const CAJA: Record<string, { variant: StatusVariant; label: string }> = {
  abierta: { variant: "success", label: "Abierta" },
  cerrada: { variant: "neutral", label: "Cerrada" },
}

const TICKET: Record<string, { variant: StatusVariant; label: string }> = {
  abierto: { variant: "warning", label: "Abierto" },
  en_progreso: { variant: "info", label: "En progreso" },
  resuelto: { variant: "success", label: "Resuelto" },
  cerrado: { variant: "neutral", label: "Cerrado" },
}

function resolve(
  map: Record<string, { variant: StatusVariant; label: string }>,
  estado: string,
): { variant: StatusVariant; label: string } {
  const key = estado.toLowerCase()
  return map[key] ?? {
    variant: "neutral",
    label: estado.replace(/_/g, " "),
  }
}

export function facturaEstadoVariant(estado: string): StatusVariant {
  return resolve(FACTURA, estado).variant
}

export function facturaEstadoLabel(estado: string): string {
  return resolve(FACTURA, estado).label
}

export function pedidoEstadoVariant(estado: string): StatusVariant {
  return resolve(PEDIDO, estado).variant
}

export function pedidoEstadoLabel(estado: string): string {
  return resolve(PEDIDO, estado).label
}

export function notaCreditoEstadoVariant(estado: string): StatusVariant {
  return resolve(NC, estado).variant
}

export function notaCreditoEstadoLabel(estado: string): string {
  return resolve(NC, estado).label
}

export function notaDebitoEstadoVariant(estado: string): StatusVariant {
  return resolve(ND, estado).variant
}

export function notaDebitoEstadoLabel(estado: string): string {
  return resolve(ND, estado).label
}

export function ordenCompraEstadoVariant(estado: string): StatusVariant {
  return resolve(OC, estado).variant
}

export function ordenCompraEstadoLabel(estado: string): string {
  return resolve(OC, estado).label
}

export function envioEstadoVariant(estado: string): StatusVariant {
  return resolve(ENVIO, estado).variant
}

export function envioEstadoLabel(estado: string): string {
  return resolve(ENVIO, estado).label
}

export function pickingEstadoVariant(estado: string): StatusVariant {
  return resolve(PICKING, estado).variant
}

export function pickingEstadoLabel(estado: string): string {
  return resolve(PICKING, estado).label
}

export function prioridadVariant(prioridad: string): StatusVariant {
  return resolve(PRIORIDAD, prioridad).variant
}

export function prioridadLabel(prioridad: string): string {
  return resolve(PRIORIDAD, prioridad).label
}

export function mantenimientoEstadoVariant(estado: string): StatusVariant {
  return resolve(MANTENIMIENTO, estado).variant
}

export function mantenimientoEstadoLabel(estado: string): string {
  return resolve(MANTENIMIENTO, estado).label
}

export function ordenProduccionEstadoVariant(estado: string): StatusVariant {
  return resolve(ORDEN_PRODUCCION, estado).variant
}

export function ordenProduccionEstadoLabel(estado: string): string {
  return resolve(ORDEN_PRODUCCION, estado).label
}

export function mercadoPagoEstadoVariant(estado: string): StatusVariant {
  return resolve(MERCADOPAGO, estado).variant
}

export function mercadoPagoEstadoLabel(estado: string): string {
  return resolve(MERCADOPAGO, estado).label
}

export function turnoEstadoVariant(estado: string): StatusVariant {
  return resolve(TURNO, estado).variant
}

export function turnoEstadoLabel(estado: string): string {
  return resolve(TURNO, estado).label
}

export function chequeEstadoVariant(estado: string): StatusVariant {
  return resolve(CHEQUE, estado).variant
}

export function chequeEstadoLabel(estado: string): string {
  return resolve(CHEQUE, estado).label
}

export function cajaEstadoVariant(estado: string): StatusVariant {
  return resolve(CAJA, estado).variant
}

export function cajaEstadoLabel(estado: string): string {
  return resolve(CAJA, estado).label
}

export function ticketEstadoVariant(estado: string): StatusVariant {
  return resolve(TICKET, estado).variant
}

export function ticketEstadoLabel(estado: string): string {
  return resolve(TICKET, estado).label
}

export function activoVariant(activo: boolean): StatusVariant {
  return activo ? "success" : "neutral"
}

export function activoLabel(activo: boolean): string {
  return activo ? "Activo" : "Inactivo"
}

// Nuevos dominios para la migración final del design system

const LEAD: Record<string, { variant: StatusVariant; label: string }> = {
  nuevo: { variant: "info", label: "Nuevo" },
  contactado: { variant: "info", label: "Contactado" },
  calificado: { variant: "warning", label: "Calificado" },
  descartado: { variant: "error", label: "Descartado" },
  convertido: { variant: "success", label: "Convertido" },
}

const MESA: Record<string, { variant: StatusVariant; label: string }> = {
  libre: { variant: "success", label: "Libre" },
  ocupada: { variant: "info", label: "Ocupada" },
  reservada: { variant: "warning", label: "Reservada" },
}

const IOT_NIVEL: Record<string, { variant: StatusVariant; label: string }> = {
  info: { variant: "info", label: "Info" },
  warning: { variant: "warning", label: "Advertencia" },
  critical: { variant: "error", label: "Crítico" },
}

const IOT_CALIDAD: Record<string, { variant: StatusVariant; label: string }> = {
  ok: { variant: "success", label: "Óptimo" },
  alerta: { variant: "warning", label: "Alerta" },
  error: { variant: "error", label: "Error" },
}

const TES_TIPO: Record<string, { variant: StatusVariant; label: string }> = {
  venta: { variant: "success", label: "Venta" },
  compra: { variant: "info", label: "Compra" },
  devoluciones: { variant: "warning", label: "Devolución" },
}

const TIPO_CUENTA: Record<string, { variant: StatusVariant; label: string }> = {
  activo: { variant: "info", label: "Activo" },
  pasivo: { variant: "warning", label: "Pasivo" },
  patrimonio: { variant: "success", label: "Patrimonio" },
  ingreso: { variant: "success", label: "Ingreso" },
  egreso: { variant: "error", label: "Egreso" },
  resultado: { variant: "neutral", label: "Resultado" },
}

const PERIODO_FISCAL: Record<string, { variant: StatusVariant; label: string }> = {
  abierto: { variant: "success", label: "Abierto" },
  cerrado: { variant: "neutral", label: "Cerrado" },
  bloqueado: { variant: "error", label: "Bloqueado" },
}

const ACTIVO_FIJO: Record<string, { variant: StatusVariant; label: string }> = {
  activo: { variant: "success", label: "Activo" },
  en_mantenimiento: { variant: "warning", label: "En mantenimiento" },
  dado_de_baja: { variant: "error", label: "Dado de baja" },
  totalmente_amortizado: { variant: "warning", label: "Totalmente amortizado" },
  vendido: { variant: "neutral", label: "Vendido" },
}

const AUDITORIA_ACCION: Record<string, { variant: StatusVariant; label: string }> = {
  crear: { variant: "success", label: "Crear" },
  editar: { variant: "info", label: "Editar" },
  eliminar: { variant: "error", label: "Eliminar" },
  login: { variant: "neutral", label: "Ingreso" },
  exportar: { variant: "info", label: "Exportar" },
  pago: { variant: "success", label: "Pago" },
  emision: { variant: "info", label: "Emisión" },
}

export function leadEstadoVariant(estado: string): StatusVariant {
  return resolve(LEAD, estado).variant
}

export function leadEstadoLabel(estado: string): string {
  return resolve(LEAD, estado).label
}

export function mesaEstadoVariant(estado: string): StatusVariant {
  return resolve(MESA, estado).variant
}

export function mesaEstadoLabel(estado: string): string {
  return resolve(MESA, estado).label
}

export function iotNivelVariant(estado: string): StatusVariant {
  return resolve(IOT_NIVEL, estado).variant
}

export function iotNivelLabel(estado: string): string {
  return resolve(IOT_NIVEL, estado).label
}

export function iotCalidadVariant(estado: string): StatusVariant {
  return resolve(IOT_CALIDAD, estado).variant
}

export function iotCalidadLabel(estado: string): string {
  return resolve(IOT_CALIDAD, estado).label
}

export function tesTipoVariant(estado: string): StatusVariant {
  return resolve(TES_TIPO, estado).variant
}

export function tesTipoLabel(estado: string): string {
  return resolve(TES_TIPO, estado).label
}

export function tipoCuentaVariant(estado: string): StatusVariant {
  return resolve(TIPO_CUENTA, estado).variant
}

export function tipoCuentaLabel(estado: string): string {
  return resolve(TIPO_CUENTA, estado).label
}

export function periodoFiscalVariant(estado: string): StatusVariant {
  return resolve(PERIODO_FISCAL, estado).variant
}

export function periodoFiscalLabel(estado: string): string {
  return resolve(PERIODO_FISCAL, estado).label
}

export function activoFijoEstadoVariant(estado: string): StatusVariant {
  return resolve(ACTIVO_FIJO, estado).variant
}

export function activoFijoEstadoLabel(estado: string): string {
  return resolve(ACTIVO_FIJO, estado).label
}

export function auditoriaAccionVariant(estado: string): StatusVariant {
  return resolve(AUDITORIA_ACCION, estado).variant
}

export function auditoriaAccionLabel(estado: string): string {
  return resolve(AUDITORIA_ACCION, estado).label
}

const CULTIVO: Record<string, { variant: StatusVariant; label: string }> = {
  soja: { variant: "success", label: "Soja" },
  maiz: { variant: "warning", label: "Maíz" },
  maíz: { variant: "warning", label: "Maíz" },
  trigo: { variant: "warning", label: "Trigo" },
  girasol: { variant: "warning", label: "Girasol" },
  cebada: { variant: "warning", label: "Cebada" },
  sorgo: { variant: "warning", label: "Sorgo" },
  barbecho: { variant: "neutral", label: "Barbecho" },
}

export function cultivoVariant(cultivo: string): StatusVariant {
  return resolve(CULTIVO, cultivo).variant
}

export function cultivoLabel(cultivo: string): string {
  return resolve(CULTIVO, cultivo).label
}