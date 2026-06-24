/**
 * Servicio de notificaciones IA — despacha alertas a usuarios configurados.
 * Canales: in-app (AlertaIA) + email opcional.
 */

import { prisma } from "@/lib/prisma"
import { emailService } from "@/lib/email/email-service"
import { telegramService } from "@/lib/telegram/telegram-service"
import { isAdminRole } from "@/lib/auth/admin-roles"
import {
  getIANotificacionConfig,
  type DestinatarioIANotificacion,
  type IANotificacionConfig,
} from "./ia-notificacion-config"
import {
  appendSeguimiento,
  parseAlertaMetadata,
  type AlertaIAMetadata,
  type EstadoSeguimiento,
} from "./alerta-seguimiento"
import { resolverTelefonoUsuario } from "@/lib/alertas/whatsapp-regla-dispatcher"

function prioridadWhatsApp(p: "alta" | "media" | "baja"): number {
  if (p === "alta") return 9
  if (p === "media") return 7
  return 5
}

export interface CrearAlertaIAInput {
  empresaId: number
  tipo: string
  prioridad: "alta" | "media" | "baja"
  titulo: string
  descripcion: string
  accion?: string | null
  origen?: AlertaIAMetadata["origen"]
  reglaId?: number
  agenteId?: string
  asignadoAId?: number
  datosExtra?: Record<string, unknown>
  /** Si false, solo persiste sin enviar email */
  notificar?: boolean
  reglaDestinatarioId?: number | null
  emailDestinoRegla?: string | null
}

function prioridadPermitida(prioridad: string, config: IANotificacionConfig): boolean {
  if (prioridad === "alta") return config.prioridades.notificarAlta
  if (prioridad === "media") return config.prioridades.notificarMedia
  if (prioridad === "baja") return config.prioridades.notificarBaja
  return true
}

function destinatarioAplica(
  dest: DestinatarioIANotificacion,
  tipo: string,
  agenteId?: string,
): boolean {
  if (dest.tiposAlerta?.length && !dest.tiposAlerta.includes(tipo)) return false
  if (dest.agentes?.length && agenteId && !dest.agentes.includes(agenteId)) return false
  return true
}

async function resolverDestinatarios(
  empresaId: number,
  config: IANotificacionConfig,
  tipo: string,
  agenteId?: string,
  reglaDestinatarioId?: number | null,
  emailDestinoRegla?: string | null,
): Promise<Array<{
  id: number
  nombre: string
  email: string
  canales: DestinatarioIANotificacion["canales"]
  telegramChatId?: string
}>> {
  const usuarios = await prisma.usuario.findMany({
    where: { empresaId, activo: true, deletedAt: null },
    select: { id: true, nombre: true, email: true, rol: true },
  })

  const vinculos = config.telegramVinculos ?? {}
  const map = new Map<number, {
    id: number
    nombre: string
    email: string
    canales: DestinatarioIANotificacion["canales"]
    telegramChatId?: string
  }>()

  const enrich = (u: { id: number; nombre: string; email: string; rol: string }, canales: DestinatarioIANotificacion["canales"]) => ({
    ...u,
    canales,
    telegramChatId: vinculos[String(u.id)],
  })

  if (reglaDestinatarioId) {
    const u = usuarios.find((x) => x.id === reglaDestinatarioId)
    if (u) map.set(u.id, enrich(u, ["app", "email", "telegram"]))
  } else if (emailDestinoRegla) {
    const u = usuarios.find((x) => x.email === emailDestinoRegla)
    if (u) map.set(u.id, enrich(u, ["app", "email", "telegram"]))
  }

  for (const dest of config.destinatarios) {
    if (!destinatarioAplica(dest, tipo, agenteId)) continue
    const u = usuarios.find((x) => x.id === dest.usuarioId)
    if (u) map.set(u.id, enrich(u, dest.canales))
  }

  if (map.size === 0) {
    for (const u of usuarios.filter((x) => isAdminRole(x.rol))) {
      map.set(u.id, enrich(u, ["app", "telegram"]))
    }
  }

  return Array.from(map.values())
}

function formatTelegramAlerta(titulo: string, descripcion: string, accion?: string | null) {
  const lines = [
    `<b>🔔 Cleverp</b>`,
    `<b>${titulo}</b>`,
    descripcion,
  ]
  if (accion) lines.push(`\n💡 ${accion}`)
  return lines.join("\n")
}

