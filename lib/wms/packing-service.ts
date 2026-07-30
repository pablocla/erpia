/**
 * Packing station — lista de empaque + bultos + datos de etiqueta.
 */

import { prisma } from "@/lib/prisma"

function nextNumero(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

export async function crearPackingDesdePedido(
  empresaId: number,
  pedidoVentaId: number,
  opts: { listaPickingId?: number; depositoId?: number } = {},
) {
  const pedido = await prisma.pedidoVenta.findFirst({
    where: { id: pedidoVentaId, empresaId },
    include: { lineas: { include: { producto: true } } },
  })
  if (!pedido) throw new Error("PEDIDO_NO_ENCONTRADO")

  return prisma.packingList.create({
    data: {
      empresaId,
      depositoId: opts.depositoId ?? null,
      numero: nextNumero("PKL"),
      pedidoVentaId,
      listaPickingId: opts.listaPickingId ?? null,
      estado: "borrador",
      bultos: 1,
      lineas: {
        create: pedido.lineas.map((l) => ({
          productoId: l.productoId,
          descripcion: l.descripcion ?? l.producto?.nombre ?? "Ítem",
          cantidad: Number(l.cantidad),
          bultoNumero: 1,
        })),
      },
      bultosDetalle: {
        create: [{ numero: 1 }],
      },
    },
    include: { lineas: true, bultosDetalle: true },
  })
}

export async function actualizarBultos(
  empresaId: number,
  packingListId: number,
  data: {
    bultos?: number
    pesoKg?: number
    dimensiones?: string
    carrierId?: string
    tracking?: string
    etiquetaUrl?: string
    bultosDetalle?: Array<{
      numero: number
      pesoKg?: number
      largoCm?: number
      anchoCm?: number
      altoCm?: number
      etiquetaUrl?: string
      tracking?: string
    }>
  },
) {
  const pl = await prisma.packingList.findFirst({
    where: { id: packingListId, empresaId },
  })
  if (!pl) throw new Error("PACKING_NO_ENCONTRADO")

  if (data.bultosDetalle?.length) {
    for (const b of data.bultosDetalle) {
      await prisma.packingBulto.upsert({
        where: {
          packingListId_numero: { packingListId, numero: b.numero },
        },
        create: {
          packingListId,
          numero: b.numero,
          pesoKg: b.pesoKg,
          largoCm: b.largoCm,
          anchoCm: b.anchoCm,
          altoCm: b.altoCm,
          etiquetaUrl: b.etiquetaUrl,
          tracking: b.tracking,
        },
        update: {
          pesoKg: b.pesoKg,
          largoCm: b.largoCm,
          anchoCm: b.anchoCm,
          altoCm: b.altoCm,
          etiquetaUrl: b.etiquetaUrl,
          tracking: b.tracking,
        },
      })
    }
  }

  return prisma.packingList.update({
    where: { id: packingListId },
    data: {
      bultos: data.bultos ?? data.bultosDetalle?.length ?? pl.bultos,
      pesoKg: data.pesoKg ?? pl.pesoKg,
      dimensiones: data.dimensiones ?? pl.dimensiones,
      carrierId: data.carrierId ?? pl.carrierId,
      tracking: data.tracking ?? pl.tracking,
      etiquetaUrl: data.etiquetaUrl ?? pl.etiquetaUrl,
      estado: "en_packing",
    },
    include: { lineas: true, bultosDetalle: true },
  })
}

export async function cerrarPacking(empresaId: number, packingListId: number) {
  const pl = await prisma.packingList.findFirst({
    where: { id: packingListId, empresaId },
  })
  if (!pl) throw new Error("PACKING_NO_ENCONTRADO")

  return prisma.packingList.update({
    where: { id: packingListId },
    data: { estado: "cerrada" },
    include: { lineas: true, bultosDetalle: true },
  })
}

export async function listarPacking(empresaId: number, estado?: string) {
  return prisma.packingList.findMany({
    where: { empresaId, ...(estado ? { estado } : {}) },
    include: {
      lineas: true,
      bultosDetalle: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
}
