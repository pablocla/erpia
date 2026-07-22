import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canManageUsers, isAdminRole } from "@/lib/auth/admin-roles"
import { runLeoCobranza } from "@/lib/empleados-digitales/runtime/orchestrator"
import { LEO_COBRANZA_CODE } from "@/lib/empleados-digitales/types"
import { EmpleadoSecurityError } from "@/lib/empleados-digitales/security"

type Params = { params: Promise<{ code: string }> }

/** POST /api/empleados-digitales/leo_cobranza/run — corrida manual */
export async function POST(req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response
  if (!canManageUsers(ctx.auth.rol) && !isAdminRole(ctx.auth.rol)) {
    return NextResponse.json({ error: "Sin permiso para ejecutar" }, { status: 403 })
  }

  const { code } = await params
  if (code !== LEO_COBRANZA_CODE) {
    return NextResponse.json({ error: "Solo Leo Cobranza soporta run por ahora" }, { status: 400 })
  }

  try {
    const result = await runLeoCobranza({
      empresaId: ctx.auth.empresaId,
      trigger: "manual",
      userId: ctx.auth.userId,
    })
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    if (err instanceof EmpleadoSecurityError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    console.error("[Leo] run error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error en corrida" },
      { status: 500 },
    )
  }
}
