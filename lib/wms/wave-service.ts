/**
 * Wave / olas de picking — agrupa listas o pedidos.
 */

import { prisma } from "@/lib/prisma"
import { generarPickingDirigido } from "./pick-service"

function nextNumero(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

export async function listarOlas(empresaId: number, estado?: string) {
  return prisma.olaPicking.findMany({
    where: { empresaId, ...(estado ? { estado } : {}) },
    include: {
      _count: { select: { listas: true, tareas: true } },
      deposito: { select: { id: true, codigo: true, nombre: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function crearOla(input: {
  empresaId: number
  depositoId: number
  criterio?: string
  carrier?: string
  cutoffAt?: string | null
  notas?: string
  pedidoVentaIds?: number[]
  listaPickingIds?: number[]
}) {
  const dep = await prisma.deposito.findFirst({
    where: { id: input.depositoId, empresaId: input.empresaId },
  })
  if (!dep) throw new Error("DEPOSITO_NO_ENCONTRADO")

  const ola = await prisma.olaPicking.create({
    data: {
      empresaId: input.empresaId,
      depositoId: input.depositoId,
      numero: nextNumero("OLA"),
      estado: "borrador",
      criterio: input.criterio ?? null,
      carrier: input.carrier ?? null,
      cutoffAt: input.cutoffAt ? new Date(input.cutoffAt) : null,
      notas: input.notas ?? null,
    },
  })

  const listaIds: number[] = [...(input.listaPickingIds ?? [])]

  for (const pedidoId of input.pedidoVentaIds ?? []) {
    const lista = await generarPickingDirigido(input.empresaId, pedidoId, input.depositoId)
    listaIds.push(lista.id)
  }

  if (listaIds.length) {
    await prisma.listaPicking.updateMany({
      where: { id: { in: listaIds }, empresaId: input.empresaId },
      data: { olaPickingId: ola.id },
    })
    await prisma.tareaWms.updateMany({
      where: {
        empresaId: input.empresaId,
        listaPickingId: { in: listaIds },
        tipo: "pick",
      },
      data: { olaPickingId: ola.id },
    })
  }

  return prisma.olaPicking.findUnique({
    where: { id: ola.id },
    include: {
      listas: { select: { id: true, numero: true, estado: true, pedidoVentaId: true } },
      _count: { select: { tareas: true } },
    },
  })
}

export async function liberarOla(empresaId: number, olaId: number) {
  const ola = await prisma.olaPicking.findFirst({
    where: { id: olaId, empresaId },
  })
  if (!ola) throw new Error("OLA_NO_ENCONTRADA")
  if (ola.estado === "cancelada") throw new Error("OLA_CANCELADA")

  await prisma.tareaWms.updateMany({
    where: { olaPickingId: olaId, estado: "pendiente" },
    data: { estado: "asignada" },
  })

  return prisma.olaPicking.update({
    where: { id: olaId },
    data: { estado: "liberada", liberadaAt: new Date() },
    include: {
      listas: true,
      tareas: {
        orderBy: { ordenPath: "asc" },
        include: {
          producto: { select: { codigo: true, nombre: true } },
          fromUbicacion: { select: { codigo: true } },
        },
      },
    },
  })
}
