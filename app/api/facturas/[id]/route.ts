import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET  /api/facturas/[id] — Full invoice detail with lines, NC, remitos, CC
 * PATCH /api/facturas/[id] — Update observaciones or mark as anulada
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const factura = await prisma.factura.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
      include: {
        lineas: { orderBy: { id: "asc" } },
        cliente: true,
        vendedor: { select: { id: true, nombre: true } },
        condicionPago: true,
        notasCredito: {
          select: { id: true, tipo: true, numero: true, puntoVenta: true, total: true, estado: true, motivo: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
        remitos: {
          select: { id: true, numero: true, estado: true, createdAt: true },
        },
        cuentasCobrar: {
          select: { id: true, numeroCuota: true, montoOriginal: true, saldo: true, estado: true, fechaVencimiento: true },
          orderBy: { numeroCuota: "asc" },
        },
        tributos: true,
      },
    })

    if (!factura) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    // Compute totals
    const totalNC = factura.notasCredito
      .filter((nc) => nc.estado !== "anulada")
      .reduce((s, nc) => s + Number(nc.total), 0)
    const saldoPendienteCC = factura.cuentasCobrar
      .reduce((s, cc) => s + Number(cc.saldo), 0)

    return NextResponse.json({
      ...factura,
      resumen: {
        totalNC: Math.round(totalNC * 100) / 100,
        saldoPendienteCC: Math.round(saldoPendienteCC * 100) / 100,
        netoCobrado: Math.round((Number(factura.total) - totalNC - saldoPendienteCC) * 100) / 100,
      },
    })
  } catch (error) {
    console.error("Error al obtener factura:", error)
    return NextResponse.json({ error: "Error al obtener factura" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.factura.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: parseInt(id) }),
    })
    if (!existing) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    // Only allow updating observaciones on emitted invoices
    // AFIP invoices cannot be deleted — must issue NC to cancel
    const data: Record<string, unknown> = { updatedBy: ctx.auth.userId }

    if (body.observaciones !== undefined) {
      data.observaciones = body.observaciones
    }

    const factura = await prisma.factura.update({
      where: { id: existing.id },
      data,
    })

    return NextResponse.json(factura)
  } catch (error) {
    console.error("Error al actualizar factura:", error)
    return NextResponse.json({ error: "Error al actualizar factura" }, { status: 500 })
  }
}
