import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { eventBus } from "@/lib/events/event-bus"

const updateSchema = z.object({
  estado: z.enum(["pendiente", "entregado", "anulado"]).optional(),
  observaciones: z.string().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const remitoId = Number(id)
    if (!remitoId) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const remito = await prisma.remito.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: remitoId }),
      include: {
        cliente: { select: { id: true, nombre: true, cuit: true } },
        factura: { select: { id: true, tipo: true, numero: true, puntoVenta: true, total: true } },
        incoterm: true,
        lineas: true,
      },
    })

    if (!remito) return NextResponse.json({ error: "Remito no encontrado" }, { status: 404 })
    return NextResponse.json(remito)
  } catch (error) {
    console.error("Error al obtener remito:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const remitoId = Number(id)
    if (!remitoId) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const body = await request.json()
    const validacion = updateSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const remito = await prisma.remito.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: remitoId }),
      include: { lineas: true },
    })
    if (!remito) return NextResponse.json({ error: "Remito no encontrado" }, { status: 404 })

    const updated = await prisma.remito.update({
      where: { id: remitoId },
      data: validacion.data,
    })

    // Emit event when marked as delivered
    if (validacion.data.estado === "entregado" && remito.estado !== "entregado") {
      await eventBus.emit({
        type: "REMITO_EMITIDO",
        payload: {
          remitoId: remito.id,
          clienteId: remito.clienteId,
          facturaId: remito.facturaId,
          lineas: remito.lineas.length,
        },
        timestamp: new Date(),
      })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Remito no encontrado" }, { status: 404 })
    console.error("Error al actualizar remito:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
