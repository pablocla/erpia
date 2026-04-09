import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const crearPedidoSchema = z.object({
  empresaId: z.number().int().positive(),
  clienteId: z.number().int().positive(),
  observaciones: z.string().optional(),
  lineas: z.array(z.object({
    productoId: z.number().int().positive(),
    cantidad: z.number().positive(),
    precioUnitario: z.number().nonnegative(),
  })).min(1),
})

/**
 * GET /api/portal/pedidos?clienteId=X&empresaId=Y
 * Retorna los últimos pedidos del cliente para el portal B2B.
 *
 * POST /api/portal/pedidos
 * Crea un nuevo pedido desde el portal B2B del cliente.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = parseInt(searchParams.get("clienteId") || "0")
    const empresaId = parseInt(searchParams.get("empresaId") || "0")

    if (!clienteId || !empresaId) {
      return NextResponse.json({ error: "clienteId y empresaId son requeridos" }, { status: 400 })
    }

    const pedidos = await prisma.pedidoVenta.findMany({
      where: { clienteId, empresaId, deletedAt: null },
      include: {
        lineas: {
          select: {
            descripcion: true,
            cantidad: true,
            precioUnitario: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json(pedidos)
  } catch (error) {
    console.error("portal/pedidos GET:", error)
    return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = crearPedidoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { empresaId, clienteId, observaciones, lineas } = parsed.data

    // Validate cliente belongs to empresa
    const cliente = await prisma.cliente.findFirst({
      where: { id: clienteId, empresaId, activo: true, deletedAt: null },
      select: { id: true, nombre: true },
    })
    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    // Validate products and stock
    for (const linea of lineas) {
      const producto = await prisma.producto.findFirst({
        where: { id: linea.productoId, empresaId, activo: true },
        select: { stock: true, nombre: true },
      })
      if (!producto) {
        return NextResponse.json({ error: `Producto ${linea.productoId} no encontrado` }, { status: 400 })
      }
    }

    const total = lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0)

    // Generate numero
    const count = await prisma.pedidoVenta.count({ where: { empresaId } })
    const numero = `PED-B2B-${String(count + 1).padStart(5, "0")}`

    const pedido = await prisma.pedidoVenta.create({
      data: {
        empresaId,
        clienteId,
        numero,
        estado: "pendiente",
        canal: "B2B_PORTAL",
        observaciones,
        total,
        lineas: {
          create: lineas.map((l) => ({
            productoId: l.productoId,
            descripcion: "",   // Se llena en la vista admin
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            total: l.cantidad * l.precioUnitario,
          })),
        },
      },
      select: { id: true, numero: true, estado: true, total: true },
    })

    return NextResponse.json(pedido, { status: 201 })
  } catch (error) {
    console.error("portal/pedidos POST:", error)
    return NextResponse.json({ error: "Error al crear pedido" }, { status: 500 })
  }
}
