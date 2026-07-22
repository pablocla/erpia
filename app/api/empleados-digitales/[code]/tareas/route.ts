import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { loadEmpleadoByCodeScoped, EmpleadoSecurityError } from "@/lib/empleados-digitales/security"

type Params = { params: Promise<{ code: string }> }

/** GET /api/empleados-digitales/leo_cobranza/tareas?estado=pendiente */
export async function GET(req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response
  const { code } = await params
  const estado = req.nextUrl.searchParams.get("estado") || undefined

  try {
    const emp = await loadEmpleadoByCodeScoped(ctx.auth.empresaId, code)
    const tareas = await prisma.empleadoDigitalTarea.findMany({
      where: {
        empresaId: ctx.auth.empresaId,
        empleadoDigitalId: emp.id,
        ...(estado ? { estado } : {}),
      },
      orderBy: [{ prioridad: "desc" }, { createdAt: "desc" }],
      take: 100,
    })

    return NextResponse.json({
      success: true,
      tareas: tareas.map((t) => ({
        id: String(t.id),
        tipo: t.tipo,
        estado: t.estado,
        prioridad: t.prioridad,
        clienteId: t.clienteId,
        montoArs: t.montoArs != null ? Number(t.montoArs) : null,
        diasVencido: t.diasVencido,
        telefono: t.telefono,
        mensaje: t.mensaje,
        origenMensaje: t.origenMensaje,
        mensajeWaId: t.mensajeWaId,
        createdAt: t.createdAt,
        aprobadoAt: t.aprobadoAt,
      })),
    })
  } catch (err) {
    if (err instanceof EmpleadoSecurityError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
