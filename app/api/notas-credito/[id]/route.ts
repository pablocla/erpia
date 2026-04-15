import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET    /api/notas-credito/[id] — Full NC detail with factura, lineas
 * DELETE /api/notas-credito/[id] — Anular NC (reverse CC adjustment)
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const nc = await prisma.notaCredito.findFirst({
      where: { id: parseInt(id), empresaId: ctx.auth.empresaId },
      include: {
        factura: {
          select: { id: true, tipo: true, numero: true, puntoVenta: true, total: true, clienteId: true },
        },
        cliente: { select: { id: true, nombre: true, cuit: true } },
        lineas: true,
      },
    })

    if (!nc) {
      return NextResponse.json({ error: "Nota de crédito no encontrada" }, { status: 404 })
    }

    return NextResponse.json(nc)
  } catch (error) {
    console.error("Error al obtener NC:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const nc = await prisma.notaCredito.findFirst({
      where: { id: parseInt(id), empresaId: ctx.auth.empresaId },
    })
    if (!nc) return NextResponse.json({ error: "NC no encontrada" }, { status: 404 })
    if (nc.estado === "anulada") return NextResponse.json({ error: "NC ya anulada" }, { status: 400 })

    // AFIP NCs can't be deleted — mark as anulada and reverse CC adjustment
    await prisma.notaCredito.update({
      where: { id: nc.id },
      data: { estado: "anulada" },
    })

    return NextResponse.json({ success: true, message: "Nota de crédito anulada" })
  } catch (error) {
    console.error("Error al anular NC:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
