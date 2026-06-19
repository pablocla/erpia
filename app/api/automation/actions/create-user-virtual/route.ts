import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyAutomationRequest } from "@/lib/automation/auth"
import { createVirtualAutomationUser } from "@/lib/automation/inbound-actions"
import type { SignedEnvelope } from "@/lib/automation/sign-payload"

const schema = z.object({
  nombre: z.string().min(1),
  rol: z.string().min(1),
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

  const { usuario, apiKey } = await createVirtualAutomationUser(
    auth.auth.empresaId,
    parsed.data
  )

  return NextResponse.json(
    {
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        esVirtual: usuario.esVirtual,
      },
      apiKey,
    },
    { status: 201 }
  )
}