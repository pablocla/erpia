import { type NextRequest, NextResponse } from "next/server"
import {
  getClaverAnalystContext,
  canAnalystAccessEmpresa,
} from "@/lib/auth/claver-analyst"
import { getEmpresaReadiness } from "@/lib/ops/readiness-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { empresaId } = await params
    const id = Number(empresaId)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
    }

    const allowed = await canAnalystAccessEmpresa(ctx.auth.email, id)
    if (!allowed) {
      return NextResponse.json({ error: "No tenés asignado este cliente" }, { status: 403 })
    }

    const readiness = await getEmpresaReadiness(id)
    return NextResponse.json(readiness)
  } catch (error) {
    console.error("Error readiness:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}