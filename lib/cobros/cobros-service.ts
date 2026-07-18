/**
 * Cobros Service — Cobranzas con retenciones sufridas y asiento contable
 *
 * Flujo: seleccionar CC → calcular retenciones sufridas (que nos aplica el cliente) →
 *        crear Recibo con retenciones → generar asiento contable → emit RECIBO_EMITIDO → update CC
 *
 * Retenciones sufridas: el cliente (agente de retención) nos retiene IVA, Ganancias o IIBB
 * y por eso nos paga menos. Contablemente son un activo (crédito a favor nuestro ante AFIP).
 *
 * Asiento:
 *   DEBE  Banco / Caja              (netoRecibido)
 *   DEBE  Ret. IVA sufridas         (retencionIVA)
 *   DEBE  Ret. Ganancias sufridas   (retencionGanancias)
 *   DEBE  Ret. IIBB sufridas        (retencionIIBB)
 *   HABER Deudores por Ventas       (montoTotal)
 */

import { prisma } from "@/lib/prisma"
import { eventBus } from "@/lib/events/event-bus"
import { getCuentaLabel } from "@/lib/config/parametro-service"
import { resolveCuentaCobro } from "@/lib/contabilidad/medio-pago-cuentas"
import { periodoFiscalService } from "@/lib/contabilidad/periodo-fiscal-service"
import { chequeService, type ChequeInput } from "@/lib/cheques/cheque-service"
import { buildMovimientosConCentro } from "@/lib/contabilidad/movimiento-builder"
import { calcularRetencionesCobroSufridas } from "@/lib/impuestos/retencion-calculo-service"
import { normalizarMediosPago, type MedioPagoLinea } from "@/lib/tesoreria/medios-pago-utils"
import type { ReciboEmitidoPayload } from "@/lib/events/types"

export interface CobroInput {
  clienteId: number
  empresaId: number
  items: { cuentaCobrarId: number; monto: number }[]
  medioPago?: "efectivo" | "transferencia" | "cheque" | "tarjeta"
  medios?: MedioPagoLinea[]
  fecha?: Date
  observaciones?: string
  calcularRetencionesAuto?: boolean
  cheque?: ChequeInput
  retenciones?: {
    retencionIVA?: number
    retencionGanancias?: number
    retencionIIBB?: number
  }
}

export class CobrosService {
  async listarRecibos(input: {
    empresaId: number
    clienteId?: number
    desde?: Date
    hasta?: Date
    skip?: number
    take?: number
  }) {
    const { empresaId, clienteId, desde, hasta, skip = 0, take = 50 } = input

    const where: Record<string, unknown> = {
      cliente: { empresaId },
      ...(clienteId ? { clienteId } : {}),
    }

    if (desde || hasta) {
      where.fecha = {
        ...(desde ? { gte: desde } : {}),
        ...(hasta ? { lte: hasta } : {}),
      }
    }

    const [data, total] = await Promise.all([
      prisma.recibo.findMany({
        where,
        include: {
          cliente: { select: { id: true, nombre: true, cuit: true } },
          items: { select: { cuentaCobrarId: true, montoPagado: true } },
        },
        orderBy: { fecha: "desc" },
        skip,
        take,
      }),
      prisma.recibo.count({ where }),
    ])

    return {
      data: data.map((recibo: any) => ({
        ...recibo,
        montoTotal: Number(recibo.montoTotal),
        totalRetenciones: Number(recibo.totalRetenciones),
        netoRecibido: Number(recibo.netoRecibido),
        items: recibo.items.map((item: any) => ({
          ...item,
          montoPagado: Number(item.montoPagado),
        })),
      })),
      total,
      skip,
      take,
    }
  }

