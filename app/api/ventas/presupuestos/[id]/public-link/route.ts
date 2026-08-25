import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { generarTokenPresupuesto } from "@/lib/ventas/presupuesto-jwt"

/**
 * GET /api/ventas/presupuestos/[id]/public-link
 * Genera el JWT y la URL pública para el cliente final.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const presupuestoId = parseInt(id)

    const presupuesto = await prisma.presupuesto.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: presupuestoId }),
      select: { id: true, estado: true },
    })

    if (!presupuesto) {
      return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 })
    }

    const token = await generarTokenPresupuesto(presupuestoId, ctx.auth.empresaId)

    // Determinar la base URL
    const url = new URL(request.url)
    const publicLink = `${url.origin}/p/${token}`

    return NextResponse.json({ publicLink, token })
  } catch (error) {
    console.error("Error al generar public-link:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
