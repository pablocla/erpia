import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { loadEmpleadoByCodeScoped, EmpleadoSecurityError } from "@/lib/empleados-digitales/security"
import { actualizarEstadoTarea } from "@/lib/empleados-digitales/tools/actualizar-estado"
import { DEFAULT_LEO_CONFIG, type EmpleadoLeoCobranzaConfig } from "@/lib/empleados-digitales/types"

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

/**
 * POST bulk — ED-14
 * body: { accion: "aprobar" | "rechazar", ids: string[], max?: number }
 */
export async function POST(req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response
  const { code } = await params

  let body: { accion?: string; ids?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const accion = body.accion
  const map: Record<string, "aprobada" | "rechazada"> = {
    aprobar: "aprobada",
    rechazar: "rechazada",
  }
  const estado = accion ? map[accion] : undefined
  if (!estado) {
    return NextResponse.json({ error: "accion debe ser aprobar | rechazar" }, { status: 400 })
  }

  const ids = (body.ids ?? []).slice(0, 20)
  if (!ids.length) {
    return NextResponse.json({ error: "ids requerido (máx 20)" }, { status: 400 })
  }

  try {
    const emp = await loadEmpleadoByCodeScoped(ctx.auth.empresaId, code)
    const config = {
      ...DEFAULT_LEO_CONFIG,
      ...(emp.config as object),
    } as EmpleadoLeoCobranzaConfig

    const resultados: Array<{ id: string; success: boolean; error?: string }> = []

    for (const id of ids) {
      try {
        await actualizarEstadoTarea(
          {
            empresaId: ctx.auth.empresaId,
            empleadoId: emp.id,
            runId: BigInt(0),
            userId: ctx.auth.userId,
          },
          config,
          { tareaId: BigInt(id), estado },
        )
        resultados.push({ id, success: true })
      } catch (e) {
        resultados.push({
          id,
          success: false,
          error: e instanceof Error ? e.message : "Error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      ok: resultados.filter((r) => r.success).length,
      fail: resultados.filter((r) => !r.success).length,
      resultados,
    })
  } catch (err) {
    if (err instanceof EmpleadoSecurityError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 },
    )
  }
}
