import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cobrosService } from "@/lib/cobros/cobros-service"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/recibos/[id] — Get receipt detail
 * DELETE /api/recibos/[id] — Anular recibo
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const recibo = await prisma.recibo.findFirst({
      where: {
        id: Number(id),
        cliente: { empresaId: ctx.auth.empresaId },
      },
      include: {
        cliente: { select: { id: true, nombre: true, cuit: true } },
        items: {
          include: {
            cuentaCobrar: { select: { id: true, concepto: true, montoOriginal: true } },
          },
        },
        retenciones: true,
      },
    })

    if (!recibo) return NextResponse.json({ error: "Recibo no encontrado" }, { status: 404 })

    return NextResponse.json({
      ...recibo,
      montoTotal: Number(recibo.montoTotal),
      totalRetenciones: Number(recibo.totalRetenciones),
      netoRecibido: Number(recibo.netoRecibido),
      retencionIVA: Number(recibo.retencionIVA),
      retencionGanancias: Number(recibo.retencionGanancias),
      retencionIIBB: Number(recibo.retencionIIBB),
    })
  } catch (error) {
    console.error("Error al obtener recibo:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const recibo = await prisma.recibo.findFirst({
      where: {
        id: Number(id),
        cliente: { empresaId: ctx.auth.empresaId },
      },
      include: { items: true },
    })

    if (!recibo) return NextResponse.json({ error: "Recibo no encontrado" }, { status: 404 })
    if (recibo.anulado) return NextResponse.json({ error: "Recibo ya anulado" }, { status: 400 })

    // Reverse CC impacts in a transaction
    await prisma.$transaction(async (tx) => {
      // Revert each CC balance
      for (const item of recibo.items) {
        const cc = await tx.cuentaCobrar.findUnique({ where: { id: item.cuentaCobrarId } })
        if (!cc) continue
        const nuevoSaldo = Number(cc.saldo) + Number(item.montoPagado)
        const nuevoPagado = Math.max(0, Number(cc.montoPagado) - Number(item.montoPagado))
        await tx.cuentaCobrar.update({
          where: { id: cc.id },
          data: {
            saldo: nuevoSaldo,
            montoPagado: nuevoPagado,
            estado: nuevoSaldo >= Number(cc.montoOriginal) ? "pendiente" : "parcial",
          },
        })
      }

      // Mark recibo as anulado
      await tx.recibo.update({
        where: { id: recibo.id },
        data: { anulado: true },
      })
    })

    return NextResponse.json({ success: true, mensaje: "Recibo anulado correctamente" })
  } catch (error) {
    console.error("Error al anular recibo:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
