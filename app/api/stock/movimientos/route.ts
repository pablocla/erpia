import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/stock/movimientos — Stock movement history
 * Query params: ?productoId=&depositoId=&tipo=&desde=&hasta=&page=1&limit=50
 */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const params = request.nextUrl.searchParams
  const productoId = params.get("productoId")
  const depositoId = params.get("depositoId")
  const tipo = params.get("tipo")
  const desde = params.get("desde")
  const hasta = params.get("hasta")
  const page = Math.max(1, Number(params.get("page") || 1))
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") || 50)))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    producto: whereEmpresa(ctx.auth.empresaId),
  }
  if (productoId) where.productoId = Number(productoId)
  if (depositoId) where.depositoId = Number(depositoId)
  if (tipo) where.tipo = tipo
  if (desde || hasta) {
    where.createdAt = {}
    if (desde) (where.createdAt as Record<string, unknown>).gte = new Date(desde)
    if (hasta) (where.createdAt as Record<string, unknown>).lte = new Date(hasta)
  }

  const [movimientos, total] = await Promise.all([
    prisma.movimientoStock.findMany({
      where,
      include: {
        producto: { select: { id: true, codigo: true, nombre: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.movimientoStock.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    movimientos,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}
