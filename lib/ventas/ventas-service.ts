/**
 * Ventas Service — PedidoVenta → Picking → Remito → Factura flow
 *
 * State machine: borrador → confirmado → en_picking → remitido → facturado → anulado
 *
 * 1. crearPedidoVenta()    — borrador with client, lines, condición pago
 * 2. confirmarPedido()      — locks prices, emits for picking
 * 3. generarListaPicking()  — creates picking list from pedido lines
 * 4. generarRemito()        — creates remito, updates cantidadEntregada, decrements stock
 * 5. facturarPedido()       — (external) creates factura from pedido, transitions to facturado
 */

import { prisma } from "@/lib/prisma"
import { eventBus } from "@/lib/events/event-bus"
import type { RemitoEmitidoPayload } from "@/lib/events/types"

export interface PedidoVentaInput {
  clienteId: number
  empresaId: number
  vendedorId?: number
  condicionPagoId?: number
  canalVentaId?: number
  fechaEntregaEst?: Date
  observaciones?: string
  lineas: {
    productoId?: number
    descripcion: string
    cantidad: number
    precioUnitario: number
  }[]
}

export class VentasService {
  async crearPedidoVenta(input: PedidoVentaInput) {
    const {
      clienteId,
      empresaId,
      vendedorId,
      condicionPagoId,
      canalVentaId,
      fechaEntregaEst,
      observaciones,
      lineas,
    } = input

    // Auto-number
    const ultimo = await prisma.pedidoVenta.findFirst({ orderBy: { id: "desc" } })
    const numero = `PV-${String((ultimo?.id ?? 0) + 1).padStart(6, "0")}`

    let subtotal = 0
    const lineasData = lineas.map((l, i) => {
      const lineaSubtotal = l.cantidad * l.precioUnitario
      subtotal += lineaSubtotal
      return {
        productoId: l.productoId ?? null,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        subtotal: lineaSubtotal,
        orden: i + 1,
      }
    })

    // Estimate 21% IVA
    const impuestos = subtotal * 0.21
    const total = subtotal + impuestos

    const pedido = await prisma.pedidoVenta.create({
      data: {
        numero,
        fechaEmision: new Date(),
        fechaEntregaEst: fechaEntregaEst ?? null,
        subtotal,
        impuestos,
        total,
        estado: "borrador",
        observaciones,
        clienteId,
        vendedorId: vendedorId ?? null,
        condicionPagoId: condicionPagoId ?? null,
        canalVentaId: canalVentaId ?? null,
        empresaId,
        lineas: { create: lineasData },
      },
      include: { lineas: true, cliente: true },
    })

    return pedido
  }

  async confirmarPedido(pedidoId: number) {
    const pedido = await prisma.pedidoVenta.findUnique({
      where: { id: pedidoId },
      include: { lineas: true },
    })
    if (!pedido) throw new Error("Pedido no encontrado")
    if (pedido.estado !== "borrador") throw new Error(`Pedido en estado '${pedido.estado}', se requiere 'borrador'`)

    // Reserve stock for each product line
    for (const linea of pedido.lineas) {
      if (!linea.productoId) continue
      // Find default deposit stock record
      const stock = await prisma.stockDeposito.findFirst({
        where: { productoId: linea.productoId },
      })
      if (stock) {
        const disponible = stock.cantidad - stock.reservado
        if (disponible < Number(linea.cantidad)) {
          throw new Error(
            `Stock insuficiente para "${linea.descripcion}": disponible ${disponible}, pedido ${Number(linea.cantidad)}`,
          )
        }
        await prisma.stockDeposito.update({
          where: { id: stock.id },
          data: { reservado: { increment: Number(linea.cantidad) } },
        })
      }
    }

    return prisma.pedidoVenta.update({
      where: { id: pedidoId },
      data: { estado: "confirmado" },
      include: { lineas: true, cliente: true },
    })
  }

  async generarListaPicking(pedidoId: number) {
    const pedido = await prisma.pedidoVenta.findUnique({
      where: { id: pedidoId },
      include: { lineas: { include: { producto: true } } },
    })
    if (!pedido) throw new Error("Pedido no encontrado")
    if (pedido.estado !== "confirmado") throw new Error(`Pedido en estado '${pedido.estado}', se requiere 'confirmado'`)

    const ultimaPicking = await prisma.listaPicking.findFirst({ orderBy: { id: "desc" } })
    const numeroPicking = `PK-${String((ultimaPicking?.id ?? 0) + 1).padStart(6, "0")}`

    const picking = await prisma.listaPicking.create({
      data: {
        numero: numeroPicking,
        estado: "pendiente",
        prioridad: "normal",
        empresaId: pedido.empresaId,
        pedidoVentaId: pedido.id,
        lineas: {
          create: pedido.lineas
            .filter((l) => l.productoId != null)
            .map((l) => ({
              descripcion: l.descripcion ?? l.producto?.nombre ?? "",
              cantidadPedida: Number(l.cantidad),
              productoId: l.productoId,
            })),
        },
      },
      include: { lineas: true },
    })

    await prisma.pedidoVenta.update({
      where: { id: pedidoId },
      data: { estado: "en_picking" },
    })

    return picking
  }

