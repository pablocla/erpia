import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const params = request.nextUrl.searchParams
    const productoId = params.get("productoId")
    const tipo = params.get("tipo")
    const page = Math.max(1, Number(params.get("page") ?? 1))
    const limit = Math.min(100, Math.max(1, Number(params.get("limit") ?? 50)))

    const where: Record<string, unknown> = {}
    if (productoId) where.productoId = Number(productoId)
    if (tipo) where.tipo = tipo

    const [movimientos, total] = await Promise.all([
      prisma.movimientoStock.findMany({
        where,
        include: {
          producto: { select: { id: true, nombre: true, codigo: true, stock: true } },
          deposito: { select: { id: true, nombre: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.movimientoStock.count({ where }),
    ])

    // Resumen
    const agg = await prisma.movimientoStock.groupBy({
      by: ["tipo"],
      _count: { id: true },
      _sum: { cantidad: true },
    })

    const resumen = {
      total,
      porTipo: Object.fromEntries(agg.map(a => [a.tipo, { cantidad: a._count.id, unidades: a._sum.cantidad ?? 0 }])),
    }

    return NextResponse.json({ success: true, movimientos, resumen, page, limit, total })
  } catch (error) {
    console.error("Error al obtener movimientos de stock:", error)
    return NextResponse.json({ error: "Error al obtener movimientos" }, { status: 500 })
  }
}
