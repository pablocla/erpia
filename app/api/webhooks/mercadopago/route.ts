import { type NextRequest, NextResponse } from "next/server"
import { handleMercadoPagoWebhook } from "@/lib/billing/mercadopago-subscription"
import { validarFirmaWebhook } from "@/lib/auth/webhook-guard"

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-signature")
    const requestId = request.headers.get("x-request-id")
    const rawBody = await request.text()
    let payload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    
    if (!validarFirmaWebhook(request, rawBody)) {
      return NextResponse.json({ error: "Firma inválida o faltante" }, { status: 401 })
    }
    await handleMercadoPagoWebhook(payload)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing MP webhook:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
