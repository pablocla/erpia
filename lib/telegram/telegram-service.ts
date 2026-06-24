/**
 * Telegram Bot API — envío de mensajes para alertas internas Cleverp.
 */

const TELEGRAM_API = "https://api.telegram.org"

export class TelegramService {
  private readonly token: string
  private readonly devMode: boolean

  static isConfigured(): boolean {
    return Boolean(process.env.TELEGRAM_BOT_TOKEN)
  }

  static getBotUsername(): string | null {
    return process.env.TELEGRAM_BOT_USERNAME ?? null
  }

  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN ?? ""
    this.devMode = !TelegramService.isConfigured()
  }

  private apiUrl(method: string) {
    return `${TELEGRAM_API}/bot${this.token}/${method}`
  }

  async sendMessage(chatId: string | number, text: string, parseMode: "HTML" | "Markdown" = "HTML") {
    if (this.devMode) {
      console.info(`[Telegram DEV] → ${chatId}: ${text.slice(0, 200)}`)
      return { ok: true, result: { message_id: 0 } }
    }

    const response = await fetch(this.apiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4096),
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    })

    const body = await response.json()
    if (!response.ok || !body.ok) {
      throw new Error(`Telegram error: ${JSON.stringify(body)}`)
    }
    return body
  }

  /** Registra webhook en Telegram (ejecutar una vez en deploy) */
  async setWebhook(publicUrl: string) {
    if (this.devMode) {
      console.info(`[Telegram DEV] setWebhook → ${publicUrl}`)
      return { ok: true }
    }

    const response = await fetch(this.apiUrl("setWebhook"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: publicUrl,
        allowed_updates: ["message"],
        secret_token: process.env.TELEGRAM_WEBHOOK_SECRET || undefined,
      }),
    })
    return response.json()
  }
}

export const telegramService = new TelegramService()