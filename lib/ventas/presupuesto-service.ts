/**
 * Presupuesto Service
 *
 * Full lifecycle: borrador → enviado → aceptado → rechazado → vencido → facturado
 * Conversion to PedidoVenta on acceptance.
 */

import { prisma } from "@/lib/prisma"
import { eventBus } from "@/lib/events/event-bus"
import { VentasService } from "@/lib/ventas/ventas-service"

export interface PresupuestoInput {
  clienteId: number
  empresaId: number
  vendedorId?: number
  listaPrecioId?: number
  condicionPagoId?: number
  fechaVencimiento?: string
  descuentoPct?: number
  observaciones?: string
  lineas: {
    productoId?: number
    descripcion: string
    cantidad: number
    precioUnitario: number
    descuentoPct?: number
  }[]
}

export class PresupuestoService {
  private ventasService = new VentasService()

  async crear(input: PresupuestoInput) {
    const ultimo = await prisma.presupuesto.findFirst({ orderBy: { id: "desc" } })
    const numero = `PRES-${String((ultimo?.id ?? 0) + 1).padStart(6, "0")}`

    let subtotal = 0
    const lineasData = input.lineas.map((l, i) => {
      const descPct = l.descuentoPct ?? 0
      const lineaSub = Number(l.cantidad) * Number(l.precioUnitario) * (1 - descPct / 100)
      subtotal += lineaSub
      return {
        productoId: l.productoId ?? null,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        descuentoPct: descPct,
        subtotal: lineaSub,
        orden: i + 1,
      }
    })

    const globalDesc = input.descuentoPct ?? 0
    const subtotalConDesc = subtotal * (1 - globalDesc / 100)
    const impuestos = subtotalConDesc * 0.21
    const total = subtotalConDesc + impuestos

    return prisma.presupuesto.create({
      data: {
        numero,
        fechaEmision: new Date(),
        fechaVencimiento: input.fechaVencimiento ? new Date(input.fechaVencimiento) : null,
        clienteId: input.clienteId,
        vendedorId: input.vendedorId ?? null,
        listaPrecioId: input.listaPrecioId ?? null,
        condicionPagoId: input.condicionPagoId ?? null,
        descuentoPct: globalDesc,
        observaciones: input.observaciones ?? null,
        subtotal,
        impuestos,
        total,
        estado: "borrador",
        empresaId: input.empresaId,
        lineas: { create: lineasData },
      },
      include: { lineas: true, cliente: true },
    })
  }

  async listar(filtros: { clienteId?: number; estado?: string; page?: number; limit?: number }) {
    const { clienteId, estado, page = 1, limit = 20 } = filtros
    const where: any = {}
    if (clienteId) where.clienteId = clienteId
    if (estado) where.estado = estado

    const [data, total] = await Promise.all([
      prisma.presupuesto.findMany({
        where,
        include: { lineas: true, cliente: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.presupuesto.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async obtener(id: number) {
    return prisma.presupuesto.findUnique({
      where: { id },
      include: { lineas: { include: { producto: true } }, cliente: true, vendedor: true, listaPrecio: true, condicionPago: true },
    })
  }

  async enviar(id: number) {
    const pres = await prisma.presupuesto.findUnique({ where: { id } })
    if (!pres) throw new Error("Presupuesto no encontrado")
    if (pres.estado !== "borrador") throw new Error(`No se puede enviar un presupuesto en estado '${pres.estado}'`)

    return prisma.presupuesto.update({
      where: { id },
      data: { estado: "enviado" },
      include: { lineas: true, cliente: true },
    })
  }

  async aceptar(id: number) {
    const pres = await prisma.presupuesto.findUnique({
      where: { id },
      include: { lineas: true },
    })
    if (!pres) throw new Error("Presupuesto no encontrado")
    if (pres.estado !== "enviado" && pres.estado !== "borrador") {
      throw new Error(`No se puede aceptar un presupuesto en estado '${pres.estado}'`)
    }

    const updated = await prisma.presupuesto.update({
      where: { id },
      data: { estado: "aceptado" },
      include: { lineas: true, cliente: true },
    })

    eventBus.emit({
      type: "PRESUPUESTO_APROBADO",
      payload: { presupuestoId: id, clienteId: pres.clienteId, total: Number(pres.total) },
      timestamp: new Date(),
    })

    return updated
  }

  async rechazar(id: number) {
    const pres = await prisma.presupuesto.findUnique({ where: { id } })
    if (!pres) throw new Error("Presupuesto no encontrado")
    if (pres.estado !== "enviado" && pres.estado !== "borrador") {
      throw new Error(`No se puede rechazar un presupuesto en estado '${pres.estado}'`)
    }

    return prisma.presupuesto.update({
      where: { id },
      data: { estado: "rechazado" },
      include: { lineas: true, cliente: true },
    })
  }

  /**
   * Convert accepted presupuesto → PedidoVenta
   * Transitions presupuesto to "facturado" (meaning it's been converted)
   */
  async convertirAPedido(id: number) {
    const pres = await prisma.presupuesto.findUnique({
      where: { id },
      include: { lineas: { include: { producto: true } } },
    })
    if (!pres) throw new Error("Presupuesto no encontrado")
    if (pres.estado !== "aceptado") {
      throw new Error(`Solo se pueden convertir presupuestos aceptados (estado actual: '${pres.estado}')`)
    }

    const pedido = await this.ventasService.crearPedidoVenta({
      clienteId: pres.clienteId,
      empresaId: pres.empresaId,
      vendedorId: pres.vendedorId ?? undefined,
      condicionPagoId: pres.condicionPagoId ?? undefined,
      observaciones: `Generado desde presupuesto ${pres.numero}`,
      lineas: pres.lineas.map((l) => ({
        productoId: l.productoId ?? undefined,
        descripcion: l.descripcion ?? l.producto?.nombre ?? "Producto",
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario),
      })),
    })

    await prisma.presupuesto.update({
      where: { id },
      data: { estado: "facturado" },
    })

    return pedido
  }

  async duplicar(id: number) {
    const pres = await prisma.presupuesto.findUnique({
      where: { id },
      include: { lineas: true },
    })
    if (!pres) throw new Error("Presupuesto no encontrado")

    return this.crear({
      clienteId: pres.clienteId,
      empresaId: pres.empresaId,
      vendedorId: pres.vendedorId ?? undefined,
      listaPrecioId: pres.listaPrecioId ?? undefined,
      condicionPagoId: pres.condicionPagoId ?? undefined,
      descuentoPct: Number(pres.descuentoPct),
      observaciones: `Duplicado de ${pres.numero}`,
      lineas: pres.lineas.map((l) => ({
        productoId: l.productoId ?? undefined,
        descripcion: l.descripcion ?? "",
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario),
        descuentoPct: Number(l.descuentoPct),
      })),
    })
  }
}

export const presupuestoService = new PresupuestoService()
