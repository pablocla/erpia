/**
 * Orchestrator Leo Cobranza — hybrid 80% rules / 20% LLM
 */

import { prisma } from "@/lib/prisma"
import {
  assertEmpleadoRunnable,
  loadEmpleadoByCodeScoped,
  loadEmpleadoScoped,
} from "../security"
import { recordUsage } from "../metering"
import { decideMensajePath } from "./router"
import { leerDeudas } from "../tools/leer-deudas"
import { plantillaCobranza } from "../tools/generar-recordatorio"
import { enviarWaBorrador } from "../tools/enviar-wa-borrador"
import { personalizarMensajeLlm } from "../tools/personalizar-mensaje-llm"
import { countContactos7d, yaContactadoHoy } from "../tools/contactos"
import {
  DEFAULT_LEO_CONFIG,
  LEO_COBRANZA_CODE,
  type EmpleadoLeoCobranzaConfig,
  type RunResult,
  type RunTrigger,
  type ToolContext,
} from "../types"

function parseConfig(raw: unknown): EmpleadoLeoCobranzaConfig {
  const c = (raw && typeof raw === "object" ? raw : {}) as Partial<EmpleadoLeoCobranzaConfig>
  return {
    ...DEFAULT_LEO_CONFIG,
    ...c,
    llmSoloSi: { ...DEFAULT_LEO_CONFIG.llmSoloSi, ...c.llmSoloSi },
    horarioLocal: { ...DEFAULT_LEO_CONFIG.horarioLocal, ...c.horarioLocal },
    limites: { ...DEFAULT_LEO_CONFIG.limites, ...c.limites },
    excluirClienteIds: c.excluirClienteIds ?? DEFAULT_LEO_CONFIG.excluirClienteIds,
    fuentes: c.fuentes ?? DEFAULT_LEO_CONFIG.fuentes,
  }
}

function idempotencyKey(empresaId: number, code: string, trigger: RunTrigger): string | null {
  if (trigger !== "cron") return null
  const d = new Date()
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  return `${empresaId}:${code}:${day}:cron`
}

export async function runLeoCobranza(input: {
  empresaId: number
  empleadoId?: number
  trigger?: RunTrigger
  userId?: number
}): Promise<RunResult & { runId: string }> {
  const trigger = input.trigger ?? "manual"
  const start = Date.now()

  const empleado = input.empleadoId
    ? await loadEmpleadoScoped(input.empresaId, input.empleadoId)
    : await loadEmpleadoByCodeScoped(input.empresaId, LEO_COBRANZA_CODE)

  assertEmpleadoRunnable(empleado.estado)
  const config = parseConfig(empleado.config)

  const idem = idempotencyKey(input.empresaId, LEO_COBRANZA_CODE, trigger)
  if (idem) {
    const existing = await prisma.empleadoDigitalRun.findUnique({
      where: { idempotencyKey: idem },
    })
    if (existing && existing.status !== "error") {
      return {
        runId: String(existing.id),
        pathUsado: (existing.pathUsado as RunResult["pathUsado"]) || "rules",
        resumen: existing.resumen || "Corrida del día ya ejecutada (idempotente).",
        tokensIn: existing.tokensIn,
        tokensOut: existing.tokensOut,
        accionesCount: existing.accionesCount,
        draftsCreados: 0,
        skipped: 0,
        detalles: [],
      }
    }
  }

  const run = await prisma.empleadoDigitalRun.create({
    data: {
      empresaId: input.empresaId,
      empleadoDigitalId: empleado.id,
      triggeredBy: trigger,
      status: "running",
      pathUsado: "rules",
      idempotencyKey: idem ?? undefined,
    },
  })

  const ctx: ToolContext = {
    empresaId: input.empresaId,
    empleadoId: empleado.id,
    runId: run.id,
    userId: input.userId,
  }

  try {
    const deudas = await leerDeudas(ctx, config)
    await recordUsage({
      empresaId: ctx.empresaId,
      empleadoId: ctx.empleadoId,
      runId: ctx.runId,
      kind: "read_deudas",
      tool: "leer_deudas",
      quantity: deudas.length || 1,
    })

    let drafts = 0
    let skipped = 0
    let tokensIn = 0
    let tokensOut = 0
    let pathUsado: RunResult["pathUsado"] = "rules"
    const detalles: Array<Record<string, unknown>> = []

    for (const d of deudas) {
      if (drafts >= config.maxDraftsPorRun) break

      const [contactos7d, hoy] = await Promise.all([
        countContactos7d(ctx.empresaId, d.clienteId),
        yaContactadoHoy(ctx.empresaId, d.clienteId),
      ])

      const decision = decideMensajePath(d, config, {
        contactos7d,
        yaContactadoHoy: hoy,
      })

      if (decision.path === "skip") {
        skipped++
        detalles.push({ clienteId: d.clienteId, skip: decision.reason })
        continue
      }

      let mensaje = plantillaCobranza({
        nombreComercio: d.empresaNombre,
        nombreCliente: d.clienteNombre,
        monto: d.montoArs,
        dias: d.diasVencido,
        linkPago: d.linkPago,
        tono: config.tono,
      })
      let origen: "template" | "llm" = "template"

      if (decision.path === "llm") {
        const llm = await personalizarMensajeLlm(ctx, config, {
          deuda: d,
          plantillaBase: mensaje,
        })
        mensaje = llm.mensaje
        tokensIn += llm.tokensIn
        tokensOut += llm.tokensOut
        if (llm.usedLlm) {
          origen = "llm"
          pathUsado = "hybrid"
        }
      }

      try {
        const { tareaId } = await enviarWaBorrador(ctx, config, {
          deuda: d,
          mensaje,
          origenMensaje: origen,
        })
        drafts++
        detalles.push({
          clienteId: d.clienteId,
          tareaId: String(tareaId),
          path: decision.path,
          reason: decision.reason,
          origen,
          monto: d.montoArs,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "error_draft"
        if (msg.includes("Tope mensual")) break
        skipped++
        detalles.push({ clienteId: d.clienteId, error: msg })
      }
    }

    const resumen =
      drafts === 0
        ? `Leo no encontró deudas para contactar (${skipped} omitidos). Total en radar: ${deudas.length}.`
        : `Leo preparó ${drafts} recordatorios de WhatsApp (pendientes de aprobación). ${skipped} omitidos.`

    const result: RunResult = {
      pathUsado,
      resumen,
      tokensIn,
      tokensOut,
      accionesCount: drafts + 1,
      draftsCreados: drafts,
      skipped,
      detalles,
    }

    await prisma.empleadoDigitalRun.update({
      where: { id: run.id },
      data: {
        status: drafts > 0 || deudas.length === 0 ? "success" : "partial",
        pathUsado: result.pathUsado,
        resumen: result.resumen,
        detalles: result.detalles as any,
        durationMs: Date.now() - start,
        tokensIn,
        tokensOut,
        accionesCount: result.accionesCount,
        finishedAt: new Date(),
      },
    })

    await prisma.empleadoDigital.update({
      where: { id: empleado.id },
      data: {
        lastRunAt: new Date(),
        lastSuccessAt: new Date(),
        runsTotal: { increment: 1 },
      },
    })

    return { ...result, runId: String(run.id) }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error en corrida Leo"
    await prisma.empleadoDigitalRun.update({
      where: { id: run.id },
      data: {
        status: "error",
        error: message,
        durationMs: Date.now() - start,
        finishedAt: new Date(),
      },
    })
    await prisma.empleadoDigital.update({
      where: { id: empleado.id },
      data: { lastRunAt: new Date(), runsTotal: { increment: 1 } },
    })
    throw err
  }
}
