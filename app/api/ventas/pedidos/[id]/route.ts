import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET   /api/ventas/pedidos/[id] — Full pedido detail
 * PATCH /api/ventas/pedidos/[id] — Update estado / observaciones
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const pedido = await prisma.pedidoVenta.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
      include: {
        cliente: { select: { id: true, nombre: true, cuit: true } },
        vendedor: { select: { id: true, nombre: true } },
        condicionPago: true,
        lineas: {
          include: { producto: { select: { id: true, nombre: true, sku: true } } },
          orderBy: { orden: "asc" },
        },
        remitos: { select: { id: true, numero: true, estado: true, createdAt: true } },
        listasPicking: { select: { id: true, estado: true, createdAt: true } },
      },
    })

    if (!pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })

    return NextResponse.json(pedido)
  } catch (error) {
    console.error("Error al obtener pedido:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.pedidoVenta.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
    })
    if (!existing) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })

    const TRANSITIONS: Record<string, string[]> = {
      borrador: ["confirmado", "anulado"],
      confirmado: ["en_picking", "anulado"],
      en_picking: ["remitido"],
      remitido: ["facturado"],
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

    const pedido = await prisma.pedidoVenta.update({
      where: { id: existing.id },
      data,
    })

    return NextResponse.json(pedido)
  } catch (error) {
    console.error("Error al actualizar pedido:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
