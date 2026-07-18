import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { getOpsOverview } from "@/lib/ops/ops-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId: raw } = await params
    const empresaId = Number(raw)
    if (!empresaId) return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })

    const ctx = await getClaverAnalystEmpresaContext(request, empresaId)
    if (!ctx.ok) return ctx.response

    const overview = await getOpsOverview(empresaId)
    return NextResponse.json({ ...overview, empresaId })
  } catch (error) {
    console.error("Error ops cliente analista:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}