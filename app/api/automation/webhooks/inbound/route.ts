import { NextRequest, NextResponse } from "next/server"
import { verifyAutomationRequest } from "@/lib/automation/auth"
import { handleInboundAction } from "@/lib/automation/inbound-actions"
import { logExecution } from "@/lib/automation/automation-service"
import type { SignedEnvelope } from "@/lib/automation/sign-payload"

export async function POST(request: NextRequest) {
  const raw = await request.json().catch(() => null)
  if (!raw || typeof raw !== "object") {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
  }

  const body = raw as SignedEnvelope & Record<string, unknown> & {
    action?: string
    data?: Record<string, unknown>
    payload?: Record<string, unknown>
  }

  const auth = await verifyAutomationRequest(request, body)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const action = (body.action ?? body.event) as string | undefined
  const data = (body.data ?? body.payload ?? body) as Record<string, unknown>

  if (!action || typeof action !== "string") {
    return NextResponse.json({ error: "action requerida" }, { status: 400 })
  }

  try {
    const result = await handleInboundAction(auth.auth.empresaId, action, data)
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await logExecution({
      empresaId: auth.auth.empresaId,
      direction: "inbound",
      eventKey: action,
      status: "error",
      requestPayload: body,
      responsePayload: { error: message },
    })
    return NextResponse.json({ error: message }, { status: 400 })
  }
}