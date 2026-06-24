/**
 * Vinculación usuario ERP ↔ chat_id de Telegram.
 * Persistencia en ConfiguracionIANotificacion.config.telegramVinculos
 */

import { createHmac, timingSafeEqual } from "crypto"
import {
  getIANotificacionConfig,
  saveIANotificacionConfig,
} from "@/lib/ai/ia-notificacion-config"

function linkSecret(): string {
  return process.env.TELEGRAM_LINK_SECRET || process.env.CRON_SECRET || "cleverp-telegram-dev"
}

export function buildTelegramLinkToken(empresaId: number, usuarioId: number): string {
  return createHmac("sha256", linkSecret())
    .update(`${empresaId}:${usuarioId}`)
    .digest("hex")
    .slice(0, 20)
}

export function verifyTelegramLinkToken(empresaId: number, usuarioId: number, token: string): boolean {
  const expected = buildTelegramLinkToken(empresaId, usuarioId)
  try {
    const a = Buffer.from(expected)
    const b = Buffer.from(token)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/** Payload para /start en BotFather deep link */
export function buildTelegramStartPayload(empresaId: number, usuarioId: number): string {
  const token = buildTelegramLinkToken(empresaId, usuarioId)
  return `link_${empresaId}_${usuarioId}_${token}`
}

export function parseTelegramStartPayload(payload: string): {
  empresaId: number
  usuarioId: number
  token: string
} | null {
  const match = payload.match(/^link_(\d+)_(\d+)_([a-f0-9]{20})$/)
  if (!match) return null
  return {
    empresaId: Number(match[1]),
    usuarioId: Number(match[2]),
    token: match[3],
  }
}

export function buildTelegramDeepLink(empresaId: number, usuarioId: number): string | null {
  const bot = process.env.TELEGRAM_BOT_USERNAME
  if (!bot) return null
  const payload = buildTelegramStartPayload(empresaId, usuarioId)
  return `https://t.me/${bot}?start=${payload}`
}

export async function getTelegramChatId(
  empresaId: number,
  usuarioId: number,
): Promise<string | null> {
  const config = await getIANotificacionConfig(empresaId)
  return config.telegramVinculos?.[String(usuarioId)] ?? null
}

export async function saveTelegramVinculo(
  empresaId: number,
  usuarioId: number,
  chatId: string,
  telegramUsername?: string,
): Promise<void> {
  const config = await getIANotificacionConfig(empresaId)
  const telegramVinculos = {
    ...(config.telegramVinculos ?? {}),
    [String(usuarioId)]: chatId,
  }
  const telegramUsernames = {
    ...(config.telegramUsernames ?? {}),
    ...(telegramUsername ? { [String(usuarioId)]: telegramUsername } : {}),
  }

  // Activar canal telegram en destinatario si ya está configurado
  const destinatarios = config.destinatarios.map((d) => {
    if (d.usuarioId !== usuarioId) return d
    const canales = d.canales.includes("telegram") ? d.canales : [...d.canales, "telegram" as const]
    return { ...d, canales }
  })

  await saveIANotificacionConfig(empresaId, {
    telegramVinculos,
    telegramUsernames,
    destinatarios,
  })
}

export async function removeTelegramVinculo(empresaId: number, usuarioId: number): Promise<void> {
  const config = await getIANotificacionConfig(empresaId)
  const telegramVinculos = { ...(config.telegramVinculos ?? {}) }
  const telegramUsernames = { ...(config.telegramUsernames ?? {}) }
  delete telegramVinculos[String(usuarioId)]
  delete telegramUsernames[String(usuarioId)]

  const destinatarios = config.destinatarios.map((d) => {
    if (d.usuarioId !== usuarioId) return d
    return { ...d, canales: d.canales.filter((c) => c !== "telegram") }
  })

  await saveIANotificacionConfig(empresaId, { telegramVinculos, telegramUsernames, destinatarios })
}