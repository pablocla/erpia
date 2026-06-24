import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { isAdminRole } from "@/lib/auth/admin-roles"
import { isIAEnabled } from "@/lib/ai"
import {
  getIANotificacionConfig,
  saveIANotificacionConfig,
  AGENTES_NOTIFICABLES,
  DEFAULT_IA_NOTIFICACION_CONFIG,
} from "@/lib/ai/ia-notificacion-config"
import { prisma } from "@/lib/prisma"
import { TelegramService } from "@/lib/telegram/telegram-service"

const DestinatarioSchema = z.object({
  usuarioId: z.number().int().positive(),
  canales: z.array(z.enum(["app", "email", "telegram", "whatsapp"])).min(1),
  tiposAlerta: z.array(z.string()).optional(),
  agentes: z.array(z.string()).optional(),
})

const PatchSchema = z.object({
  umbrales: z.object({
    stockCriticoProductos: z.number().optional(),
    diasCxcVencida: z.number().optional(),
    diasCxpVencida: z.number().optional(),
    ventaSemanalMinima: z.number().optional(),
    diferenciaCajaMaxima: z.number().optional(),
  }).optional(),
  prioridades: z.object({
    notificarAlta: z.boolean().optional(),
    notificarMedia: z.boolean().optional(),
    notificarBaja: z.boolean().optional(),
  }).optional(),
  destinatarios: z.array(DestinatarioSchema).optional(),
  agentesNotificacion: z.record(z.boolean()).optional(),
  evaluarReglasEnCron: z.boolean().optional(),
  telegramGrupoChatId: z.string().nullable().optional(),
  whatsappReglasAutoAprobar: z.boolean().optional(),
  whatsappCobranzaAutoAprobar: z.boolean().optional(),
  whatsappCobranzaMaxPorRegla: z.number().int().min(1).max(20).optional(),
})

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  if (!(await isIAEnabled(ctx.auth.empresaId))) {
    return NextResponse.json({ error: "Módulo IA no habilitado" }, { status: 403 })
  }

  const [config, usuarios] = await Promise.all([
    getIANotificacionConfig(ctx.auth.empresaId),
    prisma.usuario.findMany({
      where: { empresaId: ctx.auth.empresaId, activo: true, deletedAt: null },
      select: { id: true, nombre: true, email: true, rol: true },
      orderBy: { nombre: "asc" },
    }),
  ])

  return NextResponse.json({
    success: true,
    config,
    defaults: DEFAULT_IA_NOTIFICACION_CONFIG,
    agentes: AGENTES_NOTIFICABLES,
    usuarios,
    telegram: {
      configured: TelegramService.isConfigured(),
      botUsername: TelegramService.getBotUsername(),
    },
  })
}

export async function PATCH(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  if (!isAdminRole(ctx.auth.rol)) {
    return NextResponse.json({ error: "Solo administradores pueden configurar notificaciones IA" }, { status: 403 })
  }

  if (!(await isIAEnabled(ctx.auth.empresaId))) {
    return NextResponse.json({ error: "Módulo IA no habilitado" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
  }

  const config = await saveIANotificacionConfig(ctx.auth.empresaId, parsed.data as any)
  return NextResponse.json({ success: true, config })
}