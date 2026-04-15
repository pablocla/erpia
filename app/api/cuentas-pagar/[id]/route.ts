import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/cuentas-pagar/[id] — Detail of a single CP record
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const cp = await prisma.cuentaPagar.findFirst({
      where: { id: parseInt(id), compra: { empresaId: ctx.auth.empresaId } },
      include: {
        compra: { select: { id: true, tipo: true, numero: true, puntoVenta: true, total: true } },
        proveedor: { select: { id: true, nombre: true, cuit: true } },
        items: {
          include: {
            ordenPago: { select: { id: true, numero: true, fecha: true } },
          },
        },
      },
    })

    if (!cp) {
      return NextResponse.json({ error: "Cuenta a pagar no encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      ...cp,
      montoOriginal: Number(cp.montoOriginal),
      montoPagado: Number(cp.montoPagado),
      saldo: Number(cp.saldo),
    })
  } catch (error) {
    console.error("Error al obtener CP:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
