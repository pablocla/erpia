import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { getTenantOverview } from "@/lib/ops/tenant-admin-service"
import { ejecutarAccionLifecycle } from "@/lib/ops/tenant-lifecycle-service"

const LIFECYCLE_ACTIONS = ["suspend", "reactivate"] as const

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

export async function PATCH(
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
    const action = body.action as (typeof LIFECYCLE_ACTIONS)[number]
    if (!LIFECYCLE_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
    }

    const result = await ejecutarAccionLifecycle(id, action, ctx.auth.email)
    const overview = await getTenantOverview(id)
    return NextResponse.json({ ...result, overview })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}