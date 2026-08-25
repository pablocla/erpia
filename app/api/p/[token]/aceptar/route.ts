import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarTokenPresupuesto } from "@/lib/ventas/presupuesto-jwt"

/**
 * POST /api/p/[token]/aceptar
 * Marca un presupuesto público como aceptado.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
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
      select: { id: true, estado: true, fechaVencimiento: true },
    })

    if (!presupuesto) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 })
    }

    // Comprobar fecha de vencimiento
    if (presupuesto.fechaVencimiento && presupuesto.fechaVencimiento < new Date()) {
      return NextResponse.json({ error: "Presupuesto vencido" }, { status: 400 })
    }

    if (presupuesto.estado === "aceptado" || presupuesto.estado === "facturado") {
      return NextResponse.json({ error: "El presupuesto ya fue aceptado anteriormente" }, { status: 400 })
    }
    
    if (presupuesto.estado === "rechazado" || presupuesto.estado === "vencido") {
      return NextResponse.json({ error: "El presupuesto se encuentra rechazado o vencido" }, { status: 400 })
    }

    await prisma.presupuesto.update({
      where: { id: presupuesto.id },
      data: { estado: "aceptado" },
    })

    return NextResponse.json({ success: true, message: "Presupuesto aceptado correctamente" })
  } catch (error) {
    console.error("Error al aceptar presupuesto:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
