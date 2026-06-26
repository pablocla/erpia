/**
 * Inventario express — conteo rápido por categoría.
 */
import { prisma } from "@/lib/prisma"
import { TomaInventarioService } from "@/lib/stock/toma-inventario-service"

const tomaService = new TomaInventarioService()

export async function iniciarInventarioExpress(empresaId: number, categoriaId?: number) {
  const deposito = await prisma.deposito.findFirst({
    where: { empresaId, activo: true },
    orderBy: { id: "asc" },
  })
  if (!deposito) throw new Error("No hay depósito activo")

  const { id, numero } = await tomaService.crear(deposito.id, empresaId)

  if (categoriaId) {
    const lineasRaw = await prisma.lineaTomaInventario.findMany({
      where: { tomaInventarioId: id },
      select: { id: true, productoId: true, stockSistema: true },
    })
    const productos = await prisma.producto.findMany({
      where: { id: { in: lineasRaw.map((l) => l.productoId) }, categoriaId },
      select: { id: true, nombre: true, codigo: true },
    })
    const ids = new Set(productos.map((p) => p.id))
    const prodMap = Object.fromEntries(productos.map((p) => [p.id, p]))
    const lineas = lineasRaw
      .filter((l) => ids.has(l.productoId))
      .map((l) => ({
        id: l.id,
        stockSistema: l.stockSistema,
        producto: prodMap[l.productoId],
      }))
    return { tomaId: id, numero, lineas: lineas.length, productos: lineas }
  }

  const count = await prisma.lineaTomaInventario.count({ where: { tomaInventarioId: id } })
  return { tomaId: id, numero, lineas: count }
}

export async function registrarConteoExpress(
  empresaId: number,
  tomaId: number,
  conteos: Array<{ lineaId: number; stockContado: number }>,
) {
  await tomaService.cargarConteo(
    tomaId,
    empresaId,
    conteos.map((c) => ({ lineaId: c.lineaId, stockContado: c.stockContado })),
  )
  return { ok: true, registrados: conteos.length }
}

export async function cerrarInventarioExpress(empresaId: number, tomaId: number) {
  const r = await tomaService.procesar(tomaId, empresaId)
  return { tomaId, ajustesGenerados: r.ajustesGenerados }
}