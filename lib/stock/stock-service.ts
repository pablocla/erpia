/**
 * Stock Service — Automatic stock management
 *
 * Handles stock decrement on sale, increment on purchase,
 * reentry on credit notes, manual adjustments, and alerts.
 * Operates on both Producto.stock (global) and StockDeposito (per-warehouse).
 */

import { prisma } from "@/lib/prisma"
import { eventBus } from "@/lib/events/event-bus"
import type {
  FacturaEmitidaPayload,
  CompraRegistradaPayload,
  NCEmitidaPayload,
  StockActualizadoPayload,
  RemitoEmitidoPayload,
} from "@/lib/events/types"

export class StockService {
  /**
   * Decrement stock for each line in an invoice.
   * Called by the event bus on FACTURA_EMITIDA.
   */
  async decrementarStockPorFactura(facturaId: number, depositoId?: number): Promise<void> {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: { lineas: true },
    })
    if (!factura) return

    const tieneRemito = await prisma.remito.findFirst({
      where: { facturaId },
      select: { id: true },
    })
    if (tieneRemito) return

    const productoIds = factura.lineas
      .map((linea) => linea.productoId)
      .filter((id): id is number => Boolean(id))

    const recetas = productoIds.length
      ? await prisma.listaMateriales.findMany({
          where: { productoId: { in: productoIds }, tipo: "receta", activo: true },
          select: { productoId: true },
        })
      : []

    const productosConReceta = new Set(recetas.map((r) => r.productoId))

    for (const linea of factura.lineas) {
      if (!linea.productoId) continue
      // Platos con receta consumen insumos por receta, no stock de producto terminado
      if (productosConReceta.has(linea.productoId)) continue
      await this.ajustarStock(
        linea.productoId,
        -linea.cantidad,
        "salida",
        `Venta - Factura ${factura.tipo} ${factura.puntoVenta}-${factura.numero}`,
        depositoId,
      )
    }
  }

  /**
   * Consume ingredientes según receta para cada línea de factura.
   * Usado cuando el producto es un plato (receta tipo "receta").
   */
  async consumirIngredientesPorFactura(facturaId: number, depositoId?: number): Promise<void> {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: { lineas: true },
    })
    if (!factura) return

    const productoIds = factura.lineas
      .map((linea) => linea.productoId)
      .filter((id): id is number => Boolean(id))

    if (productoIds.length === 0) return

    const recetas = await prisma.listaMateriales.findMany({
      where: { productoId: { in: productoIds }, tipo: "receta", activo: true },
      include: { componentes: true },
    })

    const recetaByProducto = new Map(recetas.map((receta) => [receta.productoId, receta]))

    for (const linea of factura.lineas) {
      if (!linea.productoId) continue
      const receta = recetaByProducto.get(linea.productoId)
      if (!receta) continue

      for (const componente of receta.componentes) {
        if (!componente.productoId) continue
        const cantidad = Number(linea.cantidad) * Number(componente.cantidad)
        if (cantidad <= 0) continue
        await this.ajustarStock(
          componente.productoId,
          -cantidad,
          "salida",
          `Receta ${receta.nombre} - Factura ${factura.tipo} ${factura.puntoVenta}-${factura.numero}`,
          depositoId,
        )
      }
    }
  }

  /**
   * Increment stock for each line in a purchase.
   * Called by the event bus on COMPRA_REGISTRADA.
   */
  async incrementarStockPorCompra(compraId: number, depositoId?: number): Promise<void> {
    const compra = await prisma.compra.findUnique({
      where: { id: compraId },
      include: { lineas: true },
    })
    if (!compra) return

    for (const linea of compra.lineas) {
      if (!linea.productoId) continue
      await this.ajustarStock(
        linea.productoId,
        linea.cantidad,
        "entrada",
        `Compra - FC ${compra.tipo} ${compra.puntoVenta}-${compra.numero}`,
        depositoId,
      )
    }
  }

  /**
   * Reentry stock on credit note (devolución).
   * Called by the event bus on NC_EMITIDA.
   */
  async reingresarStockPorNC(notaCreditoId: number, depositoId?: number): Promise<void> {
    const nc = await prisma.notaCredito.findUnique({
      where: { id: notaCreditoId },
      include: { factura: { include: { lineas: true } } },
    })
    if (!nc) return

    // Reingresa todos los productos de la factura original (NC total)
    // For partial NC, the caller should specify which lines
    for (const linea of nc.factura.lineas) {
      if (!linea.productoId) continue
      await this.ajustarStock(
        linea.productoId,
        linea.cantidad,
        "entrada",
        `Devolución - NC ${nc.tipo} ${nc.puntoVenta}-${nc.numero}`,
        depositoId,
      )
    }
  }

  /**
   * Decrement stock for each line in a remito (delivery).
   * Skips if the remito is already linked to a factura.
   */
  async decrementarStockPorRemito(remitoId: number, depositoId?: number): Promise<void> {
    const remito = await prisma.remito.findUnique({
      where: { id: remitoId },
      include: { lineas: true },
    })
    if (!remito) return
    if (remito.facturaId) return

    for (const linea of remito.lineas) {
      if (!linea.productoId) continue
      await this.ajustarStock(
        linea.productoId,
        -linea.cantidad,
        "salida",
        `Remito ${remito.numero}`,
        depositoId,
      )
    }
  }

  /**
   * Manual stock adjustment (inventario, rotura, vencimiento, etc.)
   */
  async ajustarStockManual(
    productoId: number,
    cantidad: number,
    motivo: string,
    depositoId?: number,
  ): Promise<void> {
    const tipo = cantidad >= 0 ? "ajuste" : "ajuste"
    await this.ajustarStock(productoId, cantidad, tipo, motivo, depositoId)
  }

  /**
   * Core: adjust stock for a product, optionally in a specific warehouse.
   * Always creates a MovimientoStock record.
   * Wrapped in prisma.$transaction for atomicity (C-001).
   * Guards against negative stock on 'salida' operations (A-003).
   * Emits STOCK_ACTUALIZADO for downstream handlers (alerts, etc.)
   */
  private async ajustarStock(
    productoId: number,
    cantidad: number,
    tipo: string,
    motivo: string,
    depositoId?: number,
  ): Promise<void> {
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
      select: { id: true, stock: true, stockMinimo: true, nombre: true, empresaId: true },
    })
    if (!producto) return

    const cantidadAnterior = producto.stock
    const cantidadNueva = cantidadAnterior + cantidad

    // Guard: no permitir stock negativo en salidas (A-003)
    if (cantidadNueva < 0 && (tipo === "salida" || cantidad < 0)) {
      throw new Error(
        `Stock insuficiente para "${producto.nombre}": disponible ${cantidadAnterior}, solicitado ${Math.abs(cantidad)}`,
      )
    }

    // Atomic transaction: producto + depósito + movimiento (C-001)
    await prisma.$transaction(async (tx) => {
      await tx.producto.update({
        where: { id: productoId },
        data: { stock: cantidadNueva },
      })

      if (depositoId) {
        await tx.stockDeposito.upsert({
          where: { productoId_depositoId: { productoId, depositoId } },
          update: { cantidad: { increment: cantidad } },
          create: { productoId, depositoId, cantidad: Math.max(0, cantidad) },
        })
      }

      await tx.movimientoStock.create({
        data: {
          productoId,
          tipo,
          cantidad: Math.abs(cantidad),
          motivo,
          depositoId,
          empresaId: producto.empresaId,
        },
      })
    })

    await eventBus.emit<StockActualizadoPayload>({
      type: "STOCK_ACTUALIZADO",
      payload: {
        productoId,
        depositoId,
        cantidadAnterior,
        cantidadNueva,
        motivo,
      },
      timestamp: new Date(),
    })
  }
}

