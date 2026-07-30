/**
 * Handling Units — pallets / cajas / LPN
 */

import { prisma } from "@/lib/prisma"
import { ajustarStockUbicacion } from "./stock-ubicacion-service"

export async function listarHu(empresaId: number, depositoId?: number) {
  return prisma.handlingUnit.findMany({
    where: {
      empresaId,
      ...(depositoId ? { depositoId } : {}),
    },
    include: {
      ubicacion: { select: { id: true, codigo: true } },
      stocks: {
        where: { cantidad: { gt: 0 } },
        include: {
          producto: { select: { id: true, codigo: true, nombre: true } },
          lote: { select: { numeroLote: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
}

export async function crearHu(input: {
  empresaId: number
  depositoId: number
  codigo?: string
  tipo?: string
  ubicacionId?: number | null
  pesoKg?: number
}) {
  const codigo =
    input.codigo?.trim().toUpperCase() ||
    `LPN-${Date.now().toString(36).toUpperCase()}`

  return prisma.handlingUnit.create({
    data: {
      empresaId: input.empresaId,
      depositoId: input.depositoId,
      codigo,
      tipo: input.tipo ?? "pallet",
      ubicacionId: input.ubicacionId ?? null,
      pesoKg: input.pesoKg ?? null,
      estado: "abierta",
    },
  })
}

export async function cargarHu(input: {
  empresaId: number
  huId: number
  productoId: number
  cantidad: number
  loteId?: number | null
  fromUbicacionId?: number | null
}) {
  const hu = await prisma.handlingUnit.findFirst({
    where: { id: input.huId, empresaId: input.empresaId },
  })
  if (!hu) throw new Error("HU_NO_ENCONTRADA")
  if (hu.estado === "despachada") throw new Error("HU_DESPACHADA")

  const ubicacionId = hu.ubicacionId ?? input.fromUbicacionId
  if (!ubicacionId) throw new Error("HU_SIN_UBICACION")

  // Sacar de bin suelto si se indica origen
  if (input.fromUbicacionId) {
    await ajustarStockUbicacion({
      empresaId: input.empresaId,
      depositoId: hu.depositoId,
      ubicacionId: input.fromUbicacionId,
      productoId: input.productoId,
      loteId: input.loteId,
      cantidadDelta: -input.cantidad,
      tipo: "move",
      motivo: `Carga HU ${hu.codigo}`,
      syncDeposito: false,
      fromUbicacionId: input.fromUbicacionId,
      toUbicacionId: ubicacionId,
    })
  }

  await ajustarStockUbicacion({
    empresaId: input.empresaId,
    depositoId: hu.depositoId,
    ubicacionId,
    productoId: input.productoId,
    loteId: input.loteId,
    huId: hu.id,
    cantidadDelta: input.cantidad,
    tipo: "move",
    motivo: `En HU ${hu.codigo}`,
    syncDeposito: !input.fromUbicacionId,
    toUbicacionId: ubicacionId,
  })

  return prisma.handlingUnit.findUnique({
    where: { id: hu.id },
    include: { stocks: true, ubicacion: true },
  })
}

export async function cerrarHu(empresaId: number, huId: number) {
  const hu = await prisma.handlingUnit.findFirst({
    where: { id: huId, empresaId },
  })
  if (!hu) throw new Error("HU_NO_ENCONTRADA")
  return prisma.handlingUnit.update({
    where: { id: huId },
    data: { estado: "cerrada" },
  })
}
