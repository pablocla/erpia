import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/caja/[id] — Get cash register detail with movements
 * PATCH /api/caja/[id] — Close cash register with arqueo
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const caja = await prisma.caja.findFirst({
      where: { id: Number(id), empresaId: ctx.auth.empresaId },
      include: {
        movimientos: { orderBy: { createdAt: "desc" } },
      },
    })

    if (!caja) return NextResponse.json({ error: "Caja no encontrada" }, { status: 404 })

    // Compute live totals
    const ingresos = caja.movimientos
      .filter((m) => m.tipo === "ingreso")
      .reduce((sum, m) => sum + m.monto, 0)
    const egresos = caja.movimientos
      .filter((m) => m.tipo === "egreso")
      .reduce((sum, m) => sum + m.monto, 0)
    const saldoActual = caja.saldoInicial + ingresos - egresos

    // Breakdown by payment method
    const porMedioPago = (medio: string) =>
      caja.movimientos
        .filter((m) => m.medioPago === medio)
        .reduce((s, m) => s + (m.tipo === "ingreso" ? m.monto : -m.monto), 0)

    return NextResponse.json({
      ...caja,
      resumen: {
        saldoActual,
        totalIngresos: ingresos,
        totalEgresos: egresos,
        cantidadMovimientos: caja.movimientos.length,
        porMedioPago: {
          efectivo: caja.saldoInicial + porMedioPago("efectivo"),
          tarjeta_debito: porMedioPago("tarjeta_debito"),
          tarjeta_credito: porMedioPago("tarjeta_credito"),
          transferencia: porMedioPago("transferencia"),
          qr: porMedioPago("qr"),
          cheque: porMedioPago("cheque"),
        },
      },
    })
  } catch (error) {
    console.error("Error al obtener caja:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
