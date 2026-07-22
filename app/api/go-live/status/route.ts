import { type NextRequest, NextResponse } from "next/server"
import { PRECIO_MINIMO_SUSCRIPCION_ARS } from "@/lib/comercial/precio-minimo"
import { getPublicAppUrl } from "@/lib/config/public-app-url"
import { getEnvPresenceChecklist, isMpMockMode } from "@/lib/config/env"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { authorizeCronRequest } from "@/lib/auth/cron-guard"

/**
 * Health comercial de go-live.
 * Público: solo booleans agregados (sin nombres de secretos faltantes).
 * Analista JWT o CRON_SECRET: detalle completo (checks + bloqueantes).
 */
export async function GET(request: NextRequest) {
  const presence = getEnvPresenceChecklist()
  const publicUrl = getPublicAppUrl()
  const mpMock = isMpMockMode()

  const checks = {
    database: presence.required.DATABASE_URL,
    directUrl: presence.required.DIRECT_URL,
    jwt: presence.required.JWT_SECRET,
    publicUrl,
    vercel: presence.runtime.vercel,
    vercelEnv: presence.runtime.vercelEnv,
    mpConfigured: presence.billing.MP_ACCESS_TOKEN,
    mpMock,
    mpWebhookSecret: presence.billing.MP_WEBHOOK_SECRET,
    resend: presence.optional.RESEND_API_KEY,
    twilio: presence.optional.TWILIO,
    gemini: presence.optional.GEMINI,
    cronSecret: presence.optional.CRON_SECRET,
    afipProd:
      process.env.AFIP_ENTORNO === "produccion" &&
      Boolean(process.env.AFIP_CERT_PROD && process.env.AFIP_KEY_PROD),
  }

  const bloqueantesCount = [
    !checks.database,
    !checks.jwt,
    !checks.mpConfigured,
    !checks.mpWebhookSecret,
  ].filter(Boolean).length

  const go = bloqueantesCount === 0

  // Acceso extendido: analista o cron secret
  let fullDetail = false
  if (authorizeCronRequest(request)) {
    fullDetail = true
  } else {
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      const ctx = await getClaverAnalystContext(request)
      if (ctx.ok) fullDetail = true
    }
  }

  if (!fullDetail) {
    return NextResponse.json({
      go,
      precioMinimoSuscripcionArs: PRECIO_MINIMO_SUSCRIPCION_ARS,
      anclaGratis: "pos.fiado_barrio",
      webhookUrl: `${publicUrl}/api/webhooks/mercadopago`,
      checks: {
        database: checks.database,
        jwt: checks.jwt,
        mpConfigured: checks.mpConfigured,
        mpWebhookSecret: checks.mpWebhookSecret,
        mpMock: checks.mpMock,
      },
      missingCriticalCount: bloqueantesCount,
      message: go
        ? "Config mínima de cobro OK."
        : `NO-GO: faltan ${bloqueantesCount} variables críticas (detalle solo para analistas).`,
      hint: "Vercel → Project → Settings → Environment Variables (Production).",
    })
  }

  const bloqueantes = [
    !checks.database && "DATABASE_URL",
    !checks.jwt && "JWT_SECRET",
    !checks.mpConfigured && "MP_ACCESS_TOKEN (prod) — alias: MERCADOPAGO_ACCESS_TOKEN",
    !checks.mpWebhookSecret && "MP_WEBHOOK_SECRET — alias: MERCADOPAGO_WEBHOOK_SECRET",
  ].filter(Boolean) as string[]

  return NextResponse.json({
    go,
    precioMinimoSuscripcionArs: PRECIO_MINIMO_SUSCRIPCION_ARS,
    anclaGratis: "pos.fiado_barrio",
    webhookUrl: `${publicUrl}/api/webhooks/mercadopago`,
    checks,
    bloqueantes,
    advertencias: [
      !checks.directUrl && "Sin DIRECT_URL: migraciones Prisma en build pueden fallar",
      !checks.resend && "Sin RESEND: fiado no manda emails",
      !checks.twilio && "Sin Twilio: no vender Cobrá WA como automático",
      !checks.gemini && "Sin Gemini: auditorías demo usan resumen local",
      !checks.afipProd && "AFIP no está en producción (OK para demo ticket)",
      checks.mpMock && "Mercado Pago en modo mock",
      !checks.cronSecret && "Sin CRON_SECRET: crons Vercel pueden quedar abiertos",
      process.env.ALLOW_DEMO === "1" && "ALLOW_DEMO=1: endpoint /api/auth/demo habilitado en este entorno",
    ].filter(Boolean),
    message: go
      ? "Config mínima de cobro OK. Completá advertencias según lo que vendas."
      : `NO-GO: falta ${bloqueantes.join(", ")}`,
    hint: "Vercel → Project → Settings → Environment Variables (Production). No hace falta .env en el repo.",
  })
}
