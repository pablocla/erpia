import { TelegramService } from "@/lib/telegram/telegram-service"
import type { IntegrationConnector } from "../types"
import { fail, ok } from "./base"

export const telegramConnector: IntegrationConnector = {
  id: "telegram",

  async testConnection() {
    if (!TelegramService.isConfigured()) {
      return fail("Configurá TELEGRAM_BOT_TOKEN en el servidor")
    }
    return ok(`Bot activo: @${TelegramService.getBotUsername() ?? "configurado"}`)
  },
}