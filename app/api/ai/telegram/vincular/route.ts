import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { isIAEnabled } from "@/lib/ai"
import {
  buildTelegramDeepLink,
  getTelegramChatId,
  removeTelegramVinculo,
} from "@/lib/telegram/telegram-vinculo"
import { TelegramService } from "@/lib/telegram/telegram-service"

/**
 * GET /api/ai/telegram/vincular — Link de vinculación para el usuario actual
 * DELETE — Desvincular Telegram del usuario actual
 */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  if (!(await isIAEnabled(ctx.auth.empresaId))) {
    return NextResponse.json({ error: "Módulo IA no habilitado" }, { status: 403 })
  }

  const link = buildTelegramDeepLink(ctx.auth.empresaId, ctx.auth.userId)
  const chatId = await getTelegramChatId(ctx.auth.empresaId, ctx.auth.userId)

  return NextResponse.json({
    success: true,
    botConfigured: TelegramService.isConfigured(),
    botUsername: TelegramService.getBotUsername(),
    deepLink: link,
    vinculado: Boolean(chatId),
    chatId: chatId ?? null,
    instrucciones: link
      ? "Abrí el link en Telegram y presioná Start para vincular tu cuenta."
      : "Configurá TELEGRAM_BOT_TOKEN y TELEGRAM_BOT_USERNAME en el servidor.",
  })
}

export async function DELETE(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  await removeTelegramVinculo(ctx.auth.empresaId, ctx.auth.userId)
  return NextResponse.json({ success: true, vinculado: false })
}