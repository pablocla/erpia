import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/stock/[id] — Get product stock detail
 * PATCH /api/stock/[id] — Update product stock params (stockMinimo, etc.)
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const producto = await prisma.producto.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: Number(id) }),
      include: {
        categoria: { select: { id: true, nombre: true } },
        marca: { select: { id: true, nombre: true } },
        stockDepositos: { include: { deposito: { select: { id: true, nombre: true } } } },
        lotes: { where: { cantidadActual: { gt: 0 } }, orderBy: { fechaVencimiento: "asc" } },
      },
    })

    if (!producto) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })

    // Recent movements
    const movimientos = await prisma.movimientoStock.findMany({
      where: { productoId: Number(id) },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({ ...producto, movimientos })
  } catch (error) {
    console.error("Error al obtener stock:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const existing = await prisma.producto.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: Number(id) }),
    })
    if (!existing) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })

    const body = await request.json()
    const allowedFields = ["stockMinimo", "stockMaximo", "ubicacionDeposito", "controlaStock", "usaLotes"]
    const data: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field]
    }

    const updated = await prisma.producto.update({ where: { id: existing.id }, data })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error al actualizar stock:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
