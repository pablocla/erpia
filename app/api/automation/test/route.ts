import { NextRequest, NextResponse } from "next/server"
import { requireAutomationAdmin } from "@/lib/automation/api-guard"
import { emitToN8n } from "@/lib/automation/n8n-bridge"
import { buildIdempotencyKey } from "@/lib/automation/sign-payload"

export async function POST(request: NextRequest) {
  const guard = await requireAutomationAdmin(request)
  if (!guard.ok) return guard.response

  const result = await emitToN8n(
    guard.auth.empresaId,
    "WEBHOOK_TEST",
    {
      message: "Prueba de conexión NOP → n8n",
      triggeredBy: guard.auth.email,
      at: new Date().toISOString(),
    },
    buildIdempotencyKey(guard.auth.empresaId, "WEBHOOK_TEST", `test-${Date.now()}`)
  )

  return NextResponse.json({
    ok: result.sent,
    reason: result.reason,
    eventKey: "WEBHOOK_TEST",
  })
}