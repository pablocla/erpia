import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET    /api/vendedores/[id] — Vendedor detail with comisiones + totals
 * PATCH  /api/vendedores/[id] — Update vendedor data
 * DELETE /api/vendedores/[id] — Soft-delete vendedor
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const vendedorId = parseInt(id)
    if (isNaN(vendedorId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    // ── TENANT ISOLATION ──
    const vendedor = await (prisma as any).vendedor.findFirst({
      where: { id: vendedorId, usuario: { empresaId: ctx.auth.empresaId } },
      include: {
        _count: { select: { facturas: true } },
      },
    })

    if (!vendedor) return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 })
    return NextResponse.json(vendedor)
  } catch (error) {
    console.error("Error al obtener vendedor:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const vendedorId = parseInt(id)
    if (isNaN(vendedorId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    // ── TENANT ISOLATION ──
    const existing = await (prisma as any).vendedor.findFirst({
      where: { id: vendedorId, usuario: { empresaId: ctx.auth.empresaId } },
    })
    if (!existing) return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 })

    const body = await request.json()
    const updatable = ["nombre", "email", "telefono", "comisionPct", "activo"]
    const data: Record<string, unknown> = {}
    for (const key of updatable) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    const vendedor = await prisma.vendedor.update({
      where: { id: existing.id },
      data,
    })

    return NextResponse.json(vendedor)
  } catch (error) {
    console.error("Error al actualizar vendedor:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const vendedorId = parseInt(id)
    if (isNaN(vendedorId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    // ── TENANT ISOLATION ──
    const existing = await (prisma as any).vendedor.findFirst({
      where: { id: vendedorId, usuario: { empresaId: ctx.auth.empresaId } },
    })
    if (!existing) return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 })

    await prisma.vendedor.update({
      where: { id: existing.id },
      data: { activo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar vendedor:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
