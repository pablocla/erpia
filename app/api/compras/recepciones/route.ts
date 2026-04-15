import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { comprasService } from "@/lib/compras/compras-service"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// ─── GET — List recepciones ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const params = request.nextUrl.searchParams
    const ordenCompraId = params.get("ordenCompraId")
    const page = Math.max(1, Number(params.get("page") || 1))
    const limit = Math.min(100, Math.max(1, Number(params.get("limit") || 50)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = whereEmpresa(ctx.auth.empresaId)
    if (ordenCompraId) where.ordenCompraId = Number(ordenCompraId)

    const [recepciones, total] = await Promise.all([
      prisma.recepcionCompra.findMany({
        where,
        include: {
          ordenCompra: { select: { id: true, numero: true } },
          lineas: true,
        },
        orderBy: { fecha: "desc" },
        skip,
        take: limit,
      }),
      prisma.recepcionCompra.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      recepciones,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error("Error en GET recepciones:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

const lineaRecepcionSchema = z.object({
  lineaOcId: z.number().int().positive(),
  productoId: z.number().int().positive().optional(),
  cantidadRecibida: z.number().positive(),
  cantidadRechazada: z.number().min(0).optional(),
  observacion: z.string().optional(),
})

const recepcionSchema = z.object({
  ordenCompraId: z.number().int().positive(),
  depositoId: z.number().int().positive().optional(),
  lineas: z.array(lineaRecepcionSchema).min(1),
  observaciones: z.string().optional(),
})

/**
 * POST /api/compras/recepciones — Register receipt of goods against a PO
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = recepcionSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const recepcion = await comprasService.registrarRecepcion(validacion.data)
    return NextResponse.json(recepcion, { status: 201 })
  } catch (error) {
    console.error("Error en POST recepción:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 },
    )
  }
}
