import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verificarToken } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"

// ─── ESCALONES DE PRECIO (PRECIO POR VOLUMEN) ────────────────────────────────
// GET  ?itemListaPrecioId=N  → devuelve todos los escalones del item
// POST                       → crea un nuevo escalón
// PATCH                      → actualiza un escalón existente
// DELETE ?id=N               → elimina un escalón
//
// REQUIERE MIGRACIÓN: prisma migrate dev --name add-escalones-precio

const createSchema = z.object({
  itemListaPrecioId: z.number().int().positive(),
  cantidadDesde: z.number().int().min(1),
  cantidadHasta: z.number().int().min(1).nullable().optional(),
  precio: z.number().positive(),
  descuentoPct: z.number().min(0).max(100).default(0),
})

const updateSchema = z.object({
  id: z.number().int().positive(),
  cantidadDesde: z.number().int().min(1).optional(),
  cantidadHasta: z.number().int().min(1).nullable().optional(),
  precio: z.number().positive().optional(),
  descuentoPct: z.number().min(0).max(100).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const db = prisma as any
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const itemListaPrecioId = Number(searchParams.get("itemListaPrecioId"))
    if (!itemListaPrecioId || Number.isNaN(itemListaPrecioId)) {
      return NextResponse.json({ error: "itemListaPrecioId es obligatorio" }, { status: 400 })
    }

    const escalones = await db.escalonPrecio.findMany({
      where: { itemListaPrecioId },
      orderBy: { cantidadDesde: "asc" },
    })

    return NextResponse.json(escalones)
  } catch (error) {
    console.error("Error al listar escalones de precio:", error)
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

    const { cantidadHasta, ...rest } = parsed.data

    // Validar que el itemListaPrecio existe
    const item = await db.itemListaPrecio.findUnique({ where: { id: rest.itemListaPrecioId } })
    if (!item) return NextResponse.json({ error: "Item de lista de precio no encontrado" }, { status: 404 })

    // Validar que cantidadHasta > cantidadDesde si está presente
    if (cantidadHasta !== null && cantidadHasta !== undefined && cantidadHasta <= rest.cantidadDesde) {
      return NextResponse.json(
        { error: "cantidadHasta debe ser mayor que cantidadDesde" },
        { status: 400 },
      )
    }

    const escalon = await db.escalonPrecio.create({
      data: {
        ...rest,
        cantidadHasta: cantidadHasta ?? null,
      },
    })

    return NextResponse.json(escalon, { status: 201 })
  } catch (error) {
    console.error("Error al crear escalón de precio:", error)
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
    const updated = await db.escalonPrecio.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Escalón no encontrado" }, { status: 404 })
    console.error("Error al actualizar escalón de precio:", error)
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

    await db.escalonPrecio.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.code === "P2025") return NextResponse.json({ error: "Escalón no encontrado" }, { status: 404 })
    console.error("Error al eliminar escalón de precio:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