/** Envío directo a chat/grupo (reglas con acción telegram) */
export async function enviarNotificacionTelegram(
  empresaId: number,
  titulo: string,
  descripcion: string,
  accion?: string | null,
  opts?: { prioridad?: string; destinatarioId?: number | null },
) {
  const config = await getIANotificacionConfig(empresaId)
  const texto = formatTelegramAlerta(titulo, descripcion, accion)
  let enviados = 0

  const dests = await resolverDestinatarios(
    empresaId,
    config,
    "general",
    undefined,
    opts?.destinatarioId,
  )

  for (const dest of dests) {
    if (!dest.canales.includes("telegram") || !dest.telegramChatId) continue
    try {
      await telegramService.sendMessage(dest.telegramChatId, texto)
      enviados++
    } catch (err) {
      console.error(`[IA Notif] Telegram falló para ${dest.nombre}:`, err)
    }
  }

  if (opts?.prioridad === "alta" && config.telegramGrupoChatId) {
    try {
      await telegramService.sendMessage(config.telegramGrupoChatId, texto)
      enviados++
    } catch (err) {
      console.error("[IA Notif] Telegram grupo falló:", err)
    }
  }

  return enviados
}

export async function crearAlertaIAConNotificacion(input: CrearAlertaIAInput) {
  const config = await getIANotificacionConfig(input.empresaId)
  const notificar = input.notificar !== false && prioridadPermitida(input.prioridad, config)

  let asignadoANombre: string | undefined
  if (input.asignadoAId) {
    const u = await prisma.usuario.findFirst({
      where: { id: input.asignadoAId, empresaId: input.empresaId },
      select: { nombre: true },
    })
    asignadoANombre = u?.nombre
  }

  const destinatarios = notificar
    ? await resolverDestinatarios(
        input.empresaId,
        config,
        input.tipo,
        input.agenteId,
        input.reglaDestinatarioId,
        input.emailDestinoRegla,
      )
    : []

  const meta: AlertaIAMetadata = {
    origen: input.origen ?? "manual",
    reglaId: input.reglaId,
    agenteId: input.agenteId,
    estadoSeguimiento: "pendiente",
    asignadoAId: input.asignadoAId ?? destinatarios[0]?.id,
    asignadoANombre: asignadoANombre ?? destinatarios[0]?.nombre,
    seguimiento: [],
    notificacionesEnviadas: [],
    destinatariosIds: destinatarios.map((d) => d.id),
  }

  let metaConSeguimiento = appendSeguimiento(meta, {
    usuarioId: 0,
    usuarioNombre: "Sistema IA",
    accion: "creada",
    nota: `Alerta generada (${input.origen ?? "manual"})`,
  })

  if (notificar) {
    const textoTelegram = formatTelegramAlerta(input.titulo, input.descripcion, input.accion)

    for (const dest of destinatarios) {
      metaConSeguimiento.notificacionesEnviadas.push({
        usuarioId: dest.id,
        usuarioNombre: dest.nombre,
        canal: "app",
        fecha: new Date().toISOString(),
      })

      if (dest.canales.includes("email")) {
        try {
          await emailService.notificar(
            dest.email,
            `[Cleverp] ${input.titulo}`,
            `${input.descripcion}\n\n${input.accion ? `Acción sugerida: ${input.accion}` : ""}`,
          )
          metaConSeguimiento.notificacionesEnviadas.push({
            usuarioId: dest.id,
            usuarioNombre: dest.nombre,
            canal: "email",
            fecha: new Date().toISOString(),
          })
          metaConSeguimiento = appendSeguimiento(metaConSeguimiento, {
            usuarioId: dest.id,
            usuarioNombre: dest.nombre,
            accion: "notificada",
            nota: `Email enviado a ${dest.email}`,
          })
        } catch (err) {
          console.error(`[IA Notif] Email falló para ${dest.email}:`, err)
        }
      }

      if (dest.canales.includes("telegram") && dest.telegramChatId) {
        try {
          await telegramService.sendMessage(dest.telegramChatId, textoTelegram)
          metaConSeguimiento.notificacionesEnviadas.push({
            usuarioId: dest.id,
            usuarioNombre: dest.nombre,
            canal: "telegram",
            fecha: new Date().toISOString(),
          })
          metaConSeguimiento = appendSeguimiento(metaConSeguimiento, {
            usuarioId: dest.id,
            usuarioNombre: dest.nombre,
            accion: "notificada",
            nota: "Telegram enviado",
          })
        } catch (err) {
          console.error(`[IA Notif] Telegram falló para ${dest.nombre}:`, err)
        }
      }

      if (dest.canales.includes("whatsapp")) {
        try {
          const interno = await resolverTelefonoUsuario(input.empresaId, dest.id)
          if (!interno) {
            console.warn(`[IA Notif] Sin teléfono WA para ${dest.nombre} (usuario ${dest.id})`)
          } else {
            const autoAprobar = config.whatsappReglasAutoAprobar !== false
            await prisma.mensajePendienteWhatsApp.create({
              data: {
                empresaId: input.empresaId,
                destinatario: interno.nombre,
                telefono: interno.telefono,
                mensaje: `🔔 *${input.titulo}*\n\n${input.descripcion}${input.accion ? `\n\n💡 ${input.accion}` : ""}\n\n— Cleverp`,
                tipo: "general",
                prioridad: prioridadWhatsApp(input.prioridad),
                estado: autoAprobar ? "aprobado" : "pendiente",
              },
            })
            metaConSeguimiento.notificacionesEnviadas.push({
              usuarioId: dest.id,
              usuarioNombre: dest.nombre,
              canal: "whatsapp",
              fecha: new Date().toISOString(),
            })
            metaConSeguimiento = appendSeguimiento(metaConSeguimiento, {
              usuarioId: dest.id,
              usuarioNombre: dest.nombre,
              accion: "notificada",
              nota: autoAprobar ? "WhatsApp encolado (auto-aprobado)" : "WhatsApp encolado (pendiente aprobación)",
            })
          }
        } catch (err) {
          console.error(`[IA Notif] WhatsApp falló para ${dest.nombre}:`, err)
        }
      }
    }

    if (input.prioridad === "alta" && config.telegramGrupoChatId) {
      try {
        await telegramService.sendMessage(config.telegramGrupoChatId, textoTelegram)
      } catch (err) {
        console.error("[IA Notif] Telegram grupo falló:", err)
      }
    }
  }

  const alerta = await prisma.alertaIA.create({
    data: {
      empresaId: input.empresaId,
      tipo: input.tipo,
      prioridad: input.prioridad,
      titulo: input.titulo,
      descripcion: input.descripcion,
      accion: input.accion ?? null,
      datos: {
        ...input.datosExtra,
        ...metaConSeguimiento,
      } as any,
    },
  })

  return { alerta, notificados: destinatarios.length }
}

