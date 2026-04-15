import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/pagos/[id] — Detail of a payment (OrdenPago + items + CP applied)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const op = await prisma.ordenPago.findFirst({
      where: { id: parseInt(id), empresaId: ctx.auth.empresaId },
      include: {
        proveedor: { select: { id: true, nombre: true, cuit: true } },
        items: {
          include: {
            cuentaPagar: {
              select: { id: true, numeroCuota: true, montoOriginal: true, saldo: true, estado: true },
            },
          },
        },
        retencionesSicore: true,
      },
    })

    if (!op) {
      return NextResponse.json({ error: "Orden de pago no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ ...op, montoTotal: Number(op.montoTotal) })
  } catch (error) {
    console.error("Error al obtener pago:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
