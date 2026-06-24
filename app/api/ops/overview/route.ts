import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canAccessClientOps } from "@/lib/auth/claver-analyst"
import { getOpsOverview } from "@/lib/ops/ops-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!canAccessClientOps(ctx.auth.rol)) {
      return NextResponse.json({ error: "Sin permisos para operaciones" }, { status: 403 })
    }

    const overview = await getOpsOverview(ctx.auth.empresaId)
    return NextResponse.json(overview)
  } catch (error) {
    console.error("Error ops overview:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}