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
import { getCuentaLabel } from "@/lib/config/parametro-service"
import { resolveCuentaPago } from "@/lib/contabilidad/medio-pago-cuentas"
import { periodoFiscalService } from "@/lib/contabilidad/periodo-fiscal-service"
import { chequeService, type ChequeInput } from "@/lib/cheques/cheque-service"
import { buildMovimientosConCentro } from "@/lib/contabilidad/movimiento-builder"
import { calcularRetencionesPago } from "@/lib/impuestos/retencion-calculo-service"
import { normalizarMediosPago, type MedioPagoLinea } from "@/lib/tesoreria/medios-pago-utils"
import type { OrdenPagoEmitidaPayload } from "@/lib/events/types"

export interface PagoInput {
  proveedorId: number
  empresaId: number
  items: { cuentaPagarId: number; monto: number }[]
  medioPago?: "transferencia" | "cheque" | "efectivo" | "tarjeta"
  medios?: MedioPagoLinea[]
  fecha?: Date
  observaciones?: string
  calcularRetencionesAuto?: boolean
  jurisdiccionIIBB?: string
  cheque?: ChequeInput
  chequesTercerosIds?: number[]
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
    const {
      proveedorId,
      empresaId,
      items,
      medioPago,
      medios: mediosInput,
      fecha,
      observaciones,
      retenciones,
      cheque,
      chequesTercerosIds,
      calcularRetencionesAuto,
      jurisdiccionIIBB,
    } = input
    const fechaOp = fecha ?? new Date()

    await periodoFiscalService.validarPeriodoAbierto(fechaOp, empresaId)

    const montoTotal = items.reduce((acc, i) => acc + i.monto, 0)

    let retencionIVA = retenciones?.retencionIVA ?? 0
    let retencionGanancias = retenciones?.retencionGanancias ?? 0
    let retencionIIBB = retenciones?.retencionIIBB ?? 0

    const sinRetencionesManuales =
      retencionIVA === 0 && retencionGanancias === 0 && retencionIIBB === 0

    if (calcularRetencionesAuto || sinRetencionesManuales) {
      const calc = await calcularRetencionesPago({
        empresaId,
        proveedorId,
        montoBase: montoTotal,
        jurisdiccion: jurisdiccionIIBB,
      })
      if (calc.aplicadas && (calcularRetencionesAuto || sinRetencionesManuales)) {
        retencionIVA = calc.retencionIVA
        retencionGanancias = calc.retencionGanancias
        retencionIIBB = calc.retencionIIBB
      }
    }

    const totalRetenciones = retencionIVA + retencionGanancias + retencionIIBB
    const netoPagado = montoTotal - totalRetenciones

    const medios = normalizarMediosPago({
      medioPago,
      medios: mediosInput,
      montoNeto: netoPagado,
    })

    const medioPrincipal = medios[0]?.tipo ?? medioPago ?? "transferencia"
    const usaCheque = medios.some((m) => m.tipo === "cheque")
    if (usaCheque && !cheque?.numero) {
      throw new Error("Datos del cheque propio requeridos (número, fechas, cuenta emisora)")
    }
    if (usaCheque && !cheque?.cuentaEmisorId) {
      throw new Error("Cuenta bancaria emisora requerida para cheque propio")
    }

    if (netoPagado < 0) {
      throw new Error("Las retenciones superan el monto total a pagar")
    }

    // Validate all CP exist and have sufficient balance
    for (const item of items) {
      const cp = await prisma.cuentaPagar.findFirst({ 
        where: { id: item.cuentaPagarId, proveedor: { empresaId } } 
      })
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

    const fechaPago = fechaOp

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create OrdenPago with retenciones
      const op = await tx.ordenPago.create({
        data: {
          numero,
          fecha: fechaPago,
          montoTotal,
          medioPago: medioPrincipal,
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
          mediosPago: {
            create: medios.map((m) => ({
              tipo: m.tipo,
              monto: m.monto,
              referencia: m.referencia,
            })),
          },
        },
      })

      // Endosar cheques de terceros seleccionados
      if (chequesTercerosIds && chequesTercerosIds.length > 0) {
        for (const chequeId of chequesTercerosIds) {
          await chequeService.endosarChequeTercero(chequeId, op.id, proveedorId, empresaId, tx)
        }
      }

      // 2. Create SICORE retention records for each applicable tax
      // Link to RegimenRetencion maestro when available
      if (retencionIVA > 0) {
        const regimen = await tx.regimenRetencion.findFirst({ where: { empresaId, codigoSicore: "767", activo: true } })
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
            regimenRetencionId: regimen?.id,
          },
        })
      }
      if (retencionGanancias > 0) {
        const regimen = await tx.regimenRetencion.findFirst({ where: { empresaId, codigoSicore: "217", activo: true } })
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
            regimenRetencionId: regimen?.id,
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

      const [ctaProveedores, ctaRetIVADep, ctaRetGanDep, ctaRetIIBBDep] = await Promise.all([
        getCuentaLabel(empresaId, "pago", "proveedores", "2.1", "Proveedores"),
        getCuentaLabel(empresaId, "pago", "ret_iva_depositar", "2.4.1", "Retenciones IVA a Depositar"),
        getCuentaLabel(empresaId, "pago", "ret_gan_depositar", "2.4.2", "Retenciones Ganancias a Depositar"),
        getCuentaLabel(empresaId, "pago", "ret_iibb_depositar", "2.4.3", "Retenciones IIBB a Depositar"),
      ])

      const movimientoInputs: { cuentaLabel: string; debe: number; haber: number }[] = [
        { cuentaLabel: ctaProveedores, debe: montoTotal, haber: 0 },
      ]

      for (const medio of medios) {
        if (medio.monto <= 0) continue
        const cta = await resolveCuentaPago(empresaId, medio.tipo)
        movimientoInputs.push({ cuentaLabel: cta, debe: 0, haber: medio.monto })
      }

      if (retencionIVA > 0) movimientoInputs.push({ cuentaLabel: ctaRetIVADep, debe: 0, haber: retencionIVA })
      if (retencionGanancias > 0) movimientoInputs.push({ cuentaLabel: ctaRetGanDep, debe: 0, haber: retencionGanancias })
      if (retencionIIBB > 0) movimientoInputs.push({ cuentaLabel: ctaRetIIBBDep, debe: 0, haber: retencionIIBB })

      await tx.asientoContable.create({
        data: {
          fecha: fechaPago,
          numero: numeroAsiento,
          descripcion: `Pago OP ${numero} - Proveedor: ${proveedor?.nombre ?? proveedorId}`,
          tipo: "pago",
          tipoAsientoId: (await tx.tipoAsiento.findFirst({ where: { empresaId, codigo: "PAGO", activo: true } }))?.id,
          empresaId,
          movimientos: { create: await buildMovimientosConCentro(empresaId, movimientoInputs) },
        },
      })

      if (usaCheque && cheque) {
        const montoCheque = medios.find((m) => m.tipo === "cheque")?.monto ?? netoPagado
        await chequeService.crearDesdePago(tx, {
          ordenPagoId: op.id,
          proveedorId,
          cheque,
          montoDefault: montoCheque,
        })
      }

      return op
    })

    // 5. Emit domain event
    await eventBus.emit<OrdenPagoEmitidaPayload>({
      type: "ORDEN_PAGO_EMITIDA",
      payload: {
        ordenPagoId: result.id,
        proveedorId,
        montoTotal,
        medioPago: medioPrincipal,
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
