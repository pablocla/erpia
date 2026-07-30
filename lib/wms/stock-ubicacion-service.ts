/**
 * Stock por bin + movimientos de ubicación.
 * Mantiene coherencia con StockDeposito cuando se solicita.
 */

import { prisma } from "@/lib/prisma"
import type { TipoMovUbicacion } from "./types"

async function syncStockDeposito(
  empresaId: number,
  depositoId: number,
  productoId: number,
  delta: number,
) {
  const existing = await prisma.stockDeposito.findUnique({
    where: { productoId_depositoId: { productoId, depositoId } },
  })
  if (existing) {
    await prisma.stockDeposito.update({
      where: { id: existing.id },
      data: { cantidad: Math.max(0, existing.cantidad + delta) },
    })
  } else if (delta > 0) {
    await prisma.stockDeposito.create({
      data: { productoId, depositoId, cantidad: delta, reservado: 0 },
    })
  }

  const prod = await prisma.producto.findFirst({
    where: { id: productoId, empresaId },
    select: { stock: true },
  })
  if (prod) {
    await prisma.producto.update({
      where: { id: productoId },
      data: { stock: Math.max(0, (prod.stock ?? 0) + delta) },
    })
  }
}

export async function listarStockUbicacion(
  empresaId: number,
  filters: { depositoId?: number; productoId?: number; ubicacionId?: number } = {},
) {
  return prisma.stockUbicacion.findMany({
    where: {
      empresaId,
      cantidad: { gt: 0 },
      ...(filters.depositoId ? { depositoId: filters.depositoId } : {}),
      ...(filters.productoId ? { productoId: filters.productoId } : {}),
      ...(filters.ubicacionId ? { ubicacionId: filters.ubicacionId } : {}),
    },
    include: {
      ubicacion: { select: { id: true, codigo: true, ordenPath: true, tipo: true } },
      producto: { select: { id: true, codigo: true, nombre: true, claseAbc: true } },
      lote: { select: { id: true, numeroLote: true, fechaVencimiento: true, estado: true } },
      hu: { select: { id: true, codigo: true, tipo: true } },
    },
    orderBy: [{ productoId: "asc" }, { ubicacionId: "asc" }],
  })
}

export async function ajustarStockUbicacion(input: {
  empresaId: number
  depositoId: number
  ubicacionId: number
  productoId: number
  loteId?: number | null
  huId?: number | null
  cantidadDelta: number
  tipo: TipoMovUbicacion
  motivo?: string
  tareaWmsId?: number
  createdBy?: number
  syncDeposito?: boolean
  fromUbicacionId?: number | null
  toUbicacionId?: number | null
}) {
  const {
    empresaId,
    depositoId,
    ubicacionId,
    productoId,
    loteId = null,
    huId = null,
    cantidadDelta,
    tipo,
    motivo,
    tareaWmsId,
    createdBy,
    syncDeposito = true,
    fromUbicacionId,
    toUbicacionId,
  } = input

  if (cantidadDelta === 0) return null

  // Prisma unique with nulls: find first matching row
  const rows = await prisma.stockUbicacion.findMany({
    where: {
      ubicacionId,
      productoId,
      loteId: loteId ?? null,
      huId: huId ?? null,
    },
    take: 5,
  })
  let row = rows.find((r) => r.loteId === (loteId ?? null) && r.huId === (huId ?? null)) ?? null

  if (!row) {
    if (cantidadDelta < 0) throw new Error("STOCK_UBICACION_INSUFICIENTE")
    row = await prisma.stockUbicacion.create({
      data: {
        empresaId,
        depositoId,
        ubicacionId,
        productoId,
        loteId,
        huId,
        cantidad: cantidadDelta,
        reservado: 0,
      },
    })
  } else {
    const next = row.cantidad + cantidadDelta
    if (next < -0.0001) throw new Error("STOCK_UBICACION_INSUFICIENTE")
    row = await prisma.stockUbicacion.update({
      where: { id: row.id },
      data: { cantidad: Math.max(0, next) },
    })
  }

  await prisma.movimientoUbicacion.create({
    data: {
      empresaId,
      depositoId,
      tipo,
      productoId,
      loteId,
      cantidad: Math.abs(cantidadDelta),
      fromUbicacionId: fromUbicacionId ?? (cantidadDelta < 0 ? ubicacionId : null),
      toUbicacionId: toUbicacionId ?? (cantidadDelta > 0 ? ubicacionId : null),
      tareaWmsId: tareaWmsId ?? null,
      motivo: motivo ?? null,
      createdBy: createdBy ?? null,
    },
  })

  if (syncDeposito) {
    await syncStockDeposito(empresaId, depositoId, productoId, cantidadDelta)
  }

  return row
}

export async function moverEntreUbicaciones(input: {
  empresaId: number
  depositoId: number
  fromUbicacionId: number
  toUbicacionId: number
  productoId: number
  loteId?: number | null
  cantidad: number
  motivo?: string
  createdBy?: number
}) {
  const { cantidad, ...rest } = input
  if (cantidad <= 0) throw new Error("CANTIDAD_INVALIDA")

  await ajustarStockUbicacion({
    ...rest,
    ubicacionId: input.fromUbicacionId,
    cantidadDelta: -cantidad,
    tipo: "move",
    syncDeposito: false,
    fromUbicacionId: input.fromUbicacionId,
    toUbicacionId: input.toUbicacionId,
  })
  await ajustarStockUbicacion({
    ...rest,
    ubicacionId: input.toUbicacionId,
    cantidadDelta: cantidad,
    tipo: "move",
    syncDeposito: false,
    fromUbicacionId: input.fromUbicacionId,
    toUbicacionId: input.toUbicacionId,
  })

  return { ok: true as const }
}

export async function candidatesParaPick(
  empresaId: number,
  depositoId: number,
  productoId: number,
) {
  const rows = await prisma.stockUbicacion.findMany({
    where: {
      empresaId,
      depositoId,
      productoId,
      cantidad: { gt: 0 },
      ubicacion: { activo: true, tipo: { in: ["pick", "bin", "bulk"] } },
    },
    include: {
      ubicacion: { select: { id: true, codigo: true, ordenPath: true } },
      lote: { select: { id: true, fechaVencimiento: true, estado: true } },
    },
  })

  return rows
    .filter((r) => !r.lote || r.lote.estado === "activo")
    .map((r) => ({
      stockUbicacionId: r.id,
      ubicacionId: r.ubicacionId,
      codigoUbicacion: r.ubicacion.codigo,
      ordenPath: r.ubicacion.ordenPath,
      productoId: r.productoId,
      loteId: r.loteId,
      fechaVencimiento: r.lote?.fechaVencimiento ?? null,
      cantidadDisponible: Math.max(0, r.cantidad - r.reservado),
    }))
}
