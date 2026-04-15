import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET   /api/compras/ordenes/[id] — Full OC detail with lines, recepciones
 * PATCH /api/compras/ordenes/[id] — Update estado / observaciones
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const oc = await prisma.ordenCompra.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
      include: {
        proveedor: { select: { id: true, nombre: true, cuit: true } },
        condicionPago: true,
        lineas: {
          include: { producto: { select: { id: true, nombre: true, sku: true } } },
          orderBy: { orden: "asc" },
        },
        recepciones: {
          select: { id: true, numero: true, fecha: true, estado: true },
          orderBy: { fecha: "desc" },
        },
        compras: {
          select: { id: true, tipo: true, numero: true, total: true },
        },
      },
    })

    if (!oc) return NextResponse.json({ error: "Orden de compra no encontrada" }, { status: 404 })

    // Compute reception progress
    const lineasProgress = oc.lineas.map((l) => ({
      ...l,
      pendiente: Number(l.cantidad) - Number(l.cantidadRecibida),
    }))

    return NextResponse.json({ ...oc, lineas: lineasProgress })
  } catch (error) {
    console.error("Error al obtener OC:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.ordenCompra.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
    })
    if (!existing) return NextResponse.json({ error: "OC no encontrada" }, { status: 404 })

    const TRANSITIONS: Record<string, string[]> = {
      borrador: ["aprobada", "anulada"],
      aprobada: ["enviada", "anulada"],
      enviada: ["parcial", "recibida", "anulada"],
      parcial: ["recibida"],
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
    if (body.fechaEntregaEst !== undefined) data.fechaEntregaEst = new Date(body.fechaEntregaEst)

    const oc = await prisma.ordenCompra.update({
      where: { id: existing.id },
      data,
    })

    return NextResponse.json(oc)
  } catch (error) {
    console.error("Error al actualizar OC:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
