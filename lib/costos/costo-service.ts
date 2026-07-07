/**
 * Motor de costeo — Sprint B4
 * PPP (precio promedio ponderado) y último precio de reposición.
 */

import { prisma } from "@/lib/prisma"
import { getParametro } from "@/lib/config/parametro-service"

export type MetodoCosto = "ppp" | "ultimo" | "fifo"

const METODO_FALLBACK: MetodoCosto = "ppp"

export async function getMetodoCosto(empresaId: number): Promise<MetodoCosto> {
  const raw = await getParametro(empresaId, "metodo_costo", 0)
  if (raw === 2) return "fifo"
  if (raw === 1) return "ultimo"
  return METODO_FALLBACK
}

/**
 * Costo unitario vigente para una venta según método configurado.
 * `precioCompra` del producto almacena el PPP actualizado en cada compra.
 */
export async function obtenerCostoUnitarioVenta(
  productoId: number,
  empresaId: number,
): Promise<{ historico: number; reposicion: number }> {
  const producto = await prisma.producto.findFirst({
    where: { id: productoId, empresaId },
    select: { precioCompra: true, precioVenta: true },
  })
  if (!producto) return { historico: 0, reposicion: 0 }

  const ppp = Number(producto.precioCompra ?? 0)
  const ultimo = await obtenerUltimoPrecioCompra(productoId, empresaId, ppp)
  const metodo = await getMetodoCosto(empresaId)

  const historico = metodo === "ultimo" ? ultimo : ppp
  return { historico, reposicion: ultimo }
}

async function obtenerUltimoPrecioCompra(
  productoId: number,
  empresaId: number,
  fallback: number,
): Promise<number> {
  const linea = await prisma.lineaCompra.findFirst({
    where: {
      productoId,
      compra: { empresaId },
    },
    orderBy: { compra: { fecha: "desc" } },
    select: { precioUnitario: true },
  })
  return linea ? Number(linea.precioUnitario) : fallback
}

/**
 * Recalcula PPP al registrar una compra (antes del incremento de stock).
 * Fórmula: (stock_actual × ppp + cantidad × precio) / (stock_actual + cantidad)
 */
export async function actualizarPppPorCompra(
  productoId: number,
  cantidadIngreso: number,
  precioUnitario: number,
  empresaId: number,
): Promise<number> {
  if (cantidadIngreso <= 0) return 0

  const producto = await prisma.producto.findFirst({
    where: { id: productoId, empresaId },
    select: { id: true, stock: true, precioCompra: true },
  })
  if (!producto) return 0

  const stockActual = Math.max(0, producto.stock)
  const pppActual = Number(producto.precioCompra ?? 0)
  const metodo = await getMetodoCosto(empresaId)

  let nuevoPpp: number
  if (metodo === "ultimo") {
    nuevoPpp = precioUnitario
  } else if (stockActual + cantidadIngreso <= 0) {
    nuevoPpp = precioUnitario
  } else {
    nuevoPpp =
      (stockActual * pppActual + cantidadIngreso * precioUnitario) /
      (stockActual + cantidadIngreso)
  }

  await prisma.producto.update({
    where: { id: productoId },
    data: { precioCompra: nuevoPpp },
  })

  return nuevoPpp
}

/**
 * Persiste snapshot de costo en líneas de factura (para CMV, BI y auditoría).
 */
export async function snapshotCostosEnFactura(facturaId: number): Promise<void> {
  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: { lineas: true },
  })
  if (!factura) return

  for (const linea of factura.lineas) {
    if (!linea.productoId) continue
    const { historico, reposicion } = await obtenerCostoUnitarioVenta(
      linea.productoId,
      factura.empresaId,
    )
    await prisma.lineaFactura.update({
      where: { id: linea.id },
      data: {
        costoUnitarioHistorico: historico,
        costoUnitarioReposicion: reposicion,
      },
    })
  }
}

/**
 * Total CMV de una factura usando costos ya snapshoteados en líneas.
 */
export async function calcularCmvFactura(facturaId: number): Promise<number> {
  const lineas = await prisma.lineaFactura.findMany({
    where: { facturaId, productoId: { not: null } },
    select: { cantidad: true, costoUnitarioHistorico: true, productoId: true },
  })

  let total = 0
  for (const linea of lineas) {
    const costo = Number(linea.costoUnitarioHistorico ?? 0)
    total += costo * linea.cantidad
  }
  return total
}

/**
 * CMV proporcional a revertir en nota de crédito (B4.5).
 */
export async function calcularCmvNotaCredito(ncId: number): Promise<number> {
  const nc = await prisma.notaCredito.findUnique({
    where: { id: ncId },
    include: {
      lineas: true,
      factura: { include: { lineas: true } },
    },
  })
  if (!nc?.factura) return 0

  const lineasNc =
    nc.lineas.length > 0
      ? nc.lineas
      : nc.factura.lineas.map((l) => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          costoUnitarioHistorico: l.costoUnitarioHistorico,
        }))

  let total = 0
  for (const linea of lineasNc) {
    if (!linea.productoId) continue
    const costo = Number(
      "costoUnitarioHistorico" in linea && linea.costoUnitarioHistorico != null
        ? linea.costoUnitarioHistorico
        : 0,
    )
    if (costo <= 0) {
      const snap = await obtenerCostoUnitarioVenta(linea.productoId, nc.factura.empresaId)
      total += snap.historico * linea.cantidad
    } else {
      total += costo * linea.cantidad
    }
  }
  return total
}

export class CostoService {
  getMetodoCosto = getMetodoCosto
  actualizarPppPorCompra = actualizarPppPorCompra
  snapshotCostosEnFactura = snapshotCostosEnFactura
  calcularCmvFactura = calcularCmvFactura
  calcularCmvNotaCredito = calcularCmvNotaCredito
  obtenerCostoUnitarioVenta = obtenerCostoUnitarioVenta
}

export const costoService = new CostoService()