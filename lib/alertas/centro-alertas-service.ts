/**
 * Centro de Alertas — agrega bandeja IA, reglas, WhatsApp y estado de canales.
 */

import { prisma } from "@/lib/prisma"
import { parseAlertaMetadata, type AlertaIAMetadata } from "@/lib/ai/alerta-seguimiento"
import { alertaVisibleParaUsuario } from "@/lib/ai/notificacion-ia-service"
import { getIANotificacionConfig } from "@/lib/ai/ia-notificacion-config"
import { TelegramService } from "@/lib/telegram/telegram-service"
import { WhatsappService } from "@/lib/whatsapp/whatsapp-service"
import { listarReglasAlerta } from "./alertas-service"

export type FiltroBandeja = "todas" | "activas" | "no_leidas" | "regla" | "ia"

export interface ResumenCentroAlertas {
  alertasActivas: number
  alertasNoLeidas: number
  reglasActivas: number
  reglasDisparadas: number
  whatsappPendientes: number
  whatsappAprobados: number
  telegramConfigurado: boolean
  whatsappConfigurado: boolean
  telegramVinculos: number
}

export interface AlertaBandejaItem {
  id: number
  titulo: string
  descripcion: string
  prioridad: string
  tipo: string
  accion: string | null
  leida: boolean
  resuelta: boolean
  createdAt: string
  origen: AlertaIAMetadata["origen"]
  reglaId?: number
  agenteId?: string
  canales: Array<"app" | "email" | "telegram" | "whatsapp">
  seguimiento: AlertaIAMetadata
}

export interface PreviewNotificacion {
  id: string
  titulo: string
  descripcion: string
  prioridad: string
  tipo: string
  origen?: string
  createdAt: string
  href: string
}

const PRI_ORDER: Record<string, number> = { alta: 0, media: 1, baja: 2 }

function canalesDesdeMeta(meta: AlertaIAMetadata): AlertaBandejaItem["canales"] {
  const set = new Set<AlertaBandejaItem["canales"][number]>(["app"])
  for (const n of meta.notificacionesEnviadas) {
    if (n.canal !== "app") set.add(n.canal)
  }
  return Array.from(set)
}

export async function obtenerResumenCentroAlertas(
  empresaId: number,
  userId: number,
  rol: string,
): Promise<ResumenCentroAlertas> {
  const [alertasRaw, reglas, waPendientes, waAprobados, iaConfig] = await Promise.all([
    prisma.alertaIA.findMany({
      where: { empresaId, resuelta: false },
      select: { id: true, leida: true, datos: true },
      take: 200,
    }),
    prisma.reglaAlerta.findMany({
      where: { empresaId },
      select: { activo: true, ultimoResultado: true },
    }),
    prisma.mensajePendienteWhatsApp.count({
      where: { empresaId, estado: "pendiente" },
    }),
    prisma.mensajePendienteWhatsApp.count({
      where: { empresaId, estado: "aprobado" },
    }),
    getIANotificacionConfig(empresaId),
  ])

  const visibles = alertasRaw.filter((a) => alertaVisibleParaUsuario(a.datos, userId, rol))

  return {
    alertasActivas: visibles.length,
    alertasNoLeidas: visibles.filter((a) => !a.leida).length,
    reglasActivas: reglas.filter((r) => r.activo).length,
    reglasDisparadas: reglas.filter((r) => r.activo && r.ultimoResultado === true).length,
    whatsappPendientes: waPendientes,
    whatsappAprobados: waAprobados,
    telegramConfigurado: TelegramService.isConfigured(),
    whatsappConfigurado: WhatsappService.isConfigured(),
    telegramVinculos: Object.keys(iaConfig.telegramVinculos ?? {}).length,
  }
}

export async function listarBandejaAlertas(
  empresaId: number,
  userId: number,
  rol: string,
  opts?: { filtro?: FiltroBandeja; limite?: number },
): Promise<AlertaBandejaItem[]> {
  const filtro = opts?.filtro ?? "activas"
  const limite = opts?.limite ?? 50

  const where: { empresaId: number; leida?: boolean; resuelta?: boolean } = { empresaId }

  if (filtro === "no_leidas") where.leida = false
  else if (filtro === "activas") where.resuelta = false

  const alertasRaw = await prisma.alertaIA.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limite * 2,
  })

  let items = alertasRaw
    .filter((a) => alertaVisibleParaUsuario(a.datos, userId, rol))
    .map((a) => {
      const meta = parseAlertaMetadata(a.datos)
      return {
        id: a.id,
        titulo: a.titulo,
        descripcion: a.descripcion,
        prioridad: a.prioridad,
        tipo: a.tipo,
        accion: a.accion,
        leida: a.leida,
        resuelta: a.resuelta,
        createdAt: a.createdAt.toISOString(),
        origen: meta.origen,
        reglaId: meta.reglaId,
        agenteId: meta.agenteId,
        canales: canalesDesdeMeta(meta),
        seguimiento: meta,
      }
    })

  if (filtro === "regla") {
    items = items.filter((a) => a.origen === "regla")
  } else if (filtro === "ia") {
    items = items.filter((a) => a.origen === "ia_agente" || a.origen === "cron" || a.origen === "manual")
  }

  items.sort((a, b) => {
    const pd = (PRI_ORDER[a.prioridad] ?? 9) - (PRI_ORDER[b.prioridad] ?? 9)
    if (pd !== 0) return pd
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return items.slice(0, limite)
}

export async function listarPreviewNotificaciones(
  empresaId: number,
  userId: number,
  rol: string,
  limite = 8,
): Promise<PreviewNotificacion[]> {
  const bandeja = await listarBandejaAlertas(empresaId, userId, rol, {
    filtro: "activas",
    limite,
  })

  return bandeja.map((a) => ({
    id: `alerta-${a.id}`,
    titulo: a.titulo,
    descripcion: a.descripcion,
    prioridad: a.prioridad,
    tipo: a.tipo,
    origen: a.origen,
    createdAt: a.createdAt,
    href: `/dashboard/centro-alertas?alerta=${a.id}`,
  }))
}

export async function obtenerEstadoCanales(empresaId: number) {
  const config = await getIANotificacionConfig(empresaId)
  const reglas = await listarReglasAlerta(empresaId)

  const reglasPorAccion = {
    whatsapp: reglas.filter((r) => r.activo && r.accion === "whatsapp").length,
    telegram: reglas.filter((r) => r.activo && r.accion === "telegram").length,
    email: reglas.filter((r) => r.activo && r.accion === "email").length,
    notificacion: reglas.filter((r) => r.activo && r.accion === "notificacion").length,
  }

  const destinatariosWhatsApp = config.destinatarios.filter((d) => d.canales.includes("whatsapp")).length
  const destinatariosTelegram = config.destinatarios.filter((d) => d.canales.includes("telegram")).length

  return {
    telegram: {
      configurado: TelegramService.isConfigured(),
      botUsername: TelegramService.getBotUsername(),
      vinculos: Object.keys(config.telegramVinculos ?? {}).length,
      grupo: Boolean(config.telegramGrupoChatId),
      destinatarios: destinatariosTelegram,
      reglasActivas: reglasPorAccion.telegram,
    },
    whatsapp: {
      configurado: WhatsappService.isConfigured(),
      reglasActivas: reglasPorAccion.whatsapp,
      destinatarios: destinatariosWhatsApp,
      autoReglas: config.whatsappReglasAutoAprobar !== false,
      autoCobranza: config.whatsappCobranzaAutoAprobar === true,
    },
    reglasPorAccion,
  }
}