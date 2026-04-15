import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const id = parseInt((await params).id)
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const body = await request.json()
    const { estado, fechaEmbarque, fechaEntrega, transportistaId, pesoKg, bultos, observaciones } = body

    const existente = await prisma.envio.findFirst({
      where: { id, empresaId: ctx.auth.empresaId },
      select: { id: true },
    })
    if (!existente) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })

    const envio = await prisma.envio.update({
      where: { id },
      data: {
        ...(estado && { estado }),
        ...(fechaEmbarque !== undefined && { fechaEmbarque: fechaEmbarque ? new Date(fechaEmbarque) : null }),
        ...(fechaEntrega !== undefined && { fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null }),
        ...(transportistaId !== undefined && { transportistaId }),
        ...(pesoKg !== undefined && { pesoKg }),
        ...(bultos !== undefined && { bultos }),
        ...(observaciones !== undefined && { observaciones }),
      },
      include: { transportista: true, remito: { select: { id: true, numero: true } } },
    })

    return NextResponse.json(envio)
  } catch (error) {
    console.error("Error al actualizar envío:", error)
    logError("api/logistica/[id]:PATCH", error, request)
    return NextResponse.json({ error: "Error al actualizar envío" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const id = parseInt((await params).id)
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const existente = await prisma.envio.findFirst({
      where: { id, empresaId: ctx.auth.empresaId },
      select: { id: true },
    })
    if (!existente) return NextResponse.json({ error: "Envío no encontrado" }, { status: 404 })

    await prisma.envio.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar envío:", error)
    logError("api/logistica/[id]:DELETE", error, request)
    return NextResponse.json({ error: "Error al eliminar envío" }, { status: 500 })
  }
}
