/**
 * Pagos Service — Órdenes de Pago con retenciones aplicadas y asiento contable
 *
 * Flujo: seleccionar CP → calcular retenciones a aplicar al proveedor (IVA RG 2854,
 *        Ganancias RG 830, IIBB jurisdiccional) → crear OrdenPago con retenciones →
 *        crear registros RetencionSICORE → generar asiento contable → emit ORDEN_PAGO_EMITIDA
 *
 * Retenciones aplicadas: nosotros (agente de retención) retenemos impuestos del pago
 * al proveedor. Contablemente son un pasivo (debemos depositarlas ante AFIP/ARBA).
 *
 * Asiento:
 *   DEBE  Proveedores               (montoTotal)
 *   HABER Banco / Caja              (netoPagado)
 *   HABER Ret. IVA a depositar      (retencionIVA)
 *   HABER Ret. Ganancias a depositar(retencionGanancias)
 *   HABER Ret. IIBB a depositar     (retencionIIBB)
 */

import { prisma } from "@/lib/prisma"
import { eventBus } from "@/lib/events/event-bus"
import type { OrdenPagoEmitidaPayload } from "@/lib/events/types"

export interface PagoInput {
  proveedorId: number
  empresaId: number
  items: { cuentaPagarId: number; monto: number }[]
  medioPago: "transferencia" | "cheque" | "efectivo" | "tarjeta"
  fecha?: Date
  observaciones?: string
  retenciones?: {
    retencionIVA?: number
    retencionGanancias?: number
    retencionIIBB?: number
  }
}

