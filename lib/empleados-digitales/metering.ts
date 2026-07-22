/**
 * Metering unificado: acciones + tokens por empleado digital / mes.
 */

import { prisma } from "@/lib/prisma"
import type { EmpleadoLeoCobranzaConfig, LeoToolName } from "./types"

export function periodMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export type UsageKind =
  | "action"
  | "token"
  | "wa_draft"
  | "wa_send"
  | "llm_call"
  | "read_deudas"

export async function recordUsage(input: {
  empresaId: number
  empleadoId: number
  runId?: bigint
  kind: UsageKind
  tool?: LeoToolName | string
  quantity?: number
  tokensIn?: number
  tokensOut?: number
  metadata?: Record<string, unknown>
}) {
  const month = periodMonth()
  const tokensIn = input.tokensIn ?? 0
  const tokensOut = input.tokensOut ?? 0

  await prisma.empleadoDigitalUsage.create({
    data: {
      empresaId: input.empresaId,
      empleadoDigitalId: input.empleadoId,
      runId: input.runId,
      kind: input.kind,
      quantity: input.quantity ?? 1,
      tokensIn,
      tokensOut,
      tool: input.tool,
      metadata: (input.metadata as any) ?? undefined,
      periodMonth: month,
    },
  })

  // Contadores denormalizados en instancia
  if (tokensIn + tokensOut > 0 || input.kind === "wa_draft" || input.kind === "action") {
    await prisma.empleadoDigital.update({
      where: { id: input.empleadoId },
      data: {
        tokensMes: { increment: tokensIn + tokensOut },
        accionesMes: { increment: input.quantity ?? 1 },
        accionesTotal: { increment: input.quantity ?? 1 },
      },
    })
  }
}

export async function countUsageMes(
  empresaId: number,
  empleadoId: number,
  kind: UsageKind,
): Promise<number> {
  const month = periodMonth()
  const agg = await prisma.empleadoDigitalUsage.aggregate({
    where: {
      empresaId,
      empleadoDigitalId: empleadoId,
      periodMonth: month,
      kind,
    },
    _sum: { quantity: true },
  })
  return agg._sum.quantity ?? 0
}

export type LimitCheck =
  | { ok: true; draftsMes: number; llmMes: number; sendsMes: number }
  | {
      ok: false
      code: "DRAFT_LIMIT" | "LLM_LIMIT" | "SEND_LIMIT"
      message: string
      draftsMes: number
      llmMes: number
      sendsMes: number
    }

export async function checkLeoLimits(
  empresaId: number,
  empleadoId: number,
  config: EmpleadoLeoCobranzaConfig,
  intent: "wa_draft" | "llm_call" | "wa_send",
): Promise<LimitCheck> {
  const [draftsMes, llmMes, sendsMes] = await Promise.all([
    countUsageMes(empresaId, empleadoId, "wa_draft"),
    countUsageMes(empresaId, empleadoId, "llm_call"),
    countUsageMes(empresaId, empleadoId, "wa_send"),
  ])

  const base = { draftsMes, llmMes, sendsMes }

  if (intent === "wa_draft" && draftsMes >= config.limites.maxDraftsMes) {
    return {
      ok: false,
      code: "DRAFT_LIMIT",
      message: `Tope mensual de borradores (${config.limites.maxDraftsMes}). Upgradá el plan de Leo.`,
      ...base,
    }
  }
  if (intent === "llm_call" && llmMes >= config.limites.maxLlmMes) {
    return {
      ok: false,
      code: "LLM_LIMIT",
      message: `Tope mensual de personalización LLM (${config.limites.maxLlmMes}). Usamos plantilla.`,
      ...base,
    }
  }
  if (intent === "wa_send" && sendsMes >= config.limites.maxWaSendMes) {
    return {
      ok: false,
      code: "SEND_LIMIT",
      message: `Tope mensual de envíos WA (${config.limites.maxWaSendMes}).`,
      ...base,
    }
  }

  return { ok: true, ...base }
}

export async function usageResumenMes(empresaId: number, empleadoId: number) {
  const month = periodMonth()
  const rows = await prisma.empleadoDigitalUsage.groupBy({
    by: ["kind"],
    where: { empresaId, empleadoDigitalId: empleadoId, periodMonth: month },
    _sum: { quantity: true, tokensIn: true, tokensOut: true },
  })

  const byKind: Record<string, { quantity: number; tokensIn: number; tokensOut: number }> = {}
  for (const r of rows) {
    byKind[r.kind] = {
      quantity: r._sum.quantity ?? 0,
      tokensIn: r._sum.tokensIn ?? 0,
      tokensOut: r._sum.tokensOut ?? 0,
    }
  }
  return { periodMonth: month, byKind }
}
