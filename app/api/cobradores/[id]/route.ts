import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET    /api/cobradores/[id] — Cobrador detail
 * PATCH  /api/cobradores/[id] — Update cobrador
 * DELETE /api/cobradores/[id] — Soft-delete cobrador
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const cobrador = await prisma.cobrador.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
      include: {
        _count: { select: { recibos: true } },
      },
    })

    if (!cobrador) return NextResponse.json({ error: "Cobrador no encontrado" }, { status: 404 })
    return NextResponse.json(cobrador)
  } catch (error) {
    console.error("Error al obtener cobrador:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.cobrador.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
    })
    if (!existing) return NextResponse.json({ error: "Cobrador no encontrado" }, { status: 404 })

    const data: Record<string, unknown> = {}
    if (body.nombre !== undefined) data.nombre = body.nombre
    if (body.email !== undefined) data.email = body.email
    if (body.telefono !== undefined) data.telefono = body.telefono
    if (body.zona !== undefined) data.zona = body.zona
    if (body.activo !== undefined) data.activo = body.activo

    const cobrador = await prisma.cobrador.update({
      where: { id: existing.id },
      data,
    })

    return NextResponse.json(cobrador)
  } catch (error) {
    console.error("Error al actualizar cobrador:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const existing = await prisma.cobrador.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
    })
    if (!existing) return NextResponse.json({ error: "Cobrador no encontrado" }, { status: 404 })

    await prisma.cobrador.update({
      where: { id: existing.id },
      data: { activo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar cobrador:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