export class PagosService {
  async listarOrdenesPago(input: {
    empresaId: number
    proveedorId?: number
    desde?: Date
    hasta?: Date
    skip?: number
    take?: number
  }) {
    const { empresaId, proveedorId, desde, hasta, skip = 0, take = 50 } = input

    const where: Record<string, unknown> = {
      proveedor: { empresaId },
      ...(proveedorId ? { proveedorId } : {}),
    }

    if (desde || hasta) {
      where.fecha = {
        ...(desde ? { gte: desde } : {}),
        ...(hasta ? { lte: hasta } : {}),
      }
    }

    const [data, total] = await Promise.all([
      prisma.ordenPago.findMany({
        where,
        include: {
          proveedor: { select: { id: true, nombre: true, cuit: true } },
          items: { select: { cuentaPagarId: true, montoPagado: true } },
        },
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      prisma.ordenPago.count({ where }),
    ])

    return {
      data: data.map((op: any) => ({
        ...op,
        montoTotal: Number(op.montoTotal),
        totalRetenciones: Number(op.totalRetenciones),
        netoPagado: Number(op.netoPagado),
        items: op.items.map((item: any) => ({
          ...item,
          montoPagado: Number(item.montoPagado),
        })),
      })),
      total,
      skip,
      take,
    }
  }

  async registrarPago(input: PagoInput) {
    const { proveedorId, empresaId, items, medioPago, fecha, observaciones, retenciones } = input

    const montoTotal = items.reduce((acc, i) => acc + i.monto, 0)
    const retencionIVA = retenciones?.retencionIVA ?? 0
    const retencionGanancias = retenciones?.retencionGanancias ?? 0
    const retencionIIBB = retenciones?.retencionIIBB ?? 0
    const totalRetenciones = retencionIVA + retencionGanancias + retencionIIBB
    const netoPagado = montoTotal - totalRetenciones

    if (netoPagado < 0) {
      throw new Error("Las retenciones superan el monto total a pagar")
    }

    // Validate all CP exist and have sufficient balance
    for (const item of items) {
      const cp = await prisma.cuentaPagar.findUnique({ where: { id: item.cuentaPagarId } })
      if (!cp) throw new Error(`CuentaPagar ${item.cuentaPagarId} no encontrada`)
      if (Number(cp.saldo) < item.monto) {
        throw new Error(`Monto $${item.monto} excede saldo $${cp.saldo} en CP #${item.cuentaPagarId}`)
      }
    }

    // Generate OP number
    const ultimaOP = await prisma.ordenPago.findFirst({ orderBy: { id: "desc" } })
    const numero = `OP-${String((ultimaOP?.id ?? 0) + 1).padStart(6, "0")}`

    const proveedor = await prisma.proveedor.findUnique({
      where: { id: proveedorId },
      select: { nombre: true, cuit: true },
    })

    const fechaPago = fecha ?? new Date()

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create OrdenPago with retenciones
      const op = await tx.ordenPago.create({
        data: {
          numero,
          fecha: fechaPago,
          montoTotal,
          medioPago,
          retencionIVA,
          retencionGanancias,
          retencionIIBB,
          totalRetenciones,
          netoPagado,
          observaciones,
          proveedorId,
          items: {
            create: items.map((i) => ({
              montoPagado: i.monto,
              cuentaPagarId: i.cuentaPagarId,
            })),
          },
        },
      })

      // 2. Create SICORE retention records for each applicable tax
      if (retencionIVA > 0) {
        await tx.retencionSICORE.create({
          data: {
            tipo: "IVA",
            codigoSicore: "767",  // RG 2854 — Retención IVA
            base: montoTotal,
            alicuota: montoTotal > 0 ? (retencionIVA / montoTotal) * 100 : 0,
            monto: retencionIVA,
            fechaRetencion: fechaPago,
            proveedorId,
            ordenPagoId: op.id,
          },
        })
      }
      if (retencionGanancias > 0) {
        await tx.retencionSICORE.create({
          data: {
            tipo: "ganancias",
            codigoSicore: "217",  // RG 830 — Retención Ganancias
            base: montoTotal,
            alicuota: montoTotal > 0 ? (retencionGanancias / montoTotal) * 100 : 0,
            monto: retencionGanancias,
            fechaRetencion: fechaPago,
            proveedorId,
            ordenPagoId: op.id,
          },
        })
      }

      // 3. Update each CuentaPagar
      for (const item of items) {
        const cp = await tx.cuentaPagar.findUnique({ where: { id: item.cuentaPagarId } })
        if (!cp) continue
        const nuevoSaldo = Math.round((Number(cp.saldo) - item.monto) * 100) / 100
        const nuevoPagado = Math.round((Number(cp.montoPagado) + item.monto) * 100) / 100
        await tx.cuentaPagar.update({
          where: { id: item.cuentaPagarId },
          data: {
            montoPagado: nuevoPagado,
            saldo: Math.max(0, nuevoSaldo),
            estado: nuevoSaldo <= 0 ? "pagada" : "parcial",
          },
        })
      }

      // 4. Generate accounting entry
      const ultimoAsiento = await tx.asientoContable.findFirst({ orderBy: { numero: "desc" } })
      const numeroAsiento = (ultimoAsiento?.numero ?? 0) + 1

      const movimientos: { cuenta: string; debe: number; haber: number }[] = []

      // DEBE: extinguish accounts payable
      movimientos.push({ cuenta: "2.1 Proveedores", debe: montoTotal, haber: 0 })

      // HABER: cash/bank outflow
      const cuentaBanco = medioPago === "efectivo" ? "1.1 Caja" : "1.2 Banco"
      if (netoPagado > 0) {
        movimientos.push({ cuenta: cuentaBanco, debe: 0, haber: netoPagado })
      }

      // HABER: retenciones a depositar (pasivo — debemos ingresarlas a AFIP)
      if (retencionIVA > 0) {
        movimientos.push({ cuenta: "2.4.1 Ret. IVA a depositar", debe: 0, haber: retencionIVA })
      }
      if (retencionGanancias > 0) {
        movimientos.push({ cuenta: "2.4.2 Ret. Ganancias a depositar", debe: 0, haber: retencionGanancias })
      }
      if (retencionIIBB > 0) {
        movimientos.push({ cuenta: "2.4.3 Ret. IIBB a depositar", debe: 0, haber: retencionIIBB })
      }

      await tx.asientoContable.create({
        data: {
          fecha: fechaPago,
          numero: numeroAsiento,
          descripcion: `Pago OP ${numero} - Proveedor: ${proveedor?.nombre ?? proveedorId}`,
          tipo: "pago",
          empresaId,
          movimientos: { create: movimientos },
        },
      })

      return op
    })

    // 5. Emit domain event
    await eventBus.emit<OrdenPagoEmitidaPayload>({
      type: "ORDEN_PAGO_EMITIDA",
      payload: {
        ordenPagoId: result.id,
        proveedorId,
        montoTotal,
        medioPago,
        cuentasPagarIds: items.map((i) => i.cuentaPagarId),
      },
      timestamp: new Date(),
    })

    return {
      ordenPagoId: result.id,
      ordenPagoNumero: numero,
      montoTotal,
      totalRetenciones,
      netoPagado,
    }
  }

  /**
   * Export SICORE retention records for a given period.
   * Returns data ready for SICORE flat-file generation.
   */
  async obtenerRetencionesSICORE(desde: Date, hasta: Date) {
    return prisma.retencionSICORE.findMany({
      where: {
        fechaRetencion: { gte: desde, lte: hasta },
      },
      include: {
        proveedor: { select: { nombre: true, cuit: true } },
        ordenPago: { select: { numero: true } },
      },
      orderBy: { fechaRetencion: "asc" },
    })
  }
}

export const pagosService = new PagosService()