// ─── EVENT BUS HANDLER REGISTRATION ─────────────────────────────────────────────

const stockService = new StockService()

eventBus.on<FacturaEmitidaPayload>("FACTURA_EMITIDA", "stock_por_venta", async (event) => {
  await stockService.decrementarStockPorFactura(
    event.payload.facturaId,
    event.payload.depositoId ?? undefined,
  )
})

eventBus.on<FacturaEmitidaPayload>("FACTURA_EMITIDA", "stock_receta_por_venta", async (event) => {
  await stockService.consumirIngredientesPorFactura(
    event.payload.facturaId,
    event.payload.depositoId ?? undefined,
  )
})

eventBus.on<CompraRegistradaPayload>("COMPRA_REGISTRADA", "stock_por_compra", async (event) => {
  await stockService.incrementarStockPorCompra(
    event.payload.compraId,
    event.payload.depositoId ?? undefined,
  )
})

eventBus.on<NCEmitidaPayload>("NC_EMITIDA", "stock_por_nc", async (event) => {
  await stockService.reingresarStockPorNC(event.payload.notaCreditoId)
})

// ─── REMITO_EMITIDO → stock decrement (pedido venta → remito flow) ──────────
eventBus.on<RemitoEmitidoPayload>("REMITO_EMITIDO", "stock_por_remito", async (event) => {
  await stockService.decrementarStockPorRemito(
    event.payload.remitoId,
    event.payload.depositoId ?? undefined,
  )
})

// ─── FACTURA_EMITIDA → CMV accounting entry ─────────────────────────────────
eventBus.on<FacturaEmitidaPayload>("FACTURA_EMITIDA", "cmv_por_venta", async (event) => {
  try {
    const { AsientoService } = await import("@/lib/contabilidad/asiento-service")
    const asientoService = new AsientoService()
    await asientoService.generarAsientoCMV(event.payload.facturaId)
  } catch (error) {
    console.error("[EVENT] Error al generar asiento CMV:", error)
  }
})

eventBus.on<StockActualizadoPayload>("STOCK_ACTUALIZADO", "alerta_stock_bajo", async (event) => {
  const { productoId, cantidadNueva } = event.payload
  const producto = await prisma.producto.findUnique({
    where: { id: productoId },
    select: { stockMinimo: true, nombre: true },
  })
  if (producto && cantidadNueva < producto.stockMinimo) {
    console.warn(
      `[STOCK ALERTA] ${producto.nombre}: stock ${cantidadNueva} < mínimo ${producto.stockMinimo}`,
    )
  }
})

export { stockService }
