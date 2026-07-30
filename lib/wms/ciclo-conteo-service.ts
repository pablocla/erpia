/**
 * Conteo cíclico ABC por ubicación
 */

import { prisma } from "@/lib/prisma"
import { ajustarStockUbicacion } from "./stock-ubicacion-service"

function nextNumero(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

export async function crearConteoCiclico(input: {
  empresaId: number
  depositoId: number
  claseAbc?: string
}) {
  const clase = input.claseAbc ?? "todas"

  const stocks = await prisma.stockUbicacion.findMany({
    where: {
      empresaId: input.empresaId,
      depositoId: input.depositoId,
      cantidad: { gt: 0 },
      ...(clase !== "todas"
        ? { producto: { claseAbc: clase } }
        : {}),
    },
    include: {
      producto: { select: { id: true, codigo: true, nombre: true, claseAbc: true } },
      ubicacion: { select: { id: true, codigo: true } },
    },
  })

  const conteo = await prisma.conteoCiclico.create({
    data: {
      empresaId: input.empresaId,
      depositoId: input.depositoId,
      numero: nextNumero("CC"),
      claseAbc: clase,
      estado: "borrador",
      lineas: {
        create: stocks.map((s) => ({
          ubicacionId: s.ubicacionId,
          productoId: s.productoId,
          stockSistema: s.cantidad,
        })),
      },
    },
    include: {
      lineas: {
        include: {
          producto: { select: { codigo: true, nombre: true } },
          ubicacion: { select: { codigo: true } },
        },
      },
    },
  })

  return conteo
}

export async function cargarConteo(
  empresaId: number,
  conteoId: number,
  items: Array<{ lineaId: number; stockContado: number; observaciones?: string }>,
) {
  const conteo = await prisma.conteoCiclico.findFirst({
    where: { id: conteoId, empresaId },
  })
  if (!conteo) throw new Error("CONTEO_NO_ENCONTRADO")

  if (conteo.estado === "borrador") {
    await prisma.conteoCiclico.update({
      where: { id: conteoId },
      data: { estado: "en_conteo" },
    })
  }

  for (const item of items) {
    const linea = await prisma.lineaConteoCiclico.findFirst({
      where: { id: item.lineaId, conteoId },
    })
    if (!linea) continue
    await prisma.lineaConteoCiclico.update({
      where: { id: linea.id },
      data: {
        stockContado: item.stockContado,
        diferencia: item.stockContado - linea.stockSistema,
        observaciones: item.observaciones ?? null,
      },
    })
  }

  return prisma.conteoCiclico.findUnique({
    where: { id: conteoId },
    include: { lineas: true },
  })
}

export async function cerrarConteo(empresaId: number, conteoId: number, aplicarAjustes = true) {
  const conteo = await prisma.conteoCiclico.findFirst({
    where: { id: conteoId, empresaId },
    include: { lineas: true },
  })
  if (!conteo) throw new Error("CONTEO_NO_ENCONTRADO")

  if (aplicarAjustes) {
    for (const l of conteo.lineas) {
      if (l.stockContado == null || l.diferencia == null || l.diferencia === 0) continue
      await ajustarStockUbicacion({
        empresaId,
        depositoId: conteo.depositoId,
        ubicacionId: l.ubicacionId,
        productoId: l.productoId,
        cantidadDelta: l.diferencia,
        tipo: "ajuste",
        motivo: `Conteo cíclico ${conteo.numero}`,
        syncDeposito: true,
      })
    }
  }

  return prisma.conteoCiclico.update({
    where: { id: conteoId },
    data: { estado: "cerrado", closedAt: new Date() },
    include: { lineas: true },
  })
}

export async function listarConteos(empresaId: number) {
  return prisma.conteoCiclico.findMany({
    where: { empresaId },
    include: { _count: { select: { lineas: true } }, deposito: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}
