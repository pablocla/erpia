import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { getEnvPresenceChecklist, isMpMockMode } from "@/lib/config/env"
import { getPublicAppUrl } from "@/lib/config/public-app-url"
import {
  computeSecurityScore,
  countPlatformEvents24h,
  listPlatformEvents,
} from "@/lib/ops/platform-events"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * GET /api/claver/platform-health
 * Solo analistas Claver — salud de flota + eventos de seguridad/ops.
 */
export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const presence = getEnvPresenceChecklist()
  const publicUrl = getPublicAppUrl()

  let dbOk = false
  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    dbOk = false
  }

  const demoAllowedInProd =
    process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO === "1"

  const security = computeSecurityScore({
    jwt: presence.required.JWT_SECRET,
    cronSecret: Boolean(presence.optional.CRON_SECRET),
    mpWebhookSecret: presence.billing.MP_WEBHOOK_SECRET,
    demoAllowedInProd,
    sentry: Boolean(process.env.SENTRY_DSN?.trim()),
    webhookSecret: Boolean(process.env.WEBHOOK_SECRET?.trim() || process.env.TWILIO_AUTH_TOKEN?.trim()),
  })

  const [events, counters] = await Promise.all([
    listPlatformEvents({ take: 40 }),
    countPlatformEvents24h(),
  ])

  return NextResponse.json({
    ok: true,
    health: {
      ok: dbOk,
      db: dbOk ? "ok" : "error",
      timestamp: new Date().toISOString(),
    },
    securityScore: security.score,
    securityFactors: security.factors,
    envPresence: {
      database: presence.required.DATABASE_URL,
      jwt: presence.required.JWT_SECRET,
      mp: presence.billing.MP_ACCESS_TOKEN,
      mpWebhook: presence.billing.MP_WEBHOOK_SECRET,
      mpMock: isMpMockMode(),
      cron: Boolean(presence.optional.CRON_SECRET),
      resend: presence.optional.RESEND_API_KEY,
      twilio: presence.optional.TWILIO,
      gemini: presence.optional.GEMINI,
      sentry: Boolean(process.env.SENTRY_DSN?.trim()),
      allowDemo: process.env.ALLOW_DEMO === "1",
      opsWorker: Boolean(process.env.OPS_WORKER_SECRET?.trim()),
    },
    webhookUrl: `${publicUrl}/api/webhooks/mercadopago`,
    counters24h: counters,
    events: events.map((e) => ({
      id: e.id,
      empresaId: e.empresaId,
      categoria: e.categoria,
      severidad: e.severidad,
      mensaje: e.mensaje,
      code: (e.metadata as { code?: string } | null)?.code,
      createdAt: e.createdAt,
    })),
  })
}
