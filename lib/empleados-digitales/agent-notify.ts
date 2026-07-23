/**
 * Avisos al dueño por Telegram (y opcional WA) cuando Leo necesita atención.
 */

import { prisma } from "@/lib/prisma"
import { TelegramService } from "@/lib/telegram/telegram-service"
import { isLeoActivo } from "./is-leo-activo"

function formatArs(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
}

/** Notifica a chats Telegram vinculados de la empresa */
export async function notifyEmpresaTelegram(
  empresaId: number,
  text: string,
): Promise<{ sent: number }> {
  const row = await prisma.configuracionIANotificacion.findUnique({
    where: { empresaId },
    select: { config: true },
  })
  const cfg = (row?.config ?? {}) as {
    telegramVinculos?: Record<string, string>
    telegramGrupoChatId?: string | null
  }

  const chatIds = new Set<string>()
  if (cfg.telegramGrupoChatId) chatIds.add(String(cfg.telegramGrupoChatId))
  for (const id of Object.values(cfg.telegramVinculos ?? {})) {
    if (id) chatIds.add(String(id))
  }

  if (chatIds.size === 0) return { sent: 0 }

  const tg = new TelegramService()
  let sent = 0
  for (const chatId of chatIds) {
    try {
      await tg.sendMessage(chatId, text)
      sent++
    } catch (err) {
      console.warn("[agent-notify] telegram fail", chatId, err)
    }
  }
  return { sent }
}

/** Tras una corrida de Leo con drafts */
export async function notifyLeoDraftsReady(input: {
  empresaId: number
  drafts: number
  skipped?: number
  sinTelefono?: number
  deudaRadar?: number
}) {
  if (input.drafts <= 0) return { sent: 0 }
  if (!(await isLeoActivo(input.empresaId))) return { sent: 0 }

  const empresa = await prisma.empresa.findUnique({
    where: { id: input.empresaId },
    select: { nombre: true },
  })

  const lines = [
    `🤖 <b>Leo Cobranza</b> — ${empresa?.nombre ?? "tu comercio"}`,
    ``,
    `Tenés <b>${input.drafts}</b> WhatsApp listos para aprobar.`,
  ]
  if (input.deudaRadar != null && input.deudaRadar > 0) {
    lines.push(`Deuda en radar: ${formatArs(input.deudaRadar)}`)
  }
  if (input.sinTelefono) {
    lines.push(`⚠ ${input.sinTelefono} deudores sin teléfono`)
  }
  lines.push(
    ``,
    `Comandos:`,
    `/leo pendientes — ver borradores`,
    `/leo aprobar <id> — aprobar uno`,
    `/leo run — nueva corrida`,
    ``,
    `O abrí el panel en la app → Empleados digitales → Leo`,
  )

  return notifyEmpresaTelegram(input.empresaId, lines.join("\n"))
}

/** Aviso cuando un cliente dice YA PAGUE */
export async function notifyLeoVerificarPago(input: {
  empresaId: number
  clienteNombre: string
  monto?: number
  tareaId: string
}) {
  const text = [
    `🔔 <b>Leo</b>: el cliente <b>${input.clienteNombre}</b> dice que YA PAGÓ.`,
    input.monto != null ? `Monto en radar: ${formatArs(input.monto)}` : "",
    `Tarea #${input.tareaId} — verificá y actualizá la cuenta.`,
    `/leo pendientes`,
  ]
    .filter(Boolean)
    .join("\n")

  return notifyEmpresaTelegram(input.empresaId, text)
}