  async registrarCobro(input: CobroInput) {
    const {
      clienteId,
      empresaId,
      items,
      medioPago,
      medios: mediosInput,
      fecha,
      observaciones,
      retenciones,
      cheque,
      calcularRetencionesAuto,
    } = input
    const fechaOp = fecha ?? new Date()

    await periodoFiscalService.validarPeriodoAbierto(fechaOp, empresaId)

    const montoTotal = items.reduce((acc, i) => acc + i.monto, 0)

    let retencionIVA = retenciones?.retencionIVA ?? 0
    let retencionGanancias = retenciones?.retencionGanancias ?? 0
    let retencionIIBB = retenciones?.retencionIIBB ?? 0
    let detalleRetenciones: Awaited<ReturnType<typeof calcularRetencionesCobroSufridas>>["detalle"] = []

    const sinRetencionesManuales =
      retencionIVA === 0 && retencionGanancias === 0 && retencionIIBB === 0

    if (calcularRetencionesAuto || sinRetencionesManuales) {
      const calc = await calcularRetencionesCobroSufridas({
        empresaId,
        clienteId,
        montoBase: montoTotal,
      })
      if (calc.aplicadas && sinRetencionesManuales) {
        retencionIVA = calc.retencionIVA
        retencionGanancias = calc.retencionGanancias
        retencionIIBB = calc.retencionIIBB
        detalleRetenciones = calc.detalle
      } else if (calcularRetencionesAuto) {
        retencionIVA = calc.retencionIVA
        retencionGanancias = calc.retencionGanancias
        retencionIIBB = calc.retencionIIBB
        detalleRetenciones = calc.detalle
      }
    }

    const totalRetenciones = retencionIVA + retencionGanancias + retencionIIBB
    const netoRecibido = montoTotal - totalRetenciones

    const medios = normalizarMediosPago({
      medioPago,
      medios: mediosInput,
      montoNeto: netoRecibido,
    })

    const medioPrincipal = medios[0]?.tipo ?? medioPago ?? "efectivo"
    const usaCheque = medios.some((m) => m.tipo === "cheque")
    if (usaCheque && !cheque?.numero) {
      throw new Error("Datos del cheque requeridos (número, fechas)")
    }

    if (netoRecibido < 0) {
      throw new Error("Las retenciones superan el monto total a cobrar")
    }

    // Validate all CC exist and have sufficient balance
    for (const item of items) {
      const cc = await prisma.cuentaCobrar.findUnique({ where: { id: item.cuentaCobrarId } })
      if (!cc) throw new Error(`CuentaCobrar ${item.cuentaCobrarId} no encontrada`)
      if (Number(cc.saldo) < item.monto) {
        throw new Error(`Monto $${item.monto} excede saldo $${cc.saldo} en CC #${item.cuentaCobrarId}`)
      }
    }

    // Generate receipt number
    const ultimo = await prisma.recibo.findFirst({ orderBy: { id: "desc" } })
    const numero = `REC-${String((ultimo?.id ?? 0) + 1).padStart(6, "0")}`

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Recibo with retenciones
      const recibo = await tx.recibo.create({
        data: {
          numero,
          fecha: fechaOp,
          montoTotal,
          medioPago: medioPrincipal,
          retencionIVA,
          retencionGanancias,
          retencionIIBB,
          totalRetenciones,
          netoRecibido,
          observaciones,
          clienteId,
          items: {
            create: items.map((i) => ({
              montoPagado: i.monto,
              cuentaCobrarId: i.cuentaCobrarId,
            })),
          },
          mediosPago: {
            create: medios.map((m) => ({
              tipo: m.tipo,
              monto: m.monto,
              referencia: m.referencia,
            })),
          },
          ...(detalleRetenciones.length > 0
            ? {
                retencionesDetalle: {
                  create: detalleRetenciones.map((d) => ({
                    tipo: d.tipo,
                    codigoRegimen: d.codigoRegimen,
                    base: d.base,
                    alicuota: d.alicuota,
                    monto: d.monto,
                    jurisdiccion: d.jurisdiccion,
                    empresaId,
                  })),
                },
              }
            : {}),
        },
      })

      // 2. Update each CuentaCobrar
      for (const item of items) {
        const cc = await tx.cuentaCobrar.findUnique({ where: { id: item.cuentaCobrarId } })
        if (!cc) continue
        const nuevoSaldo = Math.round((Number(cc.saldo) - item.monto) * 100) / 100
        const nuevoPagado = Math.round((Number(cc.montoPagado) + item.monto) * 100) / 100
        await tx.cuentaCobrar.update({
          where: { id: item.cuentaCobrarId },
          data: {
            montoPagado: nuevoPagado,
            saldo: Math.max(0, nuevoSaldo),
            estado: nuevoSaldo <= 0 ? "pagada" : "parcial",
          },
        })
      }

      // 3. Generate accounting entry
      const ultimoAsiento = await tx.asientoContable.findFirst({ orderBy: { numero: "desc" } })
      const numeroAsiento = (ultimoAsiento?.numero ?? 0) + 1

      const [ctaRetIVA, ctaRetGan, ctaRetIIBB, ctaDeudores] = await Promise.all([
        getCuentaLabel(empresaId, "cobro", "ret_iva_sufrida", "1.7.1", "Ret. IVA sufridas"),
        getCuentaLabel(empresaId, "cobro", "ret_gan_sufrida", "1.7.2", "Ret. Ganancias sufridas"),
        getCuentaLabel(empresaId, "cobro", "ret_iibb_sufrida", "1.7.3", "Ret. IIBB sufridas"),
        getCuentaLabel(empresaId, "cobro", "deudores", "1.3", "Deudores por Ventas"),
      ])

      const movimientoInputs: { cuentaLabel: string; debe: number; haber: number }[] = []

      for (const medio of medios) {
        if (medio.monto <= 0) continue
        const cta = await resolveCuentaCobro(empresaId, medio.tipo)
        movimientoInputs.push({ cuentaLabel: cta, debe: medio.monto, haber: 0 })
      }

      if (retencionIVA > 0) movimientoInputs.push({ cuentaLabel: ctaRetIVA, debe: retencionIVA, haber: 0 })
      if (retencionGanancias > 0) movimientoInputs.push({ cuentaLabel: ctaRetGan, debe: retencionGanancias, haber: 0 })
      if (retencionIIBB > 0) movimientoInputs.push({ cuentaLabel: ctaRetIIBB, debe: retencionIIBB, haber: 0 })
      movimientoInputs.push({ cuentaLabel: ctaDeudores, debe: 0, haber: montoTotal })

      const cliente = await tx.cliente.findUnique({ where: { id: clienteId }, select: { nombre: true } })

      await tx.asientoContable.create({
        data: {
          fecha: fechaOp,
          numero: numeroAsiento,
          descripcion: `Cobro Recibo ${numero} - Cliente: ${cliente?.nombre ?? clienteId}`,
          tipo: "cobro",
          tipoAsientoId: (await tx.tipoAsiento.findFirst({ where: { empresaId, codigo: "COBRO", activo: true } }))?.id,
          empresaId,
          movimientos: { create: await buildMovimientosConCentro(empresaId, movimientoInputs) },
        },
      })

      if (usaCheque && cheque) {
        const montoCheque = medios.find((m) => m.tipo === "cheque")?.monto ?? netoRecibido
        await chequeService.crearDesdeCobro(tx, {
          reciboId: recibo.id,
          clienteId,
          cheque,
          montoDefault: montoCheque,
        })
      }

      return recibo
    })

    // 4. Emit domain event
    await eventBus.emit<ReciboEmitidoPayload>({
      type: "RECIBO_EMITIDO",
      payload: {
        reciboId: result.id,
        clienteId,
        montoTotal,
        medioPago: medioPrincipal,
        cuentasCobrarIds: items.map((i) => i.cuentaCobrarId),
      },
      timestamp: new Date(),
    })

    // 5. Si el cliente tiene deuda de libreta fiado, bajar saldo (misma plata)
    try {
      const { reducirDeudaCliente, deudaCliente } = await import("@/lib/fiado/fiado-service")
      const cli = await prisma.cliente.findFirst({
        where: { id: clienteId, empresaId },
        select: { saldoCuentaCorriente: true },
      })
      if (cli && deudaCliente(cli.saldoCuentaCorriente) > 0) {
        const aBajar = Math.min(montoTotal, deudaCliente(cli.saldoCuentaCorriente))
        await prisma.$transaction(async (tx) => {
          await reducirDeudaCliente(tx, clienteId, aBajar)
        })
      }
    } catch (err) {
      console.warn("[Cobros] No se pudo sincronizar saldo fiado:", err)
    }

    return {
      reciboId: result.id,
      reciboNumero: numero,
      montoTotal,
      totalRetenciones,
      netoRecibido,
    }
  }

  async aplicarCobroCliente(input: {
    empresaId: number
    clienteId: number
    montoTotal: number
    medioPago: "efectivo" | "transferencia" | "cheque" | "tarjeta"
    fecha?: Date
    observaciones?: string
  }) {
    const { empresaId, clienteId, montoTotal, medioPago, fecha, observaciones } = input

    if (montoTotal <= 0) {
      throw new Error("El monto a cobrar debe ser mayor a 0")
    }

    const cuentas = await prisma.cuentaCobrar.findMany({
      where: {
        cliente: { id: clienteId, empresaId },
        saldo: { gt: 0 },
      },
      orderBy: { fechaVencimiento: "asc" },
    })

    if (cuentas.length === 0) {
      throw new Error("El cliente no tiene cuentas por cobrar pendientes")
    }

    let montoRestante = montoTotal
    const items: { cuentaCobrarId: number; monto: number }[] = []

    for (const cc of cuentas) {
      if (montoRestante <= 0) break

      const saldoCC = Number(cc.saldo)
      const aPagar = Math.min(saldoCC, montoRestante)

      items.push({ cuentaCobrarId: cc.id, monto: aPagar })
      montoRestante -= aPagar
    }

    if (montoRestante > 0.01) {
      throw new Error("El monto excede la deuda total pendiente en Cuentas por Cobrar")
    }

    return this.registrarCobro({
      empresaId,
      clienteId,
      items,
      medioPago,
      fecha,
      observaciones,
    })
  }
}

export const cobrosService = new CobrosService()
