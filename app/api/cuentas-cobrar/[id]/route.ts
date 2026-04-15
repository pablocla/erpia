import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/cuentas-cobrar/[id] — Detail of a single CC record
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params

    const cc = await prisma.cuentaCobrar.findFirst({
      where: { id: parseInt(id), factura: { empresaId: ctx.auth.empresaId } },
      include: {
        factura: { select: { id: true, tipo: true, numero: true, puntoVenta: true, total: true } },
        cliente: { select: { id: true, nombre: true, cuit: true } },
        items: {
          include: {
            recibo: { select: { id: true, numero: true, fecha: true } },
          },
        },
      },
    })

    if (!cc) {
      return NextResponse.json({ error: "Cuenta a cobrar no encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      ...cc,
      montoOriginal: Number(cc.montoOriginal),
      montoPagado: Number(cc.montoPagado),
      saldo: Number(cc.saldo),
    })
  } catch (error) {
    console.error("Error al obtener CC:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
