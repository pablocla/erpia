import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyAutomationRequest } from "@/lib/automation/auth"
import { createAutomationTask } from "@/lib/automation/inbound-actions"
import type { SignedEnvelope } from "@/lib/automation/sign-payload"

const schema = z.object({
  titulo: z.string().optional(),
  descripcion: z.string().min(1),
  rolAsignado: z.string().min(1),
  prioridad: z.enum(["baja", "media", "alta", "bloqueante", "urgente"]).optional(),
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

  const tarea = await createAutomationTask(auth.auth.empresaId, parsed.data)
  return NextResponse.json({ ok: true, tarea }, { status: 201 })
}