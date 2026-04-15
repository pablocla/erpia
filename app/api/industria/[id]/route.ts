import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarToken } from "@/lib/auth/middleware"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const id = parseInt((await params).id)
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const body = await request.json()
    const { estado, cantidadProd, fechaInicio, fechaFinReal, observaciones } = body

    const orden = await prisma.ordenProduccion.update({
      where: { id },
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
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const id = parseInt((await params).id)
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    await prisma.ordenProduccion.update({ where: { id }, data: { estado: "anulada" } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al anular orden de producción:", error)
    return NextResponse.json({ error: "Error al anular orden de producción" }, { status: 500 })
  }
}
