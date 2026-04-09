import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"

const recetaComponentSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().positive(),
  unidad: z.string().optional(),
  descripcion: z.string().optional(),
})

const platoSchema = z.object({
  producto: z.object({
    codigo: z.string().min(1),
    nombre: z.string().min(1),
    descripcion: z.string().optional(),
    precioVenta: z.number().positive(),
    precioCompra: z.number().optional(),
    porcentajeIva: z.number().min(0).max(100).optional(),
    unidad: z.string().optional(),
    categoriaId: z.number().int().positive().optional().nullable(),
  }),
  receta: z.object({
    descripcion: z.string().optional(),
    componentes: z.array(recetaComponentSchema).min(1),
  }),
})

const platoUpdateSchema = z.object({
  productoId: z.number().int().positive(),
  producto: platoSchema.shape.producto.partial(),
  receta: z
    .object({
      descripcion: z.string().optional(),
      componentes: z.array(recetaComponentSchema).min(1),
    })
    .optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const productos = await prisma.producto.findMany({
      where: whereEmpresa(ctx.auth.empresaId, { esPlato: true, activo: true }),
      include: { categoria: true },
      orderBy: { nombre: "asc" },
    })

    const recetas = await prisma.listaMateriales.findMany({
      where: {
        empresaId: ctx.auth.empresaId,
        tipo: "receta",
        productoId: { in: productos.map((p) => p.id) },
      },
      include: {
        componentes: { include: { producto: true } },
      },
    })

    const recetaByProducto = new Map(recetas.map((r) => [r.productoId, r]))

    const platos = productos.map((producto) => ({
      producto,
      receta: recetaByProducto.get(producto.id) ?? null,
    }))

    return NextResponse.json(platos)
  } catch (error) {
    console.error("Error al obtener platos:", error)
    return NextResponse.json({ error: "Error al obtener platos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = platoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { producto, receta } = parsed.data

    const existente = await prisma.producto.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { codigo: producto.codigo }),
    })
    if (existente) {
      return NextResponse.json({ error: "Ya existe un producto con ese código" }, { status: 409 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const creado = await tx.producto.create({
        data: {
          codigo: producto.codigo,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precioVenta: producto.precioVenta,
          precioCompra: producto.precioCompra ?? 0,
          porcentajeIva: producto.porcentajeIva ?? 21,
          unidad: producto.unidad ?? "unidad",
          categoriaId: producto.categoriaId ?? null,
          esPlato: true,
          empresaId: ctx.auth.empresaId,
        },
        include: { categoria: true },
      })

      const recetaCreada = await tx.listaMateriales.create({
        data: {
          codigo: `REC-${creado.id}`,
          nombre: `Receta ${creado.nombre}`,
          descripcion: receta.descripcion,
          tipo: "receta",
          empresaId: ctx.auth.empresaId,
          productoId: creado.id,
          componentes: {
            create: receta.componentes.map((c) => ({
              productoId: c.productoId,
              cantidad: c.cantidad,
              unidad: c.unidad ?? "unidad",
              descripcion: c.descripcion,
            })),
          },
        },
        include: { componentes: { include: { producto: true } } },
      })

      return { producto: creado, receta: recetaCreada }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error al crear plato:", error)
    return NextResponse.json({ error: "Error al crear plato" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = platoUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { productoId, producto, receta } = parsed.data

    const existente = await prisma.producto.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: productoId }),
    })
    if (!existente) {
      return NextResponse.json({ error: "Plato no encontrado" }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.producto.update({
        where: { id: productoId },
        data: {
          ...(producto.codigo && { codigo: producto.codigo }),
          ...(producto.nombre && { nombre: producto.nombre }),
          ...(producto.descripcion !== undefined && { descripcion: producto.descripcion }),
          ...(producto.precioVenta !== undefined && { precioVenta: producto.precioVenta }),
          ...(producto.precioCompra !== undefined && { precioCompra: producto.precioCompra }),
          ...(producto.porcentajeIva !== undefined && { porcentajeIva: producto.porcentajeIva }),
          ...(producto.unidad && { unidad: producto.unidad }),
          ...(producto.categoriaId !== undefined && { categoriaId: producto.categoriaId ?? null }),
          esPlato: true,
        },
        include: { categoria: true },
      })

      let recetaActualizada = await tx.listaMateriales.findFirst({
        where: { empresaId: ctx.auth.empresaId, productoId, tipo: "receta" },
        include: { componentes: { include: { producto: true } } },
      })

      if (receta) {
        if (recetaActualizada) {
          await tx.componenteBOM.deleteMany({ where: { bomId: recetaActualizada.id } })
          recetaActualizada = await tx.listaMateriales.update({
            where: { id: recetaActualizada.id },
            data: {
              descripcion: receta.descripcion,
              nombre: `Receta ${actualizado.nombre}`,
              componentes: {
                create: receta.componentes.map((c) => ({
                  productoId: c.productoId,
                  cantidad: c.cantidad,
                  unidad: c.unidad ?? "unidad",
                  descripcion: c.descripcion,
                })),
              },
            },
            include: { componentes: { include: { producto: true } } },
          })
        } else {
          recetaActualizada = await tx.listaMateriales.create({
            data: {
              codigo: `REC-${actualizado.id}`,
              nombre: `Receta ${actualizado.nombre}`,
              descripcion: receta.descripcion,
              tipo: "receta",
              empresaId: ctx.auth.empresaId,
              productoId: actualizado.id,
              componentes: {
                create: receta.componentes.map((c) => ({
                  productoId: c.productoId,
                  cantidad: c.cantidad,
                  unidad: c.unidad ?? "unidad",
                  descripcion: c.descripcion,
                })),
              },
            },
            include: { componentes: { include: { producto: true } } },
          })
        }
      }

      return { producto: actualizado, receta: recetaActualizada }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al actualizar plato:", error)
    return NextResponse.json({ error: "Error al actualizar plato" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const productoId = Number(searchParams.get("productoId"))
    if (!productoId) return NextResponse.json({ error: "ProductoId requerido" }, { status: 400 })

    const existente = await prisma.producto.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: productoId }),
    })
    if (!existente) return NextResponse.json({ error: "Plato no encontrado" }, { status: 404 })

    await prisma.$transaction([
      prisma.producto.update({ where: { id: productoId }, data: { activo: false, esPlato: true } }),
      prisma.listaMateriales.updateMany({
        where: { empresaId: ctx.auth.empresaId, productoId, tipo: "receta" },
        data: { activo: false },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al desactivar plato:", error)
    return NextResponse.json({ error: "Error al desactivar plato" }, { status: 500 })
  }
}
