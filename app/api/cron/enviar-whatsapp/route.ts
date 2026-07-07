import { NextResponse } from "next/server"
import { verifyCronAuth } from "@/lib/scheduling/cron-auth"
import { runWhatsAppOutbound } from "@/lib/scheduling/jobs/whatsapp-outbound"

export async function GET(request: Request) {
  const authError = verifyCronAuth(request)
  if (authError) return authError

  try {
    const result = await runWhatsAppOutbound()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[Cron WhatsApp] Error:", error)
    return NextResponse.json({ error: "Error en cron WhatsApp" }, { status: 500 })
  }
}