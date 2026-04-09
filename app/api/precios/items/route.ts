import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verificarToken } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"

const createSchema = z.object({
  listaPrecioId: z.number().int().positive(),
  productoId: z.number().int().positive(),
  precio: z.number().positive(),
  descuento: z.number().min(0).max(100).default(0),
})

const updateSchema = z.object({
  id: z.number().int().positive(),
  precio: z.number().positive().optional(),
  descuento: z.number().min(0).max(100).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const listaPrecioId = Number(searchParams.get("listaPrecioId"))
    if (!listaPrecioId || Number.isNaN(listaPrecioId)) {
      return NextResponse.json({ error: "listaPrecioId es obligatorio" }, { status: 400 })
    }

    const items = await db.itemListaPrecio.findMany({
      where: { listaPrecioId },
      include: {
        producto: { select: { id: true, codigo: true, nombre: true, precioVenta: true } },
      },
      orderBy: { productoId: "asc" },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("Error al listar items de lista de precio:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = prisma as any
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const item = await db.itemListaPrecio.upsert({
      where: {
        listaPrecioId_productoId: {
          listaPrecioId: parsed.data.listaPrecioId,
          productoId: parsed.data.productoId,
        },
      },
      update: {
        precio: parsed.data.precio,
        descuento: parsed.data.descuento,
      },
      create: {
        listaPrecioId: parsed.data.listaPrecioId,
        productoId: parsed.data.productoId,
        precio: parsed.data.precio,
        descuento: parsed.data.descuento,
      },
      include: {
        producto: { select: { id: true, codigo: true, nombre: true, precioVenta: true } },
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Error al crear item de lista de precio:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const db = prisma as any
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const { id, ...data } = parsed.data
    const updated = await db.itemListaPrecio.update({
      where: { id },
      data,
      include: {
        producto: { select: { id: true, codigo: true, nombre: true, precioVenta: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Item no encontrado" }, { status: 404 })
    console.error("Error al actualizar item de lista de precio:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = prisma as any
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get("id"))
    if (!id || Number.isNaN(id)) return NextResponse.json({ error: "id es obligatorio" }, { status: 400 })

    await db.itemListaPrecio.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Item no encontrado" }, { status: 404 })
    console.error("Error al eliminar item de lista de precio:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
