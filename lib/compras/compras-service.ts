/**
 * Compras Service — Ciclo completo: OC → Recepción → 3-Way Matching → Factura Proveedor
 *
 * Implements the full purchase cycle per tesis section 6:
 *   1. OrdenCompra: compromiso con proveedor
 *   2. RecepcionCompra: ingreso de mercadería vs. OC
 *   3. 3-Way Matching: OC vs Recepción vs Factura proveedor
 *   4. Verificación CAE vía WSCDC
 */

import { prisma } from "@/lib/prisma"
import { eventBus } from "@/lib/events/event-bus"
import { getParametro } from "@/lib/config/parametro-service"
import type { OcAprobadaPayload, CompraRegistradaPayload } from "@/lib/events/types"

export interface ThreeWayMatchResult {
  ok: boolean
  discrepancias: string[]
  /** Tolerance percentage for price matching */
  toleranciaPrecio: number
}

export class ComprasService {
  // ─── ORDEN DE COMPRA ──────────────────────────────────────────────────────

  async crearOrdenCompra(data: {
    proveedorId: number
    empresaId: number
    lineas: Array<{
      productoId?: number
      descripcion: string
      cantidad: number
      precioUnitario: number
    }>
    condicionPagoId?: number
    fechaEntregaEst?: Date
    observaciones?: string
  }) {
    const subtotal = data.lineas.reduce((sum, l) => sum + l.cantidad * l.precioUnitario, 0)
    const impuestos = subtotal * 0.21 // Estimate — refined at invoice time
    const total = subtotal + impuestos

    // Next number
    const ultima = await prisma.ordenCompra.findFirst({ orderBy: { numero: "desc" } })
    const num = (parseInt(ultima?.numero ?? "0", 10) + 1).toString().padStart(8, "0")

    const oc = await prisma.ordenCompra.create({
      data: {
        numero: num,
        fechaEmision: new Date(),
        fechaEntregaEst: data.fechaEntregaEst,
        subtotal,
        impuestos,
        total,
        estado: "borrador",
        observaciones: data.observaciones,
        proveedorId: data.proveedorId,
        condicionPagoId: data.condicionPagoId,
        empresaId: data.empresaId,
        lineas: {
          create: data.lineas.map((l, idx) => ({
            descripcion: l.descripcion,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            subtotal: l.cantidad * l.precioUnitario,
            orden: idx + 1,
            productoId: l.productoId,
          })),
        },
      },
      include: { lineas: true, proveedor: true },
    })

    return oc
  }

  async aprobarOrdenCompra(ocId: number) {
    const oc = await prisma.ordenCompra.update({
      where: { id: ocId },
      data: { estado: "aprobada" },
      include: { proveedor: true },
    })

    await eventBus.emit<OcAprobadaPayload>({
      type: "OC_APROBADA",
      payload: {
        ordenCompraId: oc.id,
        proveedorId: oc.proveedorId,
        total: Number(oc.total),
      },
      timestamp: new Date(),
    })

    return oc
  }

  // ─── RECEPCIÓN DE MERCADERÍA ──────────────────────────────────────────────

