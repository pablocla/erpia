import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const listaPrecioSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(500).optional(),
  factorMarkup: z.number().positive().optional(),
  esAutomatica: z.boolean().optional(),
  vigenciaDesde: z.string().date().optional(),
  vigenciaHasta: z.string().date().optional(),
  monedaId: z.number().int().positive().optional(),
  activo: z.boolean().optional(),
})

const itemSchema = z.object({
  listaPrecioId: z.number().int().positive(),
  productoId: z.number().int().positive(),
  precio: z.number().nonnegative(),
  descuento: z.number().min(0).max(100).optional(),
})

// ─── GET — List listas de precio ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const activo = searchParams.get("activo")
    const includeItems = searchParams.get("items") === "true"

    const where: any = { empresaId: ctx.auth.empresaId }
    if (activo !== null) where.activo = activo === "true"

    const listas = await prisma.listaPrecio.findMany({
      where,
      include: {
        moneda: { select: { id: true, nombre: true, simbolo: true } },
        items: includeItems ? {
          include: { producto: { select: { id: true, codigo: true, nombre: true, precioVenta: true } } },
          orderBy: { producto: { nombre: "asc" } },
        } : false,
        _count: { select: { items: true, clientes: true } },
      },
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json({ success: true, data: listas })
  } catch (error) {
    console.error("Error al listar listas de precio:", error)
    return NextResponse.json({ error: "Error al listar listas de precio" }, { status: 500 })
  }
}

// ─── POST — Create lista or add item ────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()

    // Check if it's an item addition
    const itemResult = itemSchema.safeParse(body)
    if (itemResult.success) {
      // Verify lista belongs to empresa
      const lista = await prisma.listaPrecio.findFirst({
        where: { id: itemResult.data.listaPrecioId, empresaId: ctx.auth.empresaId },
      })
      if (!lista) return NextResponse.json({ error: "Lista no encontrada" }, { status: 404 })

      const item = await prisma.itemListaPrecio.upsert({
        where: {
          listaPrecioId_productoId: {
            listaPrecioId: itemResult.data.listaPrecioId,
            productoId: itemResult.data.productoId,
          },
        },
        update: { precio: itemResult.data.precio, descuento: itemResult.data.descuento ?? 0 },
        create: {
          listaPrecioId: itemResult.data.listaPrecioId,
          productoId: itemResult.data.productoId,
          precio: itemResult.data.precio,
          descuento: itemResult.data.descuento ?? 0,
        },
      })
      return NextResponse.json({ success: true, data: item })
    }

    // Create new lista
    const validacion = listaPrecioSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { vigenciaDesde, vigenciaHasta, ...rest } = validacion.data

    const lista = await prisma.listaPrecio.create({
      data: {
        ...rest,
        vigenciaDesde: vigenciaDesde ? new Date(vigenciaDesde) : null,
        vigenciaHasta: vigenciaHasta ? new Date(vigenciaHasta) : null,
        empresaId: ctx.auth.empresaId,
      },
    })

    return NextResponse.json({ success: true, data: lista }, { status: 201 })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una lista con ese nombre" }, { status: 409 })
    }
    console.error("Error al crear lista de precio:", error)
    return NextResponse.json({ error: "Error al crear lista de precio" }, { status: 500 })
  }
}

// ─── PUT — Update lista de precio ───────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const { id, ...data } = body

    if (!id || typeof id !== "number") {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const validacion = listaPrecioSchema.partial().safeParse(data)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { vigenciaDesde, vigenciaHasta, ...rest } = validacion.data

    const lista = await prisma.listaPrecio.update({
      where: { id, empresaId: ctx.auth.empresaId },
      data: {
        ...rest,
        ...(vigenciaDesde !== undefined && { vigenciaDesde: vigenciaDesde ? new Date(vigenciaDesde) : null }),
        ...(vigenciaHasta !== undefined && { vigenciaHasta: vigenciaHasta ? new Date(vigenciaHasta) : null }),
      },
    })

    return NextResponse.json({ success: true, data: lista })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Lista no encontrada" }, { status: 404 })
    }
    console.error("Error al actualizar lista de precio:", error)
    return NextResponse.json({ error: "Error al actualizar lista" }, { status: 500 })
  }
}
