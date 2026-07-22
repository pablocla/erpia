/**
 * Eventos de plataforma (seguridad / ops) — feed para Claver Cloud.
 * Persiste vía SistemaLog (categoria platform|security) sin migración nueva.
 */
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import { prisma } from "@/lib/prisma"

export type PlatformSeverity = "sev1" | "sev2" | "sev3" | "sev4"

export type PlatformEventSource =
  | "health"
  | "webhook"
  | "cron"
  | "auth"
  | "afip"
  | "billing"
  | "worker"
  | "impersonation"
  | "api"

export type PlatformEventCode =
  | "WEBHOOK_SIG_INVALID"
  | "CRON_UNAUTHORIZED"
  | "DB_DOWN"
  | "DEMO_BLOCKED"
  | "DEMO_LOGIN"
  | "JWT_MISCONFIG"
  | "WORKER_ERROR"
  | "IMPERSONATION_START"
  | "FATAL_ERROR"
  | string

const SEV_TO_LOG: Record<PlatformSeverity, string> = {
  sev1: "fatal",
  sev2: "error",
  sev3: "warn",
  sev4: "info",
}

/** Rate-limit in-memory: mismo code como máximo 1/min */
const lastEmit = new Map<string, number>()
const DEDUPE_MS = 60_000

function shouldEmit(code: string): boolean {
  const now = Date.now()
  const prev = lastEmit.get(code) ?? 0
  if (now - prev < DEDUPE_MS) return false
  lastEmit.set(code, now)
  return true
}

export async function recordPlatformEvent(input: {
  severity: PlatformSeverity
  source: PlatformEventSource
  code: PlatformEventCode
  message: string
  empresaId?: number
  meta?: Record<string, unknown>
  skipDedupe?: boolean
}): Promise<void> {
  if (!input.skipDedupe && !shouldEmit(String(input.code))) return

  const severidad = SEV_TO_LOG[input.severity]
  const logLine = {
    ts: new Date().toISOString(),
    platformEvent: true,
    ...input,
  }
  if (input.severity === "sev1" || input.severity === "sev2") {
    console.error(JSON.stringify(logLine))
  } else {
    console.warn(JSON.stringify(logLine))
  }

  // empresaId 0 = evento de flota / plataforma (schema exige Int)
  await persistSistemaLog({
    empresaId: input.empresaId && input.empresaId > 0 ? input.empresaId : 0,
    severidad,
    categoria: input.source === "webhook" || input.source === "auth" ? "security" : "platform",
    contexto: `${input.source}:${input.code}`,
    mensaje: input.message,
    metadata: {
      code: input.code,
      source: input.source,
      severity: input.severity,
      ...(input.meta ?? {}),
    },
  })
}

export async function listPlatformEvents(opts?: {
  take?: number
  severities?: string[]
  categoria?: string
}): Promise<
  Array<{
    id: number
    empresaId: number
    categoria: string
    severidad: string
    mensaje: string
    metadata: unknown
    createdAt: Date
  }>
> {
  const take = Math.min(opts?.take ?? 50, 200)
  const db = prisma as any
  try {
    const where: Record<string, unknown> = {
      categoria: { in: ["security", "platform"] },
    }
    if (opts?.severities?.length) {
      where.severidad = { in: opts.severities }
    }
    return await db.sistemaLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
    })
  } catch {
    return []
  }
}

export async function countPlatformEvents24h(): Promise<Record<string, number>> {
  const db = prisma as any
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  try {
    const rows = await db.sistemaLog.findMany({
      where: {
        categoria: { in: ["security", "platform"] },
        createdAt: { gte: since },
      },
      select: { metadata: true, severidad: true, mensaje: true },
      take: 2000,
    })
    const counters: Record<string, number> = {
      total: rows.length,
      fatal: 0,
      error: 0,
      WEBHOOK_SIG_INVALID: 0,
      CRON_UNAUTHORIZED: 0,
      DEMO_LOGIN: 0,
    }
    for (const r of rows) {
      if (r.severidad === "fatal") counters.fatal++
      if (r.severidad === "error") counters.error++
      const code = (r.metadata as { code?: string } | null)?.code
      if (code && code in counters) counters[code]++
    }
    return counters
  } catch {
    return { total: 0, fatal: 0, error: 0, WEBHOOK_SIG_INVALID: 0, CRON_UNAUTHORIZED: 0, DEMO_LOGIN: 0 }
  }
}

/** Score 0–100 de higiene de seguridad de plataforma (env flags). */
export function computeSecurityScore(presence: {
  jwt: boolean
  cronSecret: boolean
  mpWebhookSecret: boolean
  demoAllowedInProd: boolean
  sentry: boolean
  webhookSecret: boolean
}): { score: number; factors: Record<string, boolean> } {
  const factors = {
    jwt: presence.jwt,
    cronSecret: presence.cronSecret,
    mpWebhookSecret: presence.mpWebhookSecret,
    demoLocked: !presence.demoAllowedInProd,
    sentry: presence.sentry,
    webhookSecret: presence.webhookSecret,
  }
  const values = Object.values(factors)
  const score = Math.round((values.filter(Boolean).length / values.length) * 100)
  return { score, factors }
}