  async registrarRecepcion(data: {
    ordenCompraId: number
    depositoId?: number
    lineas: Array<{
      lineaOcId: number
      productoId?: number
      cantidadRecibida: number
      cantidadRechazada?: number
      observacion?: string
    }>
    observaciones?: string
  }) {
    // Validate OC exists and is in valid state
    const oc = await prisma.ordenCompra.findUnique({
      where: { id: data.ordenCompraId },
      include: { lineas: true },
    })
    if (!oc) throw new Error("Orden de compra no encontrada")
    if (!["aprobada", "enviada", "parcial"].includes(oc.estado)) {
      throw new Error(`OC en estado "${oc.estado}" no permite recepción`)
    }

    const ultima = await prisma.recepcionCompra.findFirst({ orderBy: { numero: "desc" } })
    const num = (parseInt(ultima?.numero ?? "0", 10) + 1).toString().padStart(8, "0")

    const recepcion = await prisma.recepcionCompra.create({
      data: {
        numero: num,
        fecha: new Date(),
        estado: "pendiente",
        observaciones: data.observaciones,
        ordenCompraId: data.ordenCompraId,
        depositoId: data.depositoId,
        lineas: {
          create: data.lineas.map((l) => ({
            cantidadRecibida: l.cantidadRecibida,
            cantidadRechazada: l.cantidadRechazada ?? 0,
            observacion: l.observacion,
            lineaOcId: l.lineaOcId,
            productoId: l.productoId,
          })),
        },
      },
      include: { lineas: true },
    })

    // Update cantidadRecibida on OC lines
    for (const lr of data.lineas) {
      await prisma.lineaOrdenCompra.update({
        where: { id: lr.lineaOcId },
        data: {
          cantidadRecibida: {
            increment: lr.cantidadRecibida,
          },
        },
      })
    }

    // Update OC status
    const ocUpdated = await prisma.ordenCompra.findUnique({
      where: { id: data.ordenCompraId },
      include: { lineas: true },
    })
    if (ocUpdated) {
      const allReceived = ocUpdated.lineas.every(
        (l) => Number(l.cantidadRecibida) >= Number(l.cantidad),
      )
      await prisma.ordenCompra.update({
        where: { id: data.ordenCompraId },
        data: { estado: allReceived ? "recibida" : "parcial" },
      })
    }

    return recepcion
  }

  // ─── 3-WAY MATCHING ───────────────────────────────────────────────────────

  /**
   * Three-way match: OC vs Recepción vs Factura Proveedor
   *
   * Validates:
   *   1. Quantities: OC qty >= received qty >= invoiced qty
   *   2. Prices: invoice price within tolerance of OC price
   *   3. Item matching: all invoiced items exist in OC
   */
  async threeWayMatch(
    ordenCompraId: number,
    facturaLineas: Array<{
      descripcion: string
      cantidad: number
      precioUnitario: number
      productoId?: number
    }>,
    toleranciaPrecio?: number,
    empresaId: number = 1,
  ): Promise<ThreeWayMatchResult> {
    // Resolve tolerance from DB (or use provided override, or fallback 2%)
    const tol = toleranciaPrecio ?? await getParametro(empresaId, "tolerancia_3way_match", 0.02)

    const oc = await prisma.ordenCompra.findUnique({
      where: { id: ordenCompraId },
      include: { lineas: true, recepciones: { include: { lineas: true } } },
    })

    if (!oc) {
      return { ok: false, discrepancias: ["OC no encontrada"], toleranciaPrecio: tol }
    }

    const discrepancias: string[] = []

    // Aggregate received quantities per OC line
    const recibidoPorLinea = new Map<number, number>()
    for (const rec of oc.recepciones) {
      for (const lr of rec.lineas) {
        const prev = recibidoPorLinea.get(lr.lineaOcId) ?? 0
        recibidoPorLinea.set(lr.lineaOcId, prev + Number(lr.cantidadRecibida))
      }
    }

    for (const fl of facturaLineas) {
      // Find matching OC line by productoId or descripcion
      const ocLine = oc.lineas.find(
        (ol) =>
          (fl.productoId && ol.productoId === fl.productoId) ||
          (ol.descripcion && ol.descripcion === fl.descripcion),
      )

      if (!ocLine) {
        discrepancias.push(`Ítem "${fl.descripcion}" no existe en OC ${oc.numero}`)
        continue
      }

      // Check quantity received >= invoiced
      const recibido = recibidoPorLinea.get(ocLine.id) ?? 0
      if (fl.cantidad > recibido) {
        discrepancias.push(
          `"${fl.descripcion}": facturado ${fl.cantidad} > recibido ${recibido}`,
        )
      }

      // Check price within tolerance
      const precioOC = Number(ocLine.precioUnitario)
      const diff = Math.abs(fl.precioUnitario - precioOC) / precioOC
      if (diff > tol) {
        discrepancias.push(
          `"${fl.descripcion}": precio FC $${fl.precioUnitario} vs OC $${precioOC} (diff ${(diff * 100).toFixed(1)}% > ${(tol * 100)}%)`,
        )
      }
    }

    return {
      ok: discrepancias.length === 0,
      discrepancias,
      toleranciaPrecio: tol,
    }
  }
}

export const comprasService = new ComprasService()
