import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarTokenPresupuesto } from "@/lib/ventas/presupuesto-jwt"

/**
 * GET /api/p/[token]
 * Devuelve los detalles de un presupuesto público si el token es válido.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const payload = await verificarTokenPresupuesto(token)

    if (!payload) {
      return NextResponse.json({ error: "Enlace inválido o expirado" }, { status: 401 })
    }

    const presupuesto = await prisma.presupuesto.findFirst({
      where: {
        id: payload.presupuestoId,
        empresaId: payload.empresaId,
      },
      include: {
        empresa: {
          select: { nombre: true, cuit: true, telefono: true, direccion: true },
        },
        cliente: {
          select: { nombre: true, email: true, cuit: true, telefono: true, direccion: true },
        },
        condicionPago: {
          select: { nombre: true },
        },
        lineas: {
          include: { producto: { select: { nombre: true, descripcion: true } } },
          orderBy: { orden: "asc" },
        },
      },
    })

    if (!presupuesto) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 })
    }

    return NextResponse.json(presupuesto)
  } catch (error) {
    console.error("Error al obtener presupuesto público:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
