import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { getTenantOverview } from "@/lib/ops/tenant-admin-service"

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

    const overview = await getTenantOverview(id)
    return NextResponse.json(overview)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    const status = msg.includes("no encontrada") ? 404 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}