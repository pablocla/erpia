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
import { dentroDeHorarioLocal } from "../horario"
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
  /** ED-20: no encola WA ni tareas; solo preview */
  dryRun?: boolean
}): Promise<
  RunResult & {
    runId: string
    dryRun?: boolean
    sinTelefono?: number
    autoEnviados?: number
    preview?: Array<Record<string, unknown>>
  }
> {
  const trigger = input.trigger ?? "manual"
  const dryRun = Boolean(input.dryRun)
  const start = Date.now()

  const empleado = input.empleadoId
    ? await loadEmpleadoScoped(input.empresaId, input.empleadoId)
    : await loadEmpleadoByCodeScoped(input.empresaId, LEO_COBRANZA_CODE)

  assertEmpleadoRunnable(empleado.estado)
  let config = parseConfig(empleado.config)

  // ED-11: trial = LLM off + límites duros + nunca auto_enviar
  if (empleado.estado === "trial") {
    config = {
      ...config,
      llmEnabled: false,
      waMode: "borrador",
      limites: {
        maxDraftsMes: Math.min(config.limites.maxDraftsMes, 30),
        maxLlmMes: 0,
        maxWaSendMes: Math.min(config.limites.maxWaSendMes, 20),
      },
    }
  }

  // ED-23: fuera de horario (solo cron; manual puede forzar)
  if (
    trigger === "cron" &&
    !dentroDeHorarioLocal(config.horarioLocal, config.timezone)
  ) {
    return {
      runId: "0",
      pathUsado: "none",
      resumen: `Fuera de horario local (${config.horarioLocal.from}–${config.horarioLocal.to} ${config.timezone}).`,
      tokensIn: 0,
      tokensOut: 0,
      accionesCount: 0,
      draftsCreados: 0,
      skipped: 0,
      detalles: [{ skip: "fuera_horario" }],
      dryRun,
    }
  }

  const idem = dryRun ? null : idempotencyKey(input.empresaId, LEO_COBRANZA_CODE, trigger)
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

  const run = dryRun
    ? null
    : await prisma.empleadoDigitalRun.create({
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
    runId: run?.id ?? BigInt(0),
    userId: input.userId,
  }

  try {
    const deudas = await leerDeudas(ctx, config)
    if (!dryRun && run) {
      await recordUsage({
        empresaId: ctx.empresaId,
        empleadoId: ctx.empleadoId,
        runId: ctx.runId,
        kind: "read_deudas",
        tool: "leer_deudas",
        quantity: deudas.length || 1,
      })
    }

    const sinTelefono = deudas.filter((d) => !d.telefono?.trim()).length

    // ED-24: tope auto-envíos por día (solo si waMode auto_enviar y no trial)
    let autoEnviadosHoy = 0
    const maxAutoDia = 10
    if (!dryRun && config.waMode === "auto_enviar" && empleado.estado !== "trial") {
      const startDay = new Date()
      startDay.setHours(0, 0, 0, 0)
      autoEnviadosHoy = await prisma.empleadoDigitalUsage.count({
        where: {
          empresaId: ctx.empresaId,
          empleadoDigitalId: ctx.empleadoId,
          kind: "wa_send",
          createdAt: { gte: startDay },
        },
      })
    }

    let drafts = 0
    let skipped = 0
    let autoEnviados = 0
    let tokensIn = 0
    let tokensOut = 0
    let pathUsado: RunResult["pathUsado"] = "rules"
    const detalles: Array<Record<string, unknown>> = []
    const preview: Array<Record<string, unknown>> = []

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
        detalles.push({
          clienteId: d.clienteId,
          skip: decision.reason,
          sinTelefono: !d.telefono?.trim(),
        })
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

      if (decision.path === "llm" && !dryRun) {
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

      // ED-20 dry-run: solo preview
      if (dryRun) {
        drafts++
        preview.push({
          clienteId: d.clienteId,
          clienteNombre: d.clienteNombre,
          monto: d.montoArs,
          dias: d.diasVencido,
          tieneTelefono: Boolean(d.telefono?.trim()),
          tieneLinkPago: Boolean(d.linkPago),
          path: decision.path,
          mensajePreview: mensaje.slice(0, 280),
        })
        detalles.push({
          clienteId: d.clienteId,
          path: decision.path,
          dryRun: true,
          monto: d.montoArs,
        })
        continue
      }

      try {
        const { tareaId } = await enviarWaBorrador(ctx, config, {
          deuda: d,
          mensaje,
          origenMensaje: origen,
        })
        drafts++

        // ED-24 auto_enviar con guardrails
        let auto = false
        if (
          config.waMode === "auto_enviar" &&
          empleado.estado !== "trial" &&
          autoEnviadosHoy + autoEnviados < maxAutoDia &&
          dentroDeHorarioLocal(config.horarioLocal, config.timezone) &&
          d.telefono?.trim()
        ) {
          try {
            const { actualizarEstadoTarea } = await import("../tools/actualizar-estado")
            await actualizarEstadoTarea(
              { ...ctx, userId: input.userId },
              config,
              { tareaId, estado: "aprobada" },
            )
            auto = true
            autoEnviados++
          } catch {
            /* queda como borrador si falla límite o envío */
          }
        }

        detalles.push({
          clienteId: d.clienteId,
          tareaId: String(tareaId),
          path: decision.path,
          reason: decision.reason,
          origen,
          monto: d.montoArs,
          autoEnviado: auto,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "error_draft"
        if (msg.includes("Tope mensual")) break
        skipped++
        detalles.push({ clienteId: d.clienteId, error: msg })
      }
    }

    // ED-21: cobertura teléfonos en resumen
    const resumen = dryRun
      ? `Vista previa: ${drafts} mensajes posibles, ${skipped} omitidos, ${sinTelefono} sin teléfono. Total radar: ${deudas.length}. (No se encoló ningún WhatsApp.)`
      : drafts === 0
        ? `Leo no encontró deudas para contactar (${skipped} omitidos, ${sinTelefono} sin teléfono). Total en radar: ${deudas.length}.`
        : autoEnviados > 0
          ? `Leo preparó ${drafts} recordatorios; auto-envió ${autoEnviados}. ${skipped} omitidos, ${sinTelefono} sin teléfono.`
          : `Leo preparó ${drafts} recordatorios de WhatsApp (pendientes de aprobación). ${skipped} omitidos, ${sinTelefono} sin teléfono.`

    // SEC-02: cap detalles
    const detallesCap = detalles.slice(0, 50).map((d) => {
      const { telefono: _t, mensaje: _m, mensajePreview: _p, ...rest } = d as Record<
        string,
        unknown
      >
      return rest
    })

    const result: RunResult & {
      dryRun?: boolean
      sinTelefono?: number
      autoEnviados?: number
      preview?: Array<Record<string, unknown>>
    } = {
      pathUsado,
      resumen,
      tokensIn,
      tokensOut,
      accionesCount: dryRun ? 0 : drafts + 1,
      draftsCreados: drafts,
      skipped,
      detalles: detallesCap,
      dryRun,
      sinTelefono,
      autoEnviados,
      preview: dryRun ? preview.slice(0, 30) : undefined,
    }

    if (run) {
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

      // Aviso al dueño por Telegram si hay borradores
      if (drafts > 0 && autoEnviados === 0) {
        void import("../agent-notify")
          .then(({ notifyLeoDraftsReady }) =>
            notifyLeoDraftsReady({
              empresaId: input.empresaId,
              drafts,
              skipped,
              sinTelefono,
              deudaRadar: deudas.reduce((s, d) => s + d.montoArs, 0),
            }),
          )
          .catch(() => {})
      }
    }

    return { ...result, runId: run ? String(run.id) : "dry-run" }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error en corrida Leo"
    if (run) {
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
    }
    throw err
  }
}
