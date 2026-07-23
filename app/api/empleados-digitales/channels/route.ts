import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { WhatsappService } from "@/lib/whatsapp/whatsapp-service"
import { TelegramService } from "@/lib/telegram/telegram-service"
import { prisma } from "@/lib/prisma"
import { isLeoActivo } from "@/lib/empleados-digitales/is-leo-activo"

/**
 * GET /api/empleados-digitales/channels
 * Estado de canales para hablar con Leo (WA outbound + Telegram bot)
 */
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  const empresaId = ctx.auth.empresaId
  const leoActivo = await isLeoActivo(empresaId)

  const notif = await prisma.configuracionIANotificacion.findUnique({
    where: { empresaId },
    select: { config: true },
  })
  const cfg = (notif?.config ?? {}) as {
    telegramVinculos?: Record<string, string>
    telegramGrupoChatId?: string | null
  }
  const telegramVinculos = Object.keys(cfg.telegramVinculos ?? {}).length
  const hasGrupo = Boolean(cfg.telegramGrupoChatId)

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { telefono: true, nombre: true },
  })

  return NextResponse.json({
    success: true,
    leoActivo,
    whatsapp: {
      configured: WhatsappService.isConfigured(),
      cloudApi: WhatsappService.isCloudApiConfigured(),
      env: {
        TWILIO_ACCOUNT_SID: Boolean(process.env.TWILIO_ACCOUNT_SID),
        TWILIO_AUTH_TOKEN: Boolean(process.env.TWILIO_AUTH_TOKEN),
        TWILIO_WHATSAPP_FROM: Boolean(process.env.TWILIO_WHATSAPP_FROM),
        WHATSAPP_CLOUD_TOKEN: Boolean(process.env.WHATSAPP_CLOUD_TOKEN),
      },
      empresaTelefono: empresa?.telefono ?? null,
      note: WhatsappService.isConfigured()
        ? "Outbound listo (cron whatsapp-outbound envía mensajes aprobados)."
        : "Sin Twilio: los mensajes se aprueban pero solo loguean en dev. Configurá env TWILIO_*.",
    },
    telegram: {
      configured: TelegramService.isConfigured(),
      botUsername: TelegramService.getBotUsername(),
      vinculosUsuarios: telegramVinculos,
      grupoChatId: hasGrupo,
      note: TelegramService.isConfigured()
        ? telegramVinculos > 0 || hasGrupo
          ? "Podés hablar con Leo: /leo status · /leo run · /leo pendientes"
          : "Bot OK. Vinculá tu user: Asistente IA → Notificaciones → Telegram"
        : "Falta TELEGRAM_BOT_TOKEN. Creá un bot con @BotFather.",
    },
    setupPath: "/dashboard/empleados-digitales",
    docsPath: "docs/empleados-digitales/CANALES_WA_TELEGRAM.md",
  })
}
