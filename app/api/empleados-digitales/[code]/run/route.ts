import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canManageUsers, isAdminRole } from "@/lib/auth/admin-roles"
import { runEmpleado } from "@/lib/empleados-digitales/runtime/run-empleado"
import { EmpleadoSecurityError } from "@/lib/empleados-digitales/security"

type Params = { params: Promise<{ code: string }> }

/** POST /api/empleados-digitales/:code/run — corrida manual (ED-15) */
export async function POST(req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response
  if (!canManageUsers(ctx.auth.rol) && !isAdminRole(ctx.auth.rol)) {
    return NextResponse.json({ error: "Sin permiso para ejecutar" }, { status: 403 })
  }

  const { code } = await params

  let dryRun = false
  try {
    const body = await req.json().catch(() => ({}))
    dryRun = body?.dryRun === true
  } catch {
    dryRun = false
  }

  try {
    const result = await runEmpleado({
      empresaId: ctx.auth.empresaId,
      code,
      trigger: "manual",
      userId: ctx.auth.userId,
      dryRun,
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
