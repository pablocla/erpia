import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { prisma } from "@/lib/prisma"
import { comprasService } from "@/lib/compras/compras-service"
import { z } from "zod"

const lineaOcSchema = z.object({
  productoId: z.number().int().positive().optional(),
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  precioUnitario: z.number().positive(),
})

const crearOcSchema = z.object({
  proveedorId: z.number().int().positive(),
  lineas: z.array(lineaOcSchema).min(1),
  condicionPagoId: z.number().int().positive().optional(),
  fechaEntregaEst: z.string().date().optional(),
  observaciones: z.string().optional(),
})

const aprobarSchema = z.object({
  ordenCompraId: z.number().int().positive(),
})

/**
 * GET /api/compras/ordenes — List OC with filters
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const proveedorId = searchParams.get("proveedorId")
    const estado = searchParams.get("estado")
    const skip = parseInt(searchParams.get("skip") ?? "0", 10)
    const take = Math.min(parseInt(searchParams.get("take") ?? "50", 10), 200)

    const where: Record<string, unknown> = { empresaId: ctx.auth.empresaId }
    if (proveedorId) where.proveedorId = parseInt(proveedorId, 10)
    if (estado) where.estado = estado

    const [data, total] = await Promise.all([
      prisma.ordenCompra.findMany({
        where,
        include: {
          proveedor: { select: { id: true, nombre: true, cuit: true } },
          lineas: true,
          _count: { select: { recepciones: true, compras: true } },
        },
        orderBy: { fechaEmision: "desc" },
        skip,
        take,
      }),
      prisma.ordenCompra.count({ where }),
    ])

    return NextResponse.json({ data, total, skip, take })
  } catch (error) {
    console.error("Error en GET ordenes compra:", error)
    logError("api/compras/ordenes:GET", error, request)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

/**
 * POST /api/compras/ordenes — Create OC or approve it
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()

    // Approve action
    if (body.action === "aprobar") {
      const v = aprobarSchema.safeParse(body)
      if (!v.success) return NextResponse.json({ error: "Datos inválidos", detalles: v.error.errors }, { status: 400 })
      const oc = await comprasService.aprobarOrdenCompra(v.data.ordenCompraId)
      return NextResponse.json(oc)
    }

    // Create OC
    const validacion = crearOcSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { proveedorId, lineas, condicionPagoId, fechaEntregaEst, observaciones } = validacion.data

    const oc = await comprasService.crearOrdenCompra({
      proveedorId,
      empresaId: ctx.auth.empresaId,
      lineas,
      condicionPagoId,
      fechaEntregaEst: fechaEntregaEst ? new Date(fechaEntregaEst) : undefined,
      observaciones,
    })

    return NextResponse.json(oc, { status: 201 })
  } catch (error) {
    console.error("Error en POST ordenes compra:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 },
    )
  }
}
