import { NextResponse } from "next/server"
import { PRECIO_MINIMO_SUSCRIPCION_ARS } from "@/lib/comercial/precio-minimo"
import { getPublicAppUrl } from "@/lib/config/public-app-url"

/**
 * Health comercial de go-live (sin secretos).
 * GET /api/go-live/status
 */
export async function GET() {
  const mpToken = process.env.MP_ACCESS_TOKEN ?? ""
  const mpMock = !mpToken || mpToken.startsWith("TEST-mock")
  const publicUrl = getPublicAppUrl()

  const checks = {
    database: Boolean(process.env.DATABASE_URL),
    jwt: Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16),
    publicUrl,
    mpConfigured: Boolean(mpToken) && !mpMock,
    mpMock,
    mpWebhookSecret: Boolean(process.env.MP_WEBHOOK_SECRET),
    resend: Boolean(process.env.RESEND_API_KEY),
    twilio: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    afipProd:
      process.env.AFIP_ENTORNO === "produccion" &&
      Boolean(process.env.AFIP_CERT_PROD && process.env.AFIP_KEY_PROD),
  }

  const bloqueantes = [
    !checks.database && "DATABASE_URL",
    !checks.jwt && "JWT_SECRET",
    !checks.mpConfigured && "MP_ACCESS_TOKEN (prod)",
    !checks.mpWebhookSecret && "MP_WEBHOOK_SECRET",
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
      !checks.resend && "Sin RESEND: fiado no manda emails",
      !checks.twilio && "Sin Twilio: no vender Cobrá WA como automático",
      !checks.afipProd && "AFIP no está en producción (OK para demo ticket)",
      checks.mpMock && "Mercado Pago en modo mock",
    ].filter(Boolean),
    message: go
      ? "Config mínima de cobro OK. Completá advertencias según lo que vendas."
      : `NO-GO: falta ${bloqueantes.join(", ")}`,
  })
}
