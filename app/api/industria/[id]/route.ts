import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const id = parseInt((await params).id)
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const body = await request.json()
    const { estado, cantidadProd, fechaInicio, fechaFinReal, observaciones } = body

    // ── TENANT ISOLATION ──
    const existente = await prisma.ordenProduccion.findFirst({
      where: { id, empresaId: ctx.auth.empresaId },
      select: { id: true },
    })
    if (!existente) return NextResponse.json({ error: "Orden de producción no encontrada" }, { status: 404 })

    const orden = await prisma.ordenProduccion.update({
      where: { id: existente.id },
      data: {
        ...(estado && { estado }),
        ...(cantidadProd !== undefined && { cantidadProd }),
        ...(fechaInicio !== undefined && { fechaInicio: fechaInicio ? new Date(fechaInicio) : null }),
        ...(fechaFinReal !== undefined && { fechaFinReal: fechaFinReal ? new Date(fechaFinReal) : null }),
        ...(observaciones !== undefined && { observaciones }),
      },
      include: {
        bom: { select: { id: true, nombre: true, codigo: true } },
        producto: { select: { id: true, nombre: true, codigo: true } },
      },
    })

    return NextResponse.json(orden)
  } catch (error) {
    console.error("Error al actualizar orden de producción:", error)
    return NextResponse.json({ error: "Error al actualizar orden de producción" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const id = parseInt((await params).id)
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    // ── TENANT ISOLATION ──
    const existente = await prisma.ordenProduccion.findFirst({
      where: { id, empresaId: ctx.auth.empresaId },
      select: { id: true },
    })
    if (!existente) return NextResponse.json({ error: "Orden de producción no encontrada" }, { status: 404 })

    await prisma.ordenProduccion.update({ where: { id: existente.id }, data: { estado: "anulada" } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al anular orden de producción:", error)
    return NextResponse.json({ error: "Error al anular orden de producción" }, { status: 500 })
  }
}
