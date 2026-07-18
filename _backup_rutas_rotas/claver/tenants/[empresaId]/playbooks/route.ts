import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { ANALYST_PLAYBOOKS, ejecutarPlaybookAnalista } from "@/lib/ops/analyst-playbooks"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  const { empresaId } = await params
  const id = Number(empresaId)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
  }

  const ctx = await getClaverAnalystEmpresaContext(request, id)
  if (!ctx.ok) return ctx.response

  return NextResponse.json({ playbooks: ANALYST_PLAYBOOKS })
}

const schema = z.object({
  playbookId: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId } = await params
    const id = Number(empresaId)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
    }

    const ctx = await getClaverAnalystEmpresaContext(request, id)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "playbookId requerido" }, { status: 400 })
    }

    const result = await ejecutarPlaybookAnalista(id, parsed.data.playbookId, ctx.auth.email)
    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}