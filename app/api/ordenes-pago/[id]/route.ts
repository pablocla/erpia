import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/ordenes-pago/[id] — Get payment order detail
 * DELETE /api/ordenes-pago/[id] — Anular orden de pago
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const op = await prisma.ordenPago.findFirst({
      where: {
        id: Number(id),
        proveedor: { empresaId: ctx.auth.empresaId },
      },
      include: {
        proveedor: { select: { id: true, nombre: true, cuit: true } },
        items: {
          include: {
            cuentaPagar: { select: { id: true, concepto: true, montoOriginal: true } },
          },
        },
        retencionesSICORE: true,
      },
    })

    if (!op) return NextResponse.json({ error: "Orden de pago no encontrada" }, { status: 404 })

    return NextResponse.json({
      ...op,
      montoTotal: Number(op.montoTotal),
      totalRetenciones: Number(op.totalRetenciones),
      netoPagado: Number(op.netoPagado),
      retencionIVA: Number(op.retencionIVA),
      retencionGanancias: Number(op.retencionGanancias),
      retencionIIBB: Number(op.retencionIIBB),
    })
  } catch (error) {
    console.error("Error al obtener orden de pago:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const op = await prisma.ordenPago.findFirst({
      where: {
        id: Number(id),
        proveedor: { empresaId: ctx.auth.empresaId },
      },
      include: { items: true },
    })

    if (!op) return NextResponse.json({ error: "Orden de pago no encontrada" }, { status: 404 })
    if (op.anulada) return NextResponse.json({ error: "Orden ya anulada" }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      // Revert each CP balance
      for (const item of op.items) {
        const cp = await tx.cuentaPagar.findUnique({ where: { id: item.cuentaPagarId } })
        if (!cp) continue
        const nuevoSaldo = Number(cp.saldo) + Number(item.montoPagado)
        const nuevoPagado = Math.max(0, Number(cp.montoPagado) - Number(item.montoPagado))
        await tx.cuentaPagar.update({
          where: { id: cp.id },
          data: {
            saldo: nuevoSaldo,
            montoPagado: nuevoPagado,
            estado: nuevoSaldo >= Number(cp.montoOriginal) ? "pendiente" : "parcial",
          },
        })
      }

      // Anular SICORE retentions linked to this OP
      await tx.retencionSICORE.updateMany({
        where: { ordenPagoId: op.id },
        data: { anulada: true },
      })

      await tx.ordenPago.update({
        where: { id: op.id },
        data: { anulada: true },
      })
    })

    return NextResponse.json({ success: true, mensaje: "Orden de pago anulada correctamente" })
  } catch (error) {
    console.error("Error al anular orden de pago:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