export async function actualizarSeguimientoAlerta(
  empresaId: number,
  alertaId: number,
  usuarioId: number,
  usuarioNombre: string,
  patch: {
    estadoSeguimiento?: EstadoSeguimiento
    asignadoAId?: number
    nota?: string
    leida?: boolean
    resuelta?: boolean
  },
) {
  const alerta = await prisma.alertaIA.findFirst({
    where: { id: alertaId, empresaId },
  })
  if (!alerta) throw new Error("Alerta no encontrada")

  let meta = parseAlertaMetadata(alerta.datos)

  if (patch.estadoSeguimiento) {
    meta = appendSeguimiento(meta, {
      usuarioId,
      usuarioNombre,
      accion: "estado",
      estadoAnterior: meta.estadoSeguimiento,
      estadoNuevo: patch.estadoSeguimiento,
    })
    meta.estadoSeguimiento = patch.estadoSeguimiento
  }

  if (patch.asignadoAId !== undefined) {
    const u = await prisma.usuario.findFirst({
      where: { id: patch.asignadoAId, empresaId },
      select: { nombre: true },
    })
    meta.asignadoAId = patch.asignadoAId
    meta.asignadoANombre = u?.nombre
    meta = appendSeguimiento(meta, {
      usuarioId,
      usuarioNombre,
      accion: "asignada",
      nota: u ? `Asignada a ${u.nombre}` : "Sin asignar",
    })
  }

  if (patch.nota?.trim()) {
    meta = appendSeguimiento(meta, {
      usuarioId,
      usuarioNombre,
      accion: "nota",
      nota: patch.nota.trim(),
    })
  }

  const resuelta = patch.resuelta ?? (patch.estadoSeguimiento === "resuelta")
  if (resuelta && meta.estadoSeguimiento !== "resuelta") {
    meta.estadoSeguimiento = "resuelta"
    meta = appendSeguimiento(meta, {
      usuarioId,
      usuarioNombre,
      accion: "resuelta",
    })
  }

  return prisma.alertaIA.update({
    where: { id: alertaId },
    data: {
      datos: { ...(alerta.datos as object), ...meta } as any,
      ...(patch.leida !== undefined && { leida: patch.leida }),
      ...(resuelta && { resuelta: true, leida: true }),
      ...(patch.resuelta === false && { resuelta: false }),
    },
  })
}

/** Filtra alertas visibles para el usuario actual */
export function alertaVisibleParaUsuario(
  datos: unknown,
  usuarioId: number,
  rol: string,
): boolean {
  if (isAdminRole(rol)) return true
  const meta = parseAlertaMetadata(datos)
  if (meta.destinatariosIds.length === 0) return true
  if (meta.asignadoAId === usuarioId) return true
  return meta.destinatariosIds.includes(usuarioId)
}