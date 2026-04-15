import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

/**
 * GET /api/stock/depositos — List warehouses with stock summary
 */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const depositos = await prisma.deposito.findMany({
    where: whereEmpresa(ctx.auth.empresaId),
    include: {
      _count: { select: { stockDepositos: true } },
      stockDepositos: {
        select: { cantidad: true },
      },
    },
    orderBy: { nombre: "asc" },
  })

  const result = depositos.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    direccion: d.direccion,
    esPrincipal: d.esPrincipal,
    activo: d.activo,
    totalProductos: d._count.stockDepositos,
    stockTotal: d.stockDepositos.reduce((sum: number, s: { cantidad: number }) => sum + s.cantidad, 0),
  }))

  return NextResponse.json({ success: true, depositos: result })
}

const transferenciaSchema = z.object({
  productoId: z.number().int().positive(),
  depositoOrigenId: z.number().int().positive(),
  depositoDestinoId: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  observaciones: z.string().optional(),
})

/**
 * POST /api/stock/depositos — Transfer stock between warehouses
 */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()
  const data = transferenciaSchema.parse(body)

  if (data.depositoOrigenId === data.depositoDestinoId) {
    return NextResponse.json({ error: "Origen y destino no pueden ser iguales" }, { status: 400 })
  }

  // Verify ownership
  const [producto, depOrigen, depDestino] = await Promise.all([
    prisma.producto.findFirst({ where: whereEmpresa(ctx.auth.empresaId, { id: data.productoId }) }),
    prisma.deposito.findFirst({ where: whereEmpresa(ctx.auth.empresaId, { id: data.depositoOrigenId }) }),
    prisma.deposito.findFirst({ where: whereEmpresa(ctx.auth.empresaId, { id: data.depositoDestinoId }) }),
  ])
  if (!producto) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
  if (!depOrigen) return NextResponse.json({ error: "Depósito origen no encontrado" }, { status: 404 })
  if (!depDestino) return NextResponse.json({ error: "Depósito destino no encontrado" }, { status: 404 })

  // Check sufficient stock in source
  const stockOrigen = await prisma.stockDeposito.findUnique({
    where: { productoId_depositoId: { productoId: data.productoId, depositoId: data.depositoOrigenId } },
  })
  if (!stockOrigen || stockOrigen.cantidad < data.cantidad) {
    return NextResponse.json({ error: "Stock insuficiente en depósito origen" }, { status: 400 })
  }

  const transferencia = await prisma.$transaction(async (tx) => {
    // Decrement source
    await tx.stockDeposito.update({
      where: { productoId_depositoId: { productoId: data.productoId, depositoId: data.depositoOrigenId } },
      data: { cantidad: { decrement: data.cantidad } },
    })

    // Increment destination
    await tx.stockDeposito.upsert({
      where: { productoId_depositoId: { productoId: data.productoId, depositoId: data.depositoDestinoId } },
      update: { cantidad: { increment: data.cantidad } },
      create: { productoId: data.productoId, depositoId: data.depositoDestinoId, cantidad: data.cantidad },
    })

    // Record transfer
    const transfer = await tx.transferenciaDeposito.create({
      data: {
        productoId: data.productoId,
        depositoOrigenId: data.depositoOrigenId,
        depositoDestinoId: data.depositoDestinoId,
        cantidad: data.cantidad,
        observaciones: data.observaciones,
      },
    })

    // Movement records
    await tx.movimientoStock.createMany({
      data: [
        {
          productoId: data.productoId,
          tipo: "transferencia_salida",
          cantidad: data.cantidad,
          motivo: `Transferencia a ${depDestino.nombre}`,
          depositoId: data.depositoOrigenId,
        },
        {
          productoId: data.productoId,
          tipo: "transferencia_entrada",
          cantidad: data.cantidad,
          motivo: `Transferencia desde ${depOrigen.nombre}`,
          depositoId: data.depositoDestinoId,
        },
      ],
    })

    return transfer
  })

  return NextResponse.json({ success: true, transferencia }, { status: 201 })
}
