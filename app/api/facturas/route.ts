import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/facturas — List emitted invoices with filters, pagination, and summary.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const tipo = searchParams.get("tipo")
    const estado = searchParams.get("estado")
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    const search = searchParams.get("search")
    const skip = parseInt(searchParams.get("skip") ?? "0", 10)
    const take = Math.min(parseInt(searchParams.get("take") ?? "50", 10), 200)

    const where: Record<string, unknown> = whereEmpresa(ctx.auth.empresaId)
    if (clienteId) where.clienteId = parseInt(clienteId, 10)
    if (tipo) where.tipo = tipo
    if (estado) where.estado = estado
    if (desde || hasta) {
      where.createdAt = {}
      if (desde) (where.createdAt as Record<string, unknown>).gte = new Date(desde)
      if (hasta) (where.createdAt as Record<string, unknown>).lte = new Date(hasta)
    }
    if (search) {
      where.OR = [
        { cliente: { nombre: { contains: search, mode: "insensitive" } } },
        { cliente: { cuit: { contains: search } } },
        { cae: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.factura.findMany({
        where,
        include: {
          cliente: { select: { id: true, nombre: true, cuit: true } },
          vendedor: { select: { id: true, nombre: true } },
          condicionPago: { select: { id: true, nombre: true } },
          _count: { select: { lineas: true, notasCredito: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.factura.count({ where }),
    ])

    // Summary stats
    const emitidas = data.filter((f) => f.estado === "emitida")
    const totalFacturado = emitidas.reduce((s, f) => s + f.total, 0)
    const totalIVA = emitidas.reduce((s, f) => s + f.iva, 0)

    return NextResponse.json({
      data,
      total,
      skip,
      take,
      resumen: {
        totalFacturado: Math.round(totalFacturado * 100) / 100,
        totalIVA: Math.round(totalIVA * 100) / 100,
        cantidadEmitidas: emitidas.length,
      },
    })
  } catch (error) {
    console.error("Error en GET facturas:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
