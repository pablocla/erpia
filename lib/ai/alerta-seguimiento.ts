/**
 * Seguimiento de alertas IA — metadata en AlertaIA.datos (sin migración extra).
 */

export type EstadoSeguimiento = "pendiente" | "en_revision" | "resuelta" | "descartada"

export interface EntradaSeguimiento {
  fecha: string
  usuarioId: number
  usuarioNombre: string
  accion: "creada" | "asignada" | "nota" | "estado" | "notificada" | "resuelta"
  nota?: string
  estadoAnterior?: EstadoSeguimiento
  estadoNuevo?: EstadoSeguimiento
}

export interface NotificacionEnviada {
  usuarioId: number
  usuarioNombre: string
  canal: "app" | "email" | "telegram" | "whatsapp"
  fecha: string
}

export interface AlertaIAMetadata {
  origen?: "ia_agente" | "regla" | "cron" | "manual"
  reglaId?: number
  agenteId?: string
  estadoSeguimiento: EstadoSeguimiento
  asignadoAId?: number
  asignadoANombre?: string
  seguimiento: EntradaSeguimiento[]
  notificacionesEnviadas: NotificacionEnviada[]
  destinatariosIds: number[]
}

export function parseAlertaMetadata(datos: unknown): AlertaIAMetadata {
  const d = (datos && typeof datos === "object" ? datos : {}) as Partial<AlertaIAMetadata>
  return {
    origen: d.origen,
    reglaId: d.reglaId,
    agenteId: d.agenteId,
    estadoSeguimiento: d.estadoSeguimiento ?? "pendiente",
    asignadoAId: d.asignadoAId,
    asignadoANombre: d.asignadoANombre,
    seguimiento: Array.isArray(d.seguimiento) ? d.seguimiento : [],
    notificacionesEnviadas: Array.isArray(d.notificacionesEnviadas) ? d.notificacionesEnviadas : [],
    destinatariosIds: Array.isArray(d.destinatariosIds) ? d.destinatariosIds : [],
  }
}

export function mergeAlertaMetadata(
  datos: unknown,
  patch: Partial<AlertaIAMetadata>,
): AlertaIAMetadata {
  return { ...parseAlertaMetadata(datos), ...patch }
}

export function appendSeguimiento(
  meta: AlertaIAMetadata,
  entrada: Omit<EntradaSeguimiento, "fecha">,
): AlertaIAMetadata {
  return {
    ...meta,
    seguimiento: [
      ...meta.seguimiento,
      { ...entrada, fecha: new Date().toISOString() },
    ],
  }
}