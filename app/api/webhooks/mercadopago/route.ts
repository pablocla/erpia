import { type NextRequest, NextResponse } from "next/server"
import { handleMercadoPagoWebhook } from "@/lib/billing/mercadopago-subscription"
import { validarFirmaWebhook } from "@/lib/auth/webhook-guard"
import { recordPlatformEvent } from "@/lib/ops/platform-events"

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    let payload
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
        message: "Firma inválida en /api/webhooks/mercadopago",
        meta: { path: "/api/webhooks/mercadopago" },
      })
      return NextResponse.json({ error: "Firma inválida o faltante" }, { status: 401 })
    }
    await handleMercadoPagoWebhook(payload)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing MP webhook:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
