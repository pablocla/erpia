/**
 * Toggle lista mayorista en POS (precio por bulto).
 */
import { prisma } from "@/lib/prisma"

export async function resolverListaMayorista(empresaId: number) {
  const lista = await prisma.listaPrecio.findFirst({
    where: {
      empresaId,
      activo: true,
      OR: [
        { nombre: { contains: "mayor", mode: "insensitive" } },
        { nombre: { contains: "bulto", mode: "insensitive" } },
        { nombre: { contains: "distrib", mode: "insensitive" } },
      ],
    },
    orderBy: { id: "asc" },
  })
  return lista ? { listaPrecioId: lista.id, nombre: lista.nombre } : null
}

export async function precioMayoristaProducto(
  empresaId: number,
  productoId: number,
  listaPrecioId: number,
) {
  const item = await prisma.itemListaPrecio.findFirst({
    where: { listaPrecioId, productoId, listaPrecio: { empresaId } },
  })
  if (!item) return null
  const escalon = await prisma.escalonPrecio.findFirst({
    where: { itemListaPrecioId: item.id },
    orderBy: { cantidadDesde: "asc" },
  })

  return {
    productoId,
    listaPrecioId,
    precio: Number(item.precio),
    cantidadMinima: escalon ? Number(escalon.cantidadDesde) : 1,
  }
}