/**
 * Comandos del bot Telegram para consultas rápidas al ERP.
 */

import { prisma } from "@/lib/prisma"
import { parseAlertaMetadata } from "@/lib/ai/alerta-seguimiento"
import { telegramService } from "./telegram-service"
import { saveTelegramVinculo, parseTelegramStartPayload, verifyTelegramLinkToken } from "./telegram-vinculo"

interface TelegramUser {
  chatId: string
  username?: string
}

interface VinculoActivo {
  empresaId: number
  usuarioId: number
}

/** Resuelve empresa+usuario desde chat_id buscando en configs */
async function resolverVinculoPorChat(chatId: string): Promise<VinculoActivo | null> {
  const configs = await prisma.configuracionIANotificacion.findMany({
    select: { empresaId: true, config: true },
  })

  for (const row of configs) {
    const cfg = row.config as { telegramVinculos?: Record<string, string> }
    if (!cfg.telegramVinculos) continue
    for (const [usuarioId, storedChatId] of Object.entries(cfg.telegramVinculos)) {
      if (storedChatId === chatId) {
        return { empresaId: row.empresaId, usuarioId: Number(usuarioId) }
      }
    }
  }
  return null
}

export async function procesarMensajeTelegram(
  user: TelegramUser,
  text: string,
): Promise<string> {
  const trimmed = text.trim()
  const lower = trimmed.toLowerCase()

  if (lower.startsWith("/start")) {
    const payload = trimmed.split(/\s+/)[1]
    if (payload) {
      const parsed = parseTelegramStartPayload(payload)
      if (parsed && verifyTelegramLinkToken(parsed.empresaId, parsed.usuarioId, parsed.token)) {
        await saveTelegramVinculo(parsed.empresaId, parsed.usuarioId, user.chatId, user.username)
        const empresa = await prisma.empresa.findUnique({
          where: { id: parsed.empresaId },
          select: { nombre: true },
        })
        return `✅ Vinculado a <b>${empresa?.nombre ?? "Cleverp"}</b>.\n\nComandos:\n/alertas — alertas pendientes\n/stock — productos bajo mínimo\n/ot — órdenes de producción activas\n/ayuda — lista de comandos`
      }
      return "❌ Link de vinculación inválido o expirado. Generá uno nuevo desde Cleverp → IA → Notificaciones."
    }
    const vinculo = await resolverVinculoPorChat(user.chatId)
    if (vinculo) {
      return "Ya estás vinculado. Usá /ayuda para ver comandos."
    }
    return "👋 Hola. Para vincular tu cuenta, abrí el link desde Cleverp → Asistente IA → Notificaciones → Vincular Telegram."
  }

  const vinculo = await resolverVinculoPorChat(user.chatId)
  if (!vinculo) {
    return "⚠️ Cuenta no vinculada. Pedile a un admin el link de vinculación en Cleverp."
  }

  const { empresaId } = vinculo

  if (lower === "/ayuda" || lower === "/help") {
    return [
      "<b>Comandos Cleverp</b>",
      "/alertas — alertas IA pendientes",
      "/stock — productos bajo stock mínimo",
      "/ot — órdenes de producción en curso",
      "/ventas — resumen ventas de hoy",
      "",
      "<b>Leo Cobranza</b>",
      "/leo — estado de Leo",
      "/leo run — correr cobranzas (drafts)",
      "/leo pendientes — borradores a aprobar",
      "/leo aprobar &lt;id&gt; — aprobar un borrador",
    ].join("\n")
  }

  // ── Leo Cobranza (hablar con el agente por Telegram) ──
  if (lower === "/leo" || lower.startsWith("/leo ")) {
    return handleLeoTelegramCommand(empresaId, vinculo.usuarioId, trimmed)
  }

  if (lower === "/alertas") {
    const alertas = await prisma.alertaIA.findMany({
      where: { empresaId, resuelta: false },
      orderBy: { createdAt: "desc" },
      take: 8,
    })
    if (!alertas.length) return "✅ Sin alertas pendientes."
    return alertas
      .map((a) => {
        const meta = parseAlertaMetadata(a.datos)
        return `• [${a.prioridad.toUpperCase()}] ${a.titulo}\n  ${a.descripcion.slice(0, 80)}… (${meta.estadoSeguimiento})`
      })
      .join("\n\n")
  }

  if (lower.startsWith("/stock")) {
    const q = trimmed.slice(6).trim().toLowerCase()
    const productos = await prisma.producto.findMany({
      where: {
        empresaId,
        activo: true,
        ...(q ? { nombre: { contains: q, mode: "insensitive" } } : {}),
      },
      select: { nombre: true, stock: true, stockMinimo: true, unidad: true },
      take: 15,
    })
    const criticos = productos.filter((p) => p.stockMinimo != null && p.stock < p.stockMinimo)
    const lista = (q ? productos : criticos).slice(0, 10)
    if (!lista.length) return q ? `Sin resultados para "${q}"` : "✅ Stock OK — ningún producto bajo mínimo."
    return lista
      .map((p) => `• ${p.nombre}: ${p.stock} ${p.unidad}${p.stockMinimo ? ` (mín ${p.stockMinimo})` : ""}`)
      .join("\n")
  }

  if (lower.startsWith("/ot")) {
    const num = trimmed.slice(3).trim()
    if (num) {
      const ot = await prisma.ordenProduccion.findFirst({
        where: { empresaId, numero: { contains: num, mode: "insensitive" } },
        include: { producto: { select: { nombre: true } } },
      })
      if (!ot) return `OT "${num}" no encontrada.`
      const pct = ot.cantidad > 0 ? Math.round((ot.cantidadProd / ot.cantidad) * 100) : 0
      return [
        `<b>OT ${ot.numero}</b>`,
        `Producto: ${ot.producto?.nombre ?? "—"}`,
        `Estado: ${ot.estado}`,
        `Avance: ${ot.cantidadProd}/${ot.cantidad} (${pct}%)`,
        ot.fechaFinPlan ? `Fin planificado: ${ot.fechaFinPlan.toLocaleDateString("es-AR")}` : "",
      ].filter(Boolean).join("\n")
    }

    const ots = await prisma.ordenProduccion.findMany({
      where: { empresaId, estado: { in: ["en_proceso", "pausada", "borrador"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { producto: { select: { nombre: true } } },
    })
    if (!ots.length) return "Sin OTs activas."
    return ots
      .map((o) => `• ${o.numero} [${o.estado}] ${o.producto?.nombre ?? ""} — ${o.cantidadProd}/${o.cantidad}`)
      .join("\n")
  }

  if (lower === "/ventas") {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const agg = await prisma.factura.aggregate({
      where: { empresaId, createdAt: { gte: hoy } },
      _sum: { total: true },
      _count: true,
    })
    const total = Number(agg._sum.total ?? 0)
    return `📊 Ventas hoy: <b>$${total.toLocaleString("es-AR")}</b> (${agg._count} operaciones)`
  }

  return "Comando no reconocido. Escribí /ayuda"
}

async function handleLeoTelegramCommand(
  empresaId: number,
  usuarioId: number,
  trimmed: string,
): Promise<string> {
  const parts = trimmed.split(/\s+/).filter(Boolean)
  const sub = (parts[1] ?? "").toLowerCase()

  const emp = await prisma.empleadoDigital.findFirst({
    where: {
      empresaId,
      estado: { in: ["activo", "trial"] },
      template: { code: "leo_cobranza" },
    },
    include: { template: { select: { code: true, nombre: true } } },
  })

  if (!emp && sub !== "activar") {
    return [
      "Leo no está activado en esta empresa.",
      "Activálo desde la app: Empleados digitales → Activar Leo",
      "o escribí <code>/leo activar</code> (trial).",
    ].join("\n")
  }

  if (!sub || sub === "status" || sub === "estado") {
    if (!emp) return "Leo no activado."
    const pend = await prisma.empleadoDigitalTarea.count({
      where: { empresaId, empleadoDigitalId: emp.id, estado: "pendiente" },
    })
    return [
      `🤖 <b>${emp.template.nombre}</b>`,
      `Estado: <b>${emp.estado}</b>`,
      `Corridas: ${emp.runsTotal}`,
      `Borradores pendientes: <b>${pend}</b>`,
      emp.lastRunAt
        ? `Última corrida: ${emp.lastRunAt.toLocaleString("es-AR")}`
        : "Sin corridas aún",
      ``,
      `/leo run · /leo pendientes · /leo aprobar ID`,
    ].join("\n")
  }

  if (sub === "activar") {
    const { activarLeoCobranza } = await import("@/lib/empleados-digitales/activate")
    await activarLeoCobranza(empresaId, { trial: true })
    return "✅ Leo activado en <b>trial</b>. Usá /leo run para generar borradores."
  }

  if (sub === "run" || sub === "correr") {
    try {
      const { runEmpleado } = await import("@/lib/empleados-digitales/runtime/run-empleado")
      const r = await runEmpleado({
        empresaId,
        code: "leo_cobranza",
        empleadoId: emp!.id,
        trigger: "manual",
        userId: usuarioId,
      })
      return `✅ ${r.resumen}\nDrafts: ${r.draftsCreados} · Omitidos: ${r.skipped}`
    } catch (e) {
      return `❌ ${e instanceof Error ? e.message : "Error al correr Leo"}`
    }
  }

  if (sub === "pendientes" || sub === "drafts") {
    const tareas = await prisma.empleadoDigitalTarea.findMany({
      where: {
        empresaId,
        empleadoDigitalId: emp!.id,
        estado: "pendiente",
      },
      orderBy: [{ prioridad: "desc" }, { createdAt: "asc" }],
      take: 10,
    })
    if (!tareas.length) return "✅ Sin borradores pendientes. /leo run para generar."
    return [
      `<b>Pendientes (${tareas.length})</b>`,
      ...tareas.map((t) => {
        const mon =
          t.montoArs != null
            ? Number(t.montoArs).toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0,
              })
            : "—"
        return `• <code>${t.id}</code> cli#${t.clienteId ?? "?"} ${mon}\n  ${(t.mensaje ?? "").slice(0, 100)}…`
      }),
      ``,
      `Aprobar: /leo aprobar ID`,
    ].join("\n")
  }

  if (sub === "aprobar") {
    const id = parts[2]
    if (!id) return "Uso: /leo aprobar &lt;id&gt;"
    try {
      const { actualizarEstadoTarea } = await import(
        "@/lib/empleados-digitales/tools/actualizar-estado"
      )
      const { DEFAULT_LEO_CONFIG } = await import("@/lib/empleados-digitales/types")
      const config = {
        ...DEFAULT_LEO_CONFIG,
        ...((emp!.config as object) || {}),
      }
      await actualizarEstadoTarea(
        {
          empresaId,
          empleadoId: emp!.id,
          runId: BigInt(0),
          userId: usuarioId,
        },
        config,
        { tareaId: BigInt(id), estado: "aprobada" },
      )
      return `✅ Borrador <code>${id}</code> aprobado. Sale por la cola WhatsApp (Twilio) si está configurada.`
    } catch (e) {
      return `❌ ${e instanceof Error ? e.message : "No se pudo aprobar"}`
    }
  }

  return "Subcomando Leo: status | activar | run | pendientes | aprobar ID"
}

export async function manejarUpdateTelegram(update: {
  message?: {
    chat: { id: number }
    from?: { username?: string }
    text?: string
  }
}) {
  const msg = update.message
  if (!msg?.text) return

  const response = await procesarMensajeTelegram(
    { chatId: String(msg.chat.id), username: msg.from?.username },
    msg.text,
  )

  await telegramService.sendMessage(msg.chat.id, response)
}