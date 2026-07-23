import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { computeTenantHealthScore } from "@/lib/empleados-digitales/health-score"

/** GET /api/empleados-digitales/health — score adopción Leo/negocio (PV-02) */
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  try {
    const health = await computeTenantHealthScore(ctx.auth.empresaId)
    return NextResponse.json({ success: true, health })
  } catch (err) {
    console.error("[empleados health]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 },
    )
  }
}
