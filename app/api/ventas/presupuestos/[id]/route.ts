import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET   /api/ventas/presupuestos/[id] — Full presupuesto detail
 * PATCH /api/ventas/presupuestos/[id] — Update estado / observaciones
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const presupuesto = await prisma.presupuesto.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
      include: {
        cliente: { select: { id: true, nombre: true, cuit: true } },
        vendedor: { select: { id: true, nombre: true } },
        condicionPago: true,
        listaPrecio: { select: { id: true, nombre: true } },
        lineas: {
          include: { producto: { select: { id: true, nombre: true, sku: true } } },
          orderBy: { orden: "asc" },
        },
      },
    })

    if (!presupuesto) return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 })

    return NextResponse.json(presupuesto)
  } catch (error) {
    console.error("Error al obtener presupuesto:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.presupuesto.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
    })
    if (!existing) return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 })

    const TRANSITIONS: Record<string, string[]> = {
      borrador: ["enviado", "aceptado", "rechazado"],
      enviado: ["aceptado", "rechazado", "vencido"],
      aceptado: ["facturado"],
      rechazado: [],
      vencido: [],
    }

    const data: Record<string, unknown> = {}

    if (body.estado) {
      const allowed = TRANSITIONS[existing.estado] ?? []
      if (!allowed.includes(body.estado)) {
        return NextResponse.json({
          error: `Transición no permitida: ${existing.estado} → ${body.estado}`,
        }, { status: 400 })
      }
      data.estado = body.estado
    }

    if (body.observaciones !== undefined) data.observaciones = body.observaciones
    if (body.fechaVencimiento !== undefined) data.fechaVencimiento = new Date(body.fechaVencimiento)

    const presupuesto = await prisma.presupuesto.update({
      where: { id: existing.id },
      data,
    })

    return NextResponse.json(presupuesto)
  } catch (error) {
    console.error("Error al actualizar presupuesto:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
