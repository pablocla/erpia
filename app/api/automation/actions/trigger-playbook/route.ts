import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyAutomationRequest } from "@/lib/automation/auth"
import { triggerPlaybookAction } from "@/lib/automation/inbound-actions"
import type { SignedEnvelope } from "@/lib/automation/sign-payload"

const schema = z.object({
  playbookKey: z.string().min(1),
  parametros: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  const raw = await request.json().catch(() => null)
  if (!raw) return NextResponse.json({ error: "Payload inválido" }, { status: 400 })

  const auth = await verifyAutomationRequest(
    request,
    raw as SignedEnvelope & Record<string, unknown>
  )
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const parsed = schema.safeParse(raw.data ?? raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await triggerPlaybookAction(
    auth.auth.empresaId,
    parsed.data.playbookKey,
    parsed.data.parametros ?? {}
  )

  return NextResponse.json({ ok: result.ok, result })
}