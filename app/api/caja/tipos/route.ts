import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"

/** GET /api/caja/tipos — tipos de caja activos de la empresa (p. ej. Corriente / Ahorro). */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const tipos = await prisma.cajaTipo.findMany({
      where: whereEmpresa(ctx.auth.empresaId, { activo: true }),
      select: { id: true, codigo: true, nombre: true },
      orderBy: { id: "asc" },
    })
    return NextResponse.json(tipos)
  } catch (error) {
    console.error("Error al obtener tipos de caja:", error)
    return NextResponse.json({ error: "Error al obtener tipos de caja" }, { status: 500 })
  }
}
