import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import {
  aprobarAfipProduccion,
  getAfipProdPending,
  solicitarAfipProduccion,
} from "@/lib/ops/afip-produccion-approval-service"

export async function GET(
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

    const pending = await getAfipProdPending(id)
    return NextResponse.json({ pending })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

const postSchema = z.object({
  action: z.enum(["solicitar", "aprobar", "rechazar"]),
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
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "action requerida: solicitar | aprobar | rechazar" }, { status: 400 })
    }

    const email = ctx.auth.email

    if (parsed.data.action === "solicitar") {
      const pending = await solicitarAfipProduccion(id, email)
      return NextResponse.json({ pending })
    }

    const result = await aprobarAfipProduccion(id, email, {
      rechazar: parsed.data.action === "rechazar",
    })
    const pending = await getAfipProdPending(id)
    return NextResponse.json({ ...result, pending })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}