import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET   /api/compras/recepciones/[id] — Full recepción detail with lines
 * PATCH /api/compras/recepciones/[id] — Verificar / rechazar
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const recepcion = await prisma.recepcionCompra.findFirst({
      where: {
        id: parseInt(id),
        ordenCompra: { empresaId: ctx.auth.empresaId },
      },
      include: {
        ordenCompra: {
          select: { id: true, numero: true, proveedor: { select: { id: true, nombre: true } } },
        },
        lineas: true,
      },
    })

    if (!recepcion) return NextResponse.json({ error: "Recepción no encontrada" }, { status: 404 })

    return NextResponse.json(recepcion)
  } catch (error) {
    console.error("Error al obtener recepción:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.recepcionCompra.findFirst({
      where: {
        id: parseInt(id),
        ordenCompra: { empresaId: ctx.auth.empresaId },
      },
    })
    if (!existing) return NextResponse.json({ error: "Recepción no encontrada" }, { status: 404 })

    if (!["verificada", "rechazada"].includes(body.estado)) {
      return NextResponse.json({ error: "Estado inválido (verificada|rechazada)" }, { status: 400 })
    }

    const recepcion = await prisma.recepcionCompra.update({
      where: { id: existing.id },
      data: {
        estado: body.estado,
        ...(body.observaciones !== undefined && { observaciones: body.observaciones }),
      },
    })

    return NextResponse.json(recepcion)
  } catch (error) {
    console.error("Error al actualizar recepción:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
