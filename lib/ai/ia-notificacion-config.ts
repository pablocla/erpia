/**
 * Configuración de notificaciones IA por empresa.
 * Umbrales, destinatarios, canales y agentes que disparan alertas automáticas.
 */

import { prisma } from "@/lib/prisma"

export type CanalNotificacion = "app" | "email" | "telegram" | "whatsapp"

export interface DestinatarioIANotificacion {
  usuarioId: number
  canales: CanalNotificacion[]
  /** Tipos de alerta que recibe (vacío = todos) */
  tiposAlerta?: string[]
  /** Agentes que lo notifican (vacío = todos los habilitados) */
  agentes?: string[]
}

export interface IANotificacionConfig {
  umbrales: {
    stockCriticoProductos: number
    diasCxcVencida: number
    diasCxpVencida: number
    ventaSemanalMinima: number
    diferenciaCajaMaxima: number
  }
  prioridades: {
    notificarAlta: boolean
    notificarMedia: boolean
    notificarBaja: boolean
  }
  destinatarios: DestinatarioIANotificacion[]
  /** agentId → notificar al ejecutar */
  agentesNotificacion: Record<string, boolean>
  /** Evaluar reglas configurables en cron diario */
  evaluarReglasEnCron: boolean
  /** usuarioId → chat_id de Telegram */
  telegramVinculos?: Record<string, string>
  /** usuarioId → @username */
  telegramUsernames?: Record<string, string>
  /** Chat de grupo para alertas críticas (opcional) */
  telegramGrupoChatId?: string | null
  /** Reglas WA internas (stock, caja…) se aprueban solas para el cron */
  whatsappReglasAutoAprobar?: boolean
  /** Cobranza WA a clientes requiere aprobación manual por defecto */
  whatsappCobranzaAutoAprobar?: boolean
  /** Máx. clientes por regla cxc_vencida por evaluación */
  whatsappCobranzaMaxPorRegla?: number
}

export const DEFAULT_IA_NOTIFICACION_CONFIG: IANotificacionConfig = {
  umbrales: {
    stockCriticoProductos: 0,
    diasCxcVencida: 30,
    diasCxpVencida: 30,
    ventaSemanalMinima: 100_000,
    diferenciaCajaMaxima: 10_000,
  },
  prioridades: {
    notificarAlta: true,
    notificarMedia: true,
    notificarBaja: false,
  },
  destinatarios: [],
  agentesNotificacion: {
    "alertas-stock": true,
    "compras-predictivo": true,
    "cobranzas": true,
    "anomalias": true,
    "reportes": true,
    "ventas-leads": false,
    "marketing": false,
    "community-manager": false,
    "clasificador-productos": false,
    "onboarding": false,
  },
  evaluarReglasEnCron: true,
  telegramVinculos: {},
  telegramUsernames: {},
  telegramGrupoChatId: null,
  whatsappReglasAutoAprobar: true,
  whatsappCobranzaAutoAprobar: false,
  whatsappCobranzaMaxPorRegla: 5,
}

export const AGENTES_NOTIFICABLES = [
  { id: "alertas-stock", nombre: "Alertas de stock" },
  { id: "compras-predictivo", nombre: "Compras predictivo" },
  { id: "cobranzas", nombre: "Cobranzas" },
  { id: "anomalias", nombre: "Anomalías" },
  { id: "reportes", nombre: "Reportes" },
  { id: "ventas-leads", nombre: "Ventas / leads" },
] as const

function mergeConfig(partial: Partial<IANotificacionConfig>): IANotificacionConfig {
  return {
    ...DEFAULT_IA_NOTIFICACION_CONFIG,
    ...partial,
    umbrales: { ...DEFAULT_IA_NOTIFICACION_CONFIG.umbrales, ...partial.umbrales },
    prioridades: { ...DEFAULT_IA_NOTIFICACION_CONFIG.prioridades, ...partial.prioridades },
    agentesNotificacion: {
      ...DEFAULT_IA_NOTIFICACION_CONFIG.agentesNotificacion,
      ...partial.agentesNotificacion,
    },
    destinatarios: partial.destinatarios ?? DEFAULT_IA_NOTIFICACION_CONFIG.destinatarios,
    telegramVinculos: partial.telegramVinculos ?? DEFAULT_IA_NOTIFICACION_CONFIG.telegramVinculos,
    telegramUsernames: partial.telegramUsernames ?? DEFAULT_IA_NOTIFICACION_CONFIG.telegramUsernames,
    telegramGrupoChatId: partial.telegramGrupoChatId ?? DEFAULT_IA_NOTIFICACION_CONFIG.telegramGrupoChatId,
    whatsappReglasAutoAprobar: partial.whatsappReglasAutoAprobar ?? DEFAULT_IA_NOTIFICACION_CONFIG.whatsappReglasAutoAprobar,
    whatsappCobranzaAutoAprobar: partial.whatsappCobranzaAutoAprobar ?? DEFAULT_IA_NOTIFICACION_CONFIG.whatsappCobranzaAutoAprobar,
    whatsappCobranzaMaxPorRegla: partial.whatsappCobranzaMaxPorRegla ?? DEFAULT_IA_NOTIFICACION_CONFIG.whatsappCobranzaMaxPorRegla,
  }
}

export async function getIANotificacionConfig(empresaId: number): Promise<IANotificacionConfig> {
  try {
    const row = await prisma.configuracionIANotificacion.findUnique({
      where: { empresaId },
      select: { config: true },
    })
    if (!row?.config) return DEFAULT_IA_NOTIFICACION_CONFIG
    return mergeConfig(row.config as Partial<IANotificacionConfig>)
  } catch {
    return DEFAULT_IA_NOTIFICACION_CONFIG
  }
}

export async function saveIANotificacionConfig(
  empresaId: number,
  partial: Partial<IANotificacionConfig>,
): Promise<IANotificacionConfig> {
  const current = await getIANotificacionConfig(empresaId)
  const merged = mergeConfig({ ...current, ...partial })

  try {
    await prisma.configuracionIANotificacion.upsert({
      where: { empresaId },
      create: { empresaId, config: merged as object },
      update: { config: merged as object },
    })
  } catch (err) {
    console.error("[IA Notif Config] No se pudo persistir:", err)
  }

  return merged
}