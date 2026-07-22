import { type NextRequest, NextResponse } from "next/server"
import { validarFirmaWebhook } from "@/lib/auth/webhook-guard"
import { handleMercadoPagoWebhook } from "@/lib/billing/mercadopago-subscription"
import { recordPlatformEvent } from "@/lib/ops/platform-events"

/**
 * Legacy alias de webhook MP.
 * YA NO procesa sin firma. Delega al mismo flujo que /api/webhooks/mercadopago.
 * Configurar en panel MP: https://TU_DOMINIO/api/webhooks/mercadopago
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    let payload: unknown
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    if (!validarFirmaWebhook(request, rawBody)) {
      void recordPlatformEvent({
        severity: "sev2",
        source: "webhook",
        code: "WEBHOOK_SIG_INVALID",
        message: "Firma inválida en /api/mercadopago/webhook (legacy)",
        meta: { path: "/api/mercadopago/webhook" },
      })
      return NextResponse.json({ error: "Firma inválida o faltante" }, { status: 401 })
    }

    await handleMercadoPagoWebhook(payload as Parameters<typeof handleMercadoPagoWebhook>[0])
    return NextResponse.json({ success: true, legacy: true })
  } catch (error) {
    console.error("Error webhook MP legacy:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
