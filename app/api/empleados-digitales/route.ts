import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canManageUsers, isAdminRole } from "@/lib/auth/admin-roles"
import { prisma } from "@/lib/prisma"
import { EMPLEADO_TEMPLATES } from "@/lib/empleados-digitales/catalog/templates"
import { activarLeoCobranza } from "@/lib/empleados-digitales/activate"
import { LEO_COBRANZA_CODE, LEO_COBRANZA_SKU } from "@/lib/empleados-digitales/types"
import { activarProducto } from "@/lib/platform/product-lifecycle"

/**
 * GET  /api/empleados-digitales — catálogo + instancias de la empresa
 * POST /api/empleados-digitales — activar { code: "leo_cobranza" }
 */
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  const instancias = await prisma.empleadoDigital.findMany({
    where: { empresaId: ctx.auth.empresaId },
    include: {
      template: { select: { code: true, nombre: true, lema: true, icono: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    success: true,
    catalogo: EMPLEADO_TEMPLATES.map((t) => ({
      code: t.code,
      nombre: t.nombre,
      lema: t.lema,
      descripcion: t.descripcion,
      sku: t.sku,
      precioArs: t.precioArs,
      dashboardPath: t.dashboardPath,
      dependeDe: t.dependeDe,
    })),
    instancias: instancias.map((i) => ({
      id: i.id,
      code: i.template.code,
      nombre: i.nombre ?? i.template.nombre,
      lema: i.template.lema,
      estado: i.estado,
      sku: i.sku,
      lastRunAt: i.lastRunAt,
      runsTotal: i.runsTotal,
      tokensMes: i.tokensMes,
      accionesMes: i.accionesMes,
      dashboardPath: `/dashboard/empleados-digitales/${i.template.code}`,
    })),
  })
}

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  if (!canManageUsers(ctx.auth.rol) && !isAdminRole(ctx.auth.rol)) {
    return NextResponse.json({ error: "Solo administradores pueden activar empleados" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const code = (body.code as string) || LEO_COBRANZA_CODE
  if (code !== LEO_COBRANZA_CODE) {
    return NextResponse.json({ error: "Empleado no soportado aún" }, { status: 400 })
  }

  try {
    // Suscripción + hooks (si SKU está en registry; si falla, activamos instancia igual)
    try {
      await activarProducto(ctx.auth.empresaId, LEO_COBRANZA_SKU, body.origen || "manual")
    } catch {
      // SKU puede no estar en product-registry aún — activamos instancia directa
      await activarLeoCobranza(ctx.auth.empresaId, { trial: body.trial === true })
    }

    // Asegurar instancia aunque el hook no haya corrido
    const instancia = await activarLeoCobranza(ctx.auth.empresaId, {
      trial: body.trial === true,
    })

    return NextResponse.json({
      success: true,
      instancia: {
        id: instancia.id,
        code: instancia.template.code,
        estado: instancia.estado,
        sku: instancia.sku,
        dashboardPath: `/dashboard/empleados-digitales/${instancia.template.code}`,
      },
    })
  } catch (err) {
    console.error("[empleados-digitales] activate:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al activar" },
      { status: 500 },
    )
  }
}
