import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

/**
 * GET /api/stock — List inventory (global or per-depósito)
 * Query params: ?depositoId=&search=&stockBajo=true&page=1&limit=50
 */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const params = request.nextUrl.searchParams
  const depositoId = params.get("depositoId")
  const search = params.get("search")
  const stockBajo = params.get("stockBajo") === "true"
  const page = Math.max(1, Number(params.get("page") || 1))
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") || 50)))
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = whereEmpresa(ctx.auth.empresaId, {
    activo: true,
  })
  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: "insensitive" } },
      { codigo: { contains: search, mode: "insensitive" } },
      { codigoBarras: { contains: search, mode: "insensitive" } },
    ]
  }
  if (stockBajo) {
    where.stock = { lte: prisma.producto.fields.stockMinimo }
  }

  const [productos, total] = await Promise.all([
    prisma.producto.findMany({
      where: stockBajo
        ? { ...where, stock: undefined, AND: [{ stock: { lte: 0 } }] }
        : where,
      select: {
        id: true,
        codigo: true,
        codigoBarras: true,
        nombre: true,
        stock: true,
        stockMinimo: true,
        precioVenta: true,
        precioCosto: true,
        unidadMedida: true,
        categoria: { select: { id: true, nombre: true } },
        marca: { select: { id: true, nombre: true } },
        stockDepositos: depositoId
          ? { where: { depositoId: Number(depositoId) } }
          : { include: { deposito: { select: { id: true, nombre: true } } } },
      },
      orderBy: { nombre: "asc" },
      skip,
      take: limit,
    }),
    prisma.producto.count({ where }),
  ])

  // If stockBajo was requested, filter in-app (raw SQL would be ideal but this works)
  const items = stockBajo
    ? productos.filter((p) => p.stock <= p.stockMinimo)
    : productos

  // Summary stats
  const stats = await prisma.producto.aggregate({
    where: whereEmpresa(ctx.auth.empresaId, { activo: true }),
    _count: true,
    _sum: { stock: true },
  })

  const alertas = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM productos 
    WHERE empresa_id = ${ctx.auth.empresaId} 
      AND activo = true 
      AND stock <= stock_minimo
  `

  return NextResponse.json({
    success: true,
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    resumen: {
      totalProductos: stats._count,
      stockTotal: stats._sum.stock || 0,
      alertasStockBajo: Number(alertas[0]?.count || 0),
    },
  })
}

const ajusteStockSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number(),
  motivo: z.string().min(1).max(500),
  depositoId: z.number().int().positive().optional(),
})

/**
 * POST /api/stock — Manual stock adjustment
 */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()
  const data = ajusteStockSchema.parse(body)

  // Verify product belongs to empresa
  const producto = await prisma.producto.findFirst({
    where: whereEmpresa(ctx.auth.empresaId, { id: data.productoId }),
  })
  if (!producto) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
  }

  const { stockService } = await import("@/lib/stock/stock-service")
  await stockService.ajustarStockManual(
    data.productoId,
    data.cantidad,
    data.motivo,
    data.depositoId,
  )

  return NextResponse.json({
    success: true,
    mensaje: `Stock ajustado: ${data.cantidad > 0 ? "+" : ""}${data.cantidad} unidades`,
    stockAnterior: producto.stock,
    stockNuevo: producto.stock + data.cantidad,
  })
}
