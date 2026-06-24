import { prisma } from "@/lib/prisma"

export interface PosPluItem {
  id: number
  productoId: number
  orden: number
  color: string | null
  etiqueta: string | null
  nombre: string
  precioVenta: number
  stock: number
  codigo: string
}

const PLU_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
]

export async function listarPluPos(empresaId: number): Promise<PosPluItem[]> {
  const plus = await prisma.posPlu.findMany({
    where: { empresaId, activo: true },
    orderBy: { orden: "asc" },
    include: {
      producto: {
        select: {
          id: true,
          nombre: true,
          precioVenta: true,
          stock: true,
          codigo: true,
          activo: true,
        },
      },
    },
    take: 24,
  })

  if (plus.length > 0) {
    return plus
      .filter((p) => p.producto && p.producto.activo)
      .map((p) => ({
        id: p.id,
        productoId: p.productoId!,
        orden: p.orden,
        color: p.color,
        etiqueta: p.etiqueta,
        nombre: p.etiqueta ?? p.producto!.nombre,
        precioVenta: Number(p.producto!.precioVenta),
        stock: Number(p.producto!.stock),
        codigo: p.producto!.codigo,
      }))
  }

  // Fallback: primeros productos activos como PLU sugeridos
  const productos = await prisma.producto.findMany({
    where: { empresaId, activo: true },
    orderBy: { nombre: "asc" },
    take: 8,
    select: {
      id: true,
      nombre: true,
      precioVenta: true,
      stock: true,
      codigo: true,
    },
  })

  return productos.map((p, i) => ({
    id: -p.id,
    productoId: p.id,
    orden: i,
    color: PLU_COLORS[i % PLU_COLORS.length],
    etiqueta: null,
    nombre: p.nombre,
    precioVenta: Number(p.precioVenta),
    stock: Number(p.stock),
    codigo: p.codigo,
  }))
}

export async function guardarPluPos(
  empresaId: number,
  items: Array<{
    productoId: number
    orden?: number
    color?: string | null
    etiqueta?: string | null
  }>
) {
  await prisma.$transaction(async (tx) => {
    await tx.posPlu.deleteMany({ where: { empresaId } })

    if (items.length === 0) return

    await tx.posPlu.createMany({
      data: items.map((item, i) => ({
        empresaId,
        productoId: item.productoId,
        orden: item.orden ?? i,
        color: item.color ?? PLU_COLORS[i % PLU_COLORS.length],
        etiqueta: item.etiqueta ?? null,
        activo: true,
      })),
    })
  })

  return listarPluPos(empresaId)
}