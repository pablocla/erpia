import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/banco/transferencias/[id] — Get transfer detail
 * DELETE /api/banco/transferencias/[id] — Anular transferencia (reverse movements)
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const transferencia = await prisma.movimientoBancario.findFirst({
      where: {
        id: Number(id),
        cuentaBancaria: { empresaId: ctx.auth.empresaId },
      },
      include: {
        cuentaBancaria: {
          select: { id: true, nombre: true, numeroCuenta: true, banco: { select: { nombre: true } } },
        },
      },
    })

    if (!transferencia) return NextResponse.json({ error: "Transferencia no encontrada" }, { status: 404 })

    // Find paired movement (contra-asiento)
    const par = transferencia.referenciaInterna
      ? await prisma.movimientoBancario.findFirst({
          where: {
            referenciaInterna: transferencia.referenciaInterna,
            id: { not: transferencia.id },
            cuentaBancaria: { empresaId: ctx.auth.empresaId },
          },
          include: {
            cuentaBancaria: {
              select: { id: true, nombre: true, numeroCuenta: true, banco: { select: { nombre: true } } },
            },
          },
        })
      : null

    return NextResponse.json({ transferencia, contrapartida: par })
  } catch (error) {
    console.error("Error al obtener transferencia:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
