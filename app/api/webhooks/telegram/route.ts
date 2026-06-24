import { type NextRequest, NextResponse } from "next/server"
import { manejarUpdateTelegram } from "@/lib/telegram/telegram-commands"

/**
 * POST /api/webhooks/telegram — Webhook del Bot de Telegram
 * Configurar en BotFather o con setWebhook apuntando a esta URL.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token")
    if (header !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const update = await request.json()
    await manejarUpdateTelegram(update)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error)
    return NextResponse.json({ ok: true })
  }
}