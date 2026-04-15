import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET    /api/categorias/[id] — Category detail with product count
 * PATCH  /api/categorias/[id] — Update category
 * DELETE /api/categorias/[id] — Delete category (only if no products)
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const cat = await prisma.categoria.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
      include: { _count: { select: { productos: true } } },
    })

    if (!cat) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 })
    return NextResponse.json(cat)
  } catch (error) {
    console.error("Error al obtener categoría:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.categoria.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
    })
    if (!existing) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 })

    const cat = await prisma.categoria.update({
      where: { id: existing.id },
      data: {
        ...(body.nombre !== undefined && { nombre: body.nombre }),
        ...(body.descripcion !== undefined && { descripcion: body.descripcion }),
      },
    })

    return NextResponse.json(cat)
  } catch (error) {
    console.error("Error al actualizar categoría:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const cat = await prisma.categoria.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
      include: { _count: { select: { productos: true } } },
    })
    if (!cat) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 })

    if (cat._count.productos > 0) {
      return NextResponse.json({
        error: `No se puede eliminar: la categoría tiene ${cat._count.productos} producto(s) asociados`,
      }, { status: 400 })
    }

    await prisma.categoria.delete({ where: { id: cat.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar categoría:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
