import { type NextRequest, NextResponse } from "next/server"
import { handleMercadoPagoWebhook } from "@/lib/billing/mercadopago-subscription"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    // In production, we would verify the MP signature/hmac here.
    
    await handleMercadoPagoWebhook(payload)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing MP webhook:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