  async generarRemito(pedidoId: number, depositoId?: number) {
    const pedido = await prisma.pedidoVenta.findUnique({
      where: { id: pedidoId },
      include: { lineas: { include: { producto: true } }, cliente: true },
    })
    if (!pedido) throw new Error("Pedido no encontrado")
    if (!["confirmado", "en_picking"].includes(pedido.estado)) {
      throw new Error(`Pedido en estado '${pedido.estado}', se requiere 'confirmado' o 'en_picking'`)
    }

    // Auto-number remito
    const ultimoRemito = await prisma.remito.findFirst({ orderBy: { numero: "desc" } })
    const numeroRemito = (ultimoRemito?.numero ?? 0) + 1

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create remito
      const remito = await tx.remito.create({
        data: {
          numero: numeroRemito,
          clienteId: pedido.clienteId,
          estado: "pendiente",
          empresaId: pedido.empresaId,
          pedidoVentaId: pedido.id,
          lineas: {
            create: pedido.lineas.map((l) => ({
              descripcion: l.descripcion ?? l.producto?.nombre ?? "",
              cantidad: Number(l.cantidad),
              productoId: l.productoId ?? null,
            })),
          },
        },
        include: { lineas: true },
      })

      await tx.listaPicking.updateMany({
        where: { pedidoVentaId: pedidoId, remitoId: null },
        data: { remitoId: remito.id },
      })

      // 2. Update cantidadEntregada in pedido lines + release reservation
      for (const linea of pedido.lineas) {
        const pendiente = Number(linea.cantidad) - Number(linea.cantidadEntregada)
        if (pendiente <= 0) continue
        await tx.lineaPedidoVenta.update({
          where: { id: linea.id },
          data: { cantidadEntregada: Number(linea.cantidad) },
        })
        // Release reserved stock (actual decrement happens via REMITO_EMITIDO event)
        if (linea.productoId) {
          const stock = await tx.stockDeposito.findFirst({
            where: { productoId: linea.productoId },
          })
          if (stock && stock.reservado > 0) {
            await tx.stockDeposito.update({
              where: { id: stock.id },
              data: { reservado: { decrement: Math.min(pendiente, stock.reservado) } },
            })
          }
        }
      }

      // 3. Transition pedido
      await tx.pedidoVenta.update({
        where: { id: pedidoId },
        data: { estado: "remitido" },
      })

      return remito
    })

    // 4. Emit domain event → stock decrement via event bus
    await eventBus.emit<RemitoEmitidoPayload>({
      type: "REMITO_EMITIDO",
      payload: {
        remitoId: result.id,
        clienteId: pedido.clienteId,
        depositoId: depositoId ?? null,
      },
      timestamp: new Date(),
    })

    return result
  }

  async anularPedido(pedidoId: number) {
    const pedido = await prisma.pedidoVenta.findUnique({
      where: { id: pedidoId },
      include: { lineas: true },
    })
    if (!pedido) throw new Error("Pedido no encontrado")
    if (["facturado", "anulado"].includes(pedido.estado)) {
      throw new Error(`Pedido en estado '${pedido.estado}', no se puede anular`)
    }

    // Release reserved stock if pedido was confirmed
    if (["confirmado", "en_picking"].includes(pedido.estado)) {
      for (const linea of pedido.lineas) {
        if (!linea.productoId) continue
        const stock = await prisma.stockDeposito.findFirst({
          where: { productoId: linea.productoId },
        })
        if (stock && stock.reservado > 0) {
          await prisma.stockDeposito.update({
            where: { id: stock.id },
            data: { reservado: { decrement: Math.min(Number(linea.cantidad), stock.reservado) } },
          })
        }
      }
    }

    return prisma.pedidoVenta.update({
      where: { id: pedidoId },
      data: { estado: "anulado" },
    })
  }

  async obtenerPedido(pedidoId: number) {
    return prisma.pedidoVenta.findUnique({
      where: { id: pedidoId },
      include: {
        lineas: { include: { producto: true }, orderBy: { orden: "asc" } },
        cliente: true,
        vendedor: true,
        condicionPago: true,
      },
    })
  }

  async listarPedidos(filtros?: { empresaId?: number; clienteId?: number; estado?: string; page?: number; limit?: number }) {
    const where: any = {}
    if (filtros?.empresaId) where.empresaId = filtros.empresaId
    if (filtros?.clienteId) where.clienteId = filtros.clienteId
    if (filtros?.estado) where.estado = filtros.estado

    const page = filtros?.page ?? 1
    const limit = filtros?.limit ?? 20

    const [pedidos, total] = await Promise.all([
      prisma.pedidoVenta.findMany({
        where,
        include: { cliente: { select: { id: true, nombre: true } }, lineas: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pedidoVenta.count({ where }),
    ])

    return { pedidos, total, page, limit }
  }

  /**
   * facturarPedido — Transitions a remitido pedido to "facturado" state.
   * Creates the factura record with all lines, links it to the pedido's remito(s),
   * and emits the PEDIDO_FACTURADO event for downstream listeners (contabilidad, etc).
   *
   * Expected to be called AFTER AFIP emission confirms CAE, or for internal invoicing.
   */
  async facturarPedido(pedidoId: number, datosFactura: {
    empresaId: number
    tipo: string                // "A" | "B" | "C"
    tipoCbte: number            // AFIP code: 1/6/11
    puntoVenta: number
    cae?: string
    fechaCAE?: Date
    vencimientoCAE?: Date
    condicionPagoId?: number
  }) {
    const pedido = await prisma.pedidoVenta.findUnique({
      where: { id: pedidoId },
      include: { lineas: { include: { producto: true } }, cliente: true, remitos: true },
    })
    if (!pedido) throw new Error("Pedido no encontrado")
    if (pedido.estado !== "remitido") throw new Error(`Pedido en estado '${pedido.estado}', se requiere 'remitido'`)

    // Auto-number factura
    const ultimaFactura = await prisma.factura.findFirst({
      where: { empresaId: datosFactura.empresaId, tipo: datosFactura.tipo, puntoVenta: datosFactura.puntoVenta },
      orderBy: { numero: "desc" },
    })
    const numero = (ultimaFactura?.numero ?? 0) + 1

    // Build factura lines from pedido lines
    const lineasFactura = pedido.lineas.map((l, i) => ({
      productoId: l.productoId,
      descripcion: l.descripcion ?? l.producto?.nombre ?? "",
      cantidad: Number(l.cantidad),
      precioUnitario: Number(l.precioUnitario),
      subtotal: Number(l.subtotal),
      porcentajeIva: 21,
      iva: Number(l.subtotal) * 0.21,
      total: Number(l.subtotal) * 1.21,
      orden: i + 1,
    }))

    const subtotal = Number(pedido.subtotal)
    const iva = Number(pedido.impuestos)
    const total = Number(pedido.total)

    const [factura] = await prisma.$transaction([
      prisma.factura.create({
        data: {
          tipo: datosFactura.tipo,
          tipoCbte: datosFactura.tipoCbte,
          numero,
          puntoVenta: datosFactura.puntoVenta,
          cae: datosFactura.cae ?? null,
          fechaCAE: datosFactura.fechaCAE ?? null,
          vencimientoCAE: datosFactura.vencimientoCAE ?? null,
          subtotal,
          iva,
          total,
          estado: datosFactura.cae ? "emitida" : "pendiente",
          empresaId: datosFactura.empresaId,
          clienteId: pedido.clienteId,
          vendedorId: pedido.vendedorId,
          condicionPagoId: datosFactura.condicionPagoId ?? pedido.condicionPagoId,
          lineas: { create: lineasFactura },
        },
        include: { lineas: true },
      }),
      prisma.pedidoVenta.update({
        where: { id: pedidoId },
        data: { estado: "facturado" },
      }),
    ])

    eventBus.emit({
      type: "FACTURA_EMITIDA",
      payload: { facturaId: factura.id, empresaId: datosFactura.empresaId, clienteId: pedido.clienteId },
      timestamp: new Date(),
    })

    return factura
  }
}

export const ventasService = new VentasService()
