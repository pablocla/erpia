import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { loadEmpleadoByCodeScoped, EmpleadoSecurityError } from "@/lib/empleados-digitales/security"
import { actualizarEstadoTarea } from "@/lib/empleados-digitales/tools/actualizar-estado"
import { DEFAULT_LEO_CONFIG, type EmpleadoLeoCobranzaConfig } from "@/lib/empleados-digitales/types"

type Params = { params: Promise<{ code: string; id: string }> }

/**
 * PATCH — aprobar | rechazar | cancelar borrador WA
 * body: { accion: "aprobar" | "rechazar" | "cancelar", mensaje?: string }
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response
  const { code, id } = await params
  const body = await req.json()
  const accion = body.accion as string

  const map: Record<string, "aprobada" | "rechazada" | "cancelada"> = {
    aprobar: "aprobada",
    rechazar: "rechazada",
    cancelar: "cancelada",
  }
  const estado = map[accion]
  if (!estado) {
    return NextResponse.json(
      { error: "accion debe ser aprobar | rechazar | cancelar" },
      { status: 400 },
    )
  }

  try {
    const emp = await loadEmpleadoByCodeScoped(ctx.auth.empresaId, code)
    const config = {
      ...DEFAULT_LEO_CONFIG,
      ...(emp.config as object),
    } as EmpleadoLeoCobranzaConfig

    const tarea = await actualizarEstadoTarea(
      {
        empresaId: ctx.auth.empresaId,
        empleadoId: emp.id,
        runId: BigInt(0),
        userId: ctx.auth.userId,
      },
      config,
      {
        tareaId: BigInt(id),
        estado,
        mensajeEditado: typeof body.mensaje === "string" ? body.mensaje : undefined,
      },
    )

    return NextResponse.json({
      success: true,
      tarea: {
        id: String(tarea.id),
        estado: tarea.estado,
        mensaje: tarea.mensaje,
      },
    })
  } catch (err) {
    if (err instanceof EmpleadoSecurityError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 },
    )
  }
}
