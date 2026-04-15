/**
 * Picking Service — Warehouse picking list management
 */

import { prisma } from "@/lib/prisma"

export class PickingService {
  async listarListas(empresaId: number, filters: { estado?: string } = {}) {
    const where: Record<string, unknown> = { empresaId }
    if (filters.estado) where.estado = filters.estado

    return prisma.listaPicking.findMany({
      where,
      include: {
        _count: { select: { lineas: true } },
        pedidoVenta: { select: { id: true, numero: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  async obtenerLista(listaId: number) {
    return prisma.listaPicking.findUnique({
      where: { id: listaId },
      include: {
        lineas: {
          include: {
            producto: { select: { id: true, codigo: true, nombre: true, stock: true } },
          },
          orderBy: { ubicacion: "asc" },
        },
        pedidoVenta: true,
      },
    })
  }

  async generarDesdesPedido(empresaId: number, pedidoVentaId: number) {
    const pedido = await prisma.pedidoVenta.findFirst({
      where: { id: pedidoVentaId, empresaId },
      include: { lineas: { include: { producto: true } } },
    })
    if (!pedido) throw new Error("PEDIDO_NO_ENCONTRADO")

    return prisma.listaPicking.create({
      data: {
        empresaId,
        pedidoVentaId,
        numero: `PK-${Date.now()}`,
        estado: "pendiente",
        lineas: {
          create: pedido.lineas.map((l) => ({
            productoId: l.productoId,
            descripcion: l.descripcion ?? l.producto?.nombre ?? "",
            cantidadPedida: Number(l.cantidad),
            cantidadPicada: 0,
            ubicacion: null,
            estado: "pendiente",
          })),
        },
      },
      include: { lineas: true },
    })
  }

  async actualizarLineaPicking(lineaId: number, cantidadPicada: number) {
    const linea = await prisma.lineaPicking.update({
      where: { id: lineaId },
      data: {
        cantidadPicada,
        estado: "completo",
      },
      include: { lista: { include: { lineas: true } } },
    })

    // Check if all lines complete
    const todasCompletas = linea.lista.lineas.every(
      (l: { id: number; estado: string }) => l.id === lineaId || l.estado === "completo",
    )
    if (todasCompletas) {
      await prisma.listaPicking.update({
        where: { id: linea.listaId },
        data: { estado: "completada" },
      })
    }

    return linea
  }
}

export const pickingService = new PickingService()
