import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { eventBus } from "@/lib/events/event-bus"
import "@/lib/stock/stock-service"

const lineaRemitoSchema = z.object({
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  unidad: z.string().default("unidad"),
  productoId: z.number().int().positive().optional().nullable(),
})

const remitoSchema = z.object({
  clienteId: z.number().int().positive(),
  facturaId: z.number().int().positive().optional(),
  pedidoVentaId: z.number().int().positive().optional().nullable(),
  incotermId: z.number().int().positive().optional().nullable(),
  observaciones: z.string().optional(),
  lineas: z.array(lineaRemitoSchema).min(1, "Al menos una línea es obligatoria"),
})

// ─── GET — List remitos with filters ─────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const facturaId = searchParams.get("facturaId")
    const estado = searchParams.get("estado")
    const skip = parseInt(searchParams.get("skip") ?? "0", 10)
    const take = Math.min(parseInt(searchParams.get("take") ?? "50", 10), 200)

    const where: Record<string, unknown> = { empresaId: ctx.auth.empresaId }
    if (clienteId) where.clienteId = parseInt(clienteId, 10)
    if (facturaId) where.facturaId = parseInt(facturaId, 10)
    if (estado) where.estado = estado

    const [data, total] = await Promise.all([
      prisma.remito.findMany({
        where,
        include: {
          cliente: { select: { id: true, nombre: true, cuit: true } },
          factura: { select: { id: true, tipo: true, numero: true, puntoVenta: true } },
          incoterm: true,
          lineas: true,
        },
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      prisma.remito.count({ where }),
    ])

    return NextResponse.json({ data, total, skip, take })
  } catch (error) {
    console.error("Error en GET remitos:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── POST — Create remito ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = remitoSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { clienteId, facturaId, pedidoVentaId, incotermId, observaciones, lineas } = validacion.data

    // Validate client exists
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } })
    if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })

    // Validate invoice if provided
    if (facturaId) {
      const factura = await prisma.factura.findUnique({ where: { id: facturaId } })
      if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    if (pedidoVentaId) {
      const pedido = await prisma.pedidoVenta.findUnique({ where: { id: pedidoVentaId } })
      if (!pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    // Next number
    const ultimoRemito = await prisma.remito.findFirst({ orderBy: { numero: "desc" } })
    const nuevoNumero = (ultimoRemito?.numero ?? 0) + 1

    const remito = await prisma.remito.create({
      data: {
        numero: nuevoNumero,
        estado: "pendiente",
        observaciones,
        clienteId,
        facturaId: facturaId ?? null,
        pedidoVentaId: pedidoVentaId ?? null,
        incotermId: incotermId ?? null,
        empresaId: ctx.auth.empresaId,
        lineas: {
          create: lineas.map((l) => ({
            descripcion: l.descripcion,
            cantidad: l.cantidad,
            unidad: l.unidad,
            productoId: l.productoId ?? null,
          })),
        },
      },
      include: {
        lineas: true,
        cliente: { select: { id: true, nombre: true } },
        incoterm: true,
      },
    })

    return NextResponse.json(remito, { status: 201 })
  } catch (error) {
    console.error("Error al crear remito:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
