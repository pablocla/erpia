import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canManageUsers, isAdminRole } from "@/lib/auth/admin-roles"
import { prisma } from "@/lib/prisma"
import { loadEmpleadoByCodeScoped, EmpleadoSecurityError } from "@/lib/empleados-digitales/security"
import { pausarOReanudar } from "@/lib/empleados-digitales/activate"
import { usageResumenMes } from "@/lib/empleados-digitales/metering"
import { DEFAULT_LEO_CONFIG, type EmpleadoLeoCobranzaConfig } from "@/lib/empleados-digitales/types"
import { getTemplateByCode } from "@/lib/empleados-digitales/catalog/templates"

type Params = { params: Promise<{ code: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response
  const { code } = await params

  try {
    const emp = await loadEmpleadoByCodeScoped(ctx.auth.empresaId, code)
    const [usage, tareasPendientes, lastRuns] = await Promise.all([
      usageResumenMes(ctx.auth.empresaId, emp.id),
      prisma.empleadoDigitalTarea.count({
        where: {
          empresaId: ctx.auth.empresaId,
          empleadoDigitalId: emp.id,
          estado: "pendiente",
        },
      }),
      prisma.empleadoDigitalRun.findMany({
        where: { empresaId: ctx.auth.empresaId, empleadoDigitalId: emp.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          pathUsado: true,
          resumen: true,
          tokensIn: true,
          tokensOut: true,
          accionesCount: true,
          triggeredBy: true,
          createdAt: true,
          durationMs: true,
        },
      }),
    ])

    const config = {
      ...DEFAULT_LEO_CONFIG,
      ...(emp.config as object),
    }

    return NextResponse.json({
      success: true,
      empleado: {
        id: emp.id,
        code: emp.template.code,
        nombre: emp.nombre ?? emp.template.nombre,
        lema: emp.template.lema,
        estado: emp.estado,
        sku: emp.sku,
        cron: emp.cron ?? emp.template.cronDefault,
        config,
        lastRunAt: emp.lastRunAt,
        lastSuccessAt: emp.lastSuccessAt,
        runsTotal: emp.runsTotal,
        tokensMes: emp.tokensMes,
        accionesMes: emp.accionesMes,
        valorEstimadoArs: Number(emp.valorEstimadoArs),
        tareasPendientes,
        usage,
        lastRuns: lastRuns.map((r) => ({ ...r, id: String(r.id) })),
      },
      template: getTemplateByCode(code) ?? null,
    })
  } catch (err) {
    if (err instanceof EmpleadoSecurityError) {
      // No activado aún: devolver catalogo ready
      if (err.code === "EMPLEADO_NOT_FOUND") {
        const t = getTemplateByCode(code)
        return NextResponse.json({
          success: true,
          empleado: null,
          template: t ?? null,
          mensaje: "Empleado no activado en esta empresa",
        })
      }
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    throw err
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response
  if (!canManageUsers(ctx.auth.rol) && !isAdminRole(ctx.auth.rol)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const { code } = await params
  const body = await req.json()

  try {
    if (body.estado === "activo" || body.estado === "pausado") {
      const updated = await pausarOReanudar(ctx.auth.empresaId, code, body.estado)
      return NextResponse.json({ success: true, estado: updated.estado })
    }

    const emp = await loadEmpleadoByCodeScoped(ctx.auth.empresaId, code)
    const data: Record<string, unknown> = {}
    if (body.config && typeof body.config === "object") {
      const prev = (emp.config as object) || {}
      data.config = { ...prev, ...body.config } as EmpleadoLeoCobranzaConfig
    }
    if (typeof body.cron === "string") data.cron = body.cron
    if (typeof body.nombre === "string") data.nombre = body.nombre

    const updated = await prisma.empleadoDigital.update({
      where: { id: emp.id },
      data,
    })
    return NextResponse.json({ success: true, empleado: { id: updated.id, config: updated.config } })
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
