/**
 * Picking Service — Warehouse picking list management
 * Integra WMS light (bins + FEFO) cuando hay ubicaciones configuradas.
 */

import { prisma } from "@/lib/prisma"
import { generarPickingDirigido, confirmarPickLinea } from "@/lib/wms/pick-service"

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
            ubicacionRef: { select: { id: true, codigo: true } },
            lote: { select: { id: true, numeroLote: true, fechaVencimiento: true } },
          },
          orderBy: [{ ordenPath: "asc" }, { ubicacion: "asc" }],
        },
        pedidoVenta: true,
      },
    })
  }

  async generarDesdesPedido(empresaId: number, pedidoVentaId: number, depositoId?: number) {
    // Si hay layout WMS, usar picking dirigido FEFO
    const tieneUbicaciones = await prisma.ubicacionAlmacen.count({
      where: { empresaId, activo: true },
    })
    if (tieneUbicaciones > 0) {
      return generarPickingDirigido(empresaId, pedidoVentaId, depositoId)
    }

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
            ubicacion: l.producto?.ubicacionDeposito ?? null,
            estado: "pendiente",
          })),
        },
      },
      include: { lineas: true },
    })
  }

  async actualizarLineaPicking(
    lineaId: number,
    cantidadPicada: number,
    opts?: { empresaId?: number; operarioNombre?: string; createdBy?: number },
  ) {
    // Si la línea tiene bin WMS y conocemos empresa, descontar stock de ubicación
    if (opts?.empresaId) {
      return confirmarPickLinea({
        empresaId: opts.empresaId,
        lineaId,
        cantidadPicada,
        operarioNombre: opts.operarioNombre,
        createdBy: opts.createdBy,
      })
    }

    const linea = await prisma.lineaPicking.update({
      where: { id: lineaId },
      data: {
        cantidadPicada,
        estado: cantidadPicada + 0.0001 >= 0 ? "completo" : "pendiente",
      },
      include: { lista: { include: { lineas: true } } },
    })

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
