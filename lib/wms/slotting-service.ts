/**
 * Slotting ABC simple + reposición pick-face (reglas livianas).
 */

import { prisma } from "@/lib/prisma"
import { classifyAbc } from "./fefo"
import { moverEntreUbicaciones } from "./stock-ubicacion-service"

/** Recalcula claseAbc de productos por unidades en líneas de factura (últimos N días). */
export async function recalcularAbc(empresaId: number, dias = 90) {
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)

  const lineas = await prisma.lineaFactura.findMany({
    where: {
      factura: { empresaId, createdAt: { gte: desde } },
      productoId: { not: null },
    },
    select: { productoId: true, cantidad: true },
  })

  const map = new Map<number, number>()
  for (const l of lineas) {
    if (!l.productoId) continue
    map.set(l.productoId, (map.get(l.productoId) ?? 0) + Number(l.cantidad))
  }

  const items = [...map.entries()].map(([productoId, unidades]) => ({ productoId, unidades }))
  const clases = classifyAbc(items)

  let updated = 0
  for (const [productoId, clase] of clases) {
    await prisma.producto.updateMany({
      where: { id: productoId, empresaId },
      data: { claseAbc: clase },
    })
    updated++
  }

  return { productosClasificados: updated, clases: Object.fromEntries(clases) }
}

/**
 * Sugiere mover fast movers (A) a bins de menor ordenPath (pick-face).
 * No ejecuta; solo recomienda.
 */
export async function sugerirReubicacionAbc(empresaId: number, depositoId: number) {
  const stocks = await prisma.stockUbicacion.findMany({
    where: {
      empresaId,
      depositoId,
      cantidad: { gt: 0 },
      producto: { claseAbc: "A" },
    },
    include: {
      producto: { select: { id: true, codigo: true, nombre: true, claseAbc: true } },
      ubicacion: { select: { id: true, codigo: true, ordenPath: true, tipo: true } },
    },
  })

  const pickFaces = await prisma.ubicacionAlmacen.findMany({
    where: {
      empresaId,
      depositoId,
      activo: true,
      tipo: "pick",
    },
    orderBy: { ordenPath: "asc" },
    take: 50,
  })

  const suggestions: Array<{
    productoId: number
    codigo: string
    from: string
    toSugerido: string
    motivo: string
  }> = []

  for (const s of stocks) {
    if (s.ubicacion.tipo === "pick" && s.ubicacion.ordenPath <= 10) continue
    const target = pickFaces.find((p) => p.id !== s.ubicacionId)
    if (!target) continue
    suggestions.push({
      productoId: s.productoId,
      codigo: s.producto.codigo,
      from: s.ubicacion.codigo,
      toSugerido: target.codigo,
      motivo: "Producto clase A lejos del pick-face",
    })
  }

  return suggestions
}

/** Reposición: mueve de bulk a pick si el pick está bajo mínimo */
export async function reponerPickFace(input: {
  empresaId: number
  depositoId: number
  productoId: number
  pickUbicacionId: number
  bulkUbicacionId: number
  cantidad: number
}) {
  return moverEntreUbicaciones({
    empresaId: input.empresaId,
    depositoId: input.depositoId,
    fromUbicacionId: input.bulkUbicacionId,
    toUbicacionId: input.pickUbicacionId,
    productoId: input.productoId,
    cantidad: input.cantidad,
    motivo: "Reposición pick-face",
  })
}
