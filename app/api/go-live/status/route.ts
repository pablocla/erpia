import { NextResponse } from "next/server"
import { PRECIO_MINIMO_SUSCRIPCION_ARS } from "@/lib/comercial/precio-minimo"
import { getPublicAppUrl } from "@/lib/config/public-app-url"
import { getEnvPresenceChecklist, isMpMockMode } from "@/lib/config/env"

/**
 * Health comercial de go-live (sin secretos).
 * GET /api/go-live/status
 * Útil tras configurar Environment Variables en Vercel.
 */
export async function GET() {
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

  const bloqueantes = [
    !checks.database && "DATABASE_URL",
    !checks.jwt && "JWT_SECRET",
    !checks.mpConfigured && "MP_ACCESS_TOKEN (prod) — alias: MERCADOPAGO_ACCESS_TOKEN",
    !checks.mpWebhookSecret && "MP_WEBHOOK_SECRET — alias: MERCADOPAGO_WEBHOOK_SECRET",
  ].filter(Boolean) as string[]

  const go = bloqueantes.length === 0

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
    ].filter(Boolean),
    message: go
      ? "Config mínima de cobro OK. Completá advertencias según lo que vendas."
      : `NO-GO: falta ${bloqueantes.join(", ")}`,
    hint: "Vercel → Project → Settings → Environment Variables (Production). No hace falta .env en el repo.",
  })
}
