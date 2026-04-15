/**
 * Industria Service — Manufacturing, BOM, production orders
 */

import { prisma } from "@/lib/prisma"

export class IndustriaService {
  // ─── LISTAS DE MATERIALES (BOM) ───────────────────────────────────────────

  async listarBOM(empresaId: number, filters: { tipo?: string } = {}) {
    const where: Record<string, unknown> = { empresaId, activo: true }
    if (filters.tipo) where.tipo = filters.tipo

    return prisma.listaMateriales.findMany({
      where,
      include: {
        producto: { select: { id: true, nombre: true, codigo: true } },
        componentes: {
          include: { producto: { select: { id: true, nombre: true, codigo: true, stock: true } } },
        },
      },
      orderBy: { nombre: "asc" },
    })
  }

  async crearBOM(empresaId: number, data: {
    productoId: number
    nombre: string
    tipo?: string
    rendimiento?: number
    componentes: Array<{ productoId: number; cantidad: number; merma?: number }>
  }) {
    return prisma.listaMateriales.create({
      data: {
        empresaId,
        productoId: data.productoId,
        codigo: `BOM-${Date.now()}`,
        nombre: data.nombre,
        tipo: data.tipo ?? "produccion",
        componentes: {
          create: data.componentes.map((c) => ({
            productoId: c.productoId,
            cantidad: c.cantidad,
          })),
        },
      },
      include: { componentes: true },
    })
  }

  // ─── ÓRDENES DE PRODUCCIÓN ────────────────────────────────────────────────

  async listarOrdenesProduccion(empresaId: number, filters: { estado?: string } = {}) {
    const where: Record<string, unknown> = { empresaId }
    if (filters.estado) where.estado = filters.estado

    return prisma.ordenProduccion.findMany({
      where,
      include: {
        bom: {
          select: { id: true, nombre: true },
        },
        producto: { select: { id: true, nombre: true, codigo: true } },
      },
      orderBy: { fechaInicio: "desc" },
    })
  }

  async crearOrdenProduccion(empresaId: number, data: {
    listaMaterialesId: number
    productoId: number
    cantidad: number
    fechaInicio: string
    fechaFinEstimada?: string
    observaciones?: string
  }) {
    return prisma.ordenProduccion.create({
      data: {
        empresaId,
        numero: `OP-${Date.now()}`,
        bomId: data.listaMaterialesId,
        productoId: data.productoId,
        cantidad: data.cantidad,
        fechaInicio: new Date(data.fechaInicio),
        fechaFinPlan: data.fechaFinEstimada ? new Date(data.fechaFinEstimada) : undefined,
        observaciones: data.observaciones,
        estado: "borrador",
      },
    })
  }

  async actualizarEstadoOP(ordenId: number, estado: string) {
    const data: Record<string, unknown> = { estado }
    if (estado === "completada") data.fechaFinReal = new Date()

    return prisma.ordenProduccion.update({
      where: { id: ordenId },
      data,
    })
  }

  async ejecutarOrdenProduccion(ordenId: number) {
    const orden = await prisma.ordenProduccion.findUnique({
      where: { id: ordenId },
      include: {
        bom: { include: { componentes: true } },
      },
    })
    if (!orden) throw new Error("OP_NO_ENCONTRADA")
    if (orden.estado !== "borrador" && orden.estado !== "en_proceso") {
      throw new Error("OP_ESTADO_INVALIDO")
    }

    const { stockService } = await import("@/lib/stock/stock-service")

    // Consume materials
    if (orden.bom) {
      for (const comp of orden.bom.componentes) {
        if (!comp.productoId) continue
        const cantidadNecesaria = Number(comp.cantidad) * orden.cantidad
        await stockService.ajustarStockManual(
          comp.productoId,
          -cantidadNecesaria,
          `OP #${ordenId} - Consumo producción`,
        )
      }
    }

    // Produce finished goods
    await stockService.ajustarStockManual(
      orden.productoId ?? 0,
      orden.cantidad,
      `OP #${ordenId} - Producción terminada`,
    )

    return prisma.ordenProduccion.update({
      where: { id: ordenId },
      data: { estado: "terminada", fechaFinReal: new Date() },
    })
  }
}

export const industriaService = new IndustriaService()
