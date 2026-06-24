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
import type { ReciboEmitidoPayload } from "@/lib/events/types"

export interface CobroInput {
  clienteId: number
  empresaId: number
  items: { cuentaCobrarId: number; monto: number }[]
  medioPago: "efectivo" | "transferencia" | "cheque" | "tarjeta"
  fecha?: Date
  observaciones?: string
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
    const { clienteId, empresaId, items, medioPago, fecha, observaciones, retenciones, cheque } = input
    const fechaOp = fecha ?? new Date()

    await periodoFiscalService.validarPeriodoAbierto(fechaOp, empresaId)

    if (medioPago === "cheque" && !cheque?.numero) {
      throw new Error("Datos del cheque requeridos (número, fechas)")
    }

    const montoTotal = items.reduce((acc, i) => acc + i.monto, 0)
    const retencionIVA = retenciones?.retencionIVA ?? 0
    const retencionGanancias = retenciones?.retencionGanancias ?? 0
    const retencionIIBB = retenciones?.retencionIIBB ?? 0
    const totalRetenciones = retencionIVA + retencionGanancias + retencionIIBB
    const netoRecibido = montoTotal - totalRetenciones

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
          medioPago,
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

      const movimientos: { cuenta: string; debe: number; haber: number }[] = []

      const [ctaMedioPago, ctaRetIVA, ctaRetGan, ctaRetIIBB, ctaDeudores] = await Promise.all([
        resolveCuentaCobro(empresaId, medioPago),
        getCuentaLabel(empresaId, "cobro", "ret_iva_sufrida", "1.7.1", "Ret. IVA sufridas"),
        getCuentaLabel(empresaId, "cobro", "ret_gan_sufrida", "1.7.2", "Ret. Ganancias sufridas"),
        getCuentaLabel(empresaId, "cobro", "ret_iibb_sufrida", "1.7.3", "Ret. IIBB sufridas"),
        getCuentaLabel(empresaId, "cobro", "deudores", "1.3", "Deudores por Ventas"),
      ])

      if (netoRecibido > 0) {
        movimientos.push({ cuenta: ctaMedioPago, debe: netoRecibido, haber: 0 })
      }

      // DEBE: retenciones sufridas (activos — crédito fiscal a nuestro favor)
      if (retencionIVA > 0) {
        movimientos.push({ cuenta: ctaRetIVA, debe: retencionIVA, haber: 0 })
      }
      if (retencionGanancias > 0) {
        movimientos.push({ cuenta: ctaRetGan, debe: retencionGanancias, haber: 0 })
      }
      if (retencionIIBB > 0) {
        movimientos.push({ cuenta: ctaRetIIBB, debe: retencionIIBB, haber: 0 })
      }

      // HABER: accounts receivable extinguished
      movimientos.push({ cuenta: ctaDeudores, debe: 0, haber: montoTotal })

      const cliente = await tx.cliente.findUnique({ where: { id: clienteId }, select: { nombre: true } })

      await tx.asientoContable.create({
        data: {
          fecha: fechaOp,
          numero: numeroAsiento,
          descripcion: `Cobro Recibo ${numero} - Cliente: ${cliente?.nombre ?? clienteId}`,
          tipo: "cobro",
          tipoAsientoId: (await tx.tipoAsiento.findFirst({ where: { empresaId, codigo: "COBRO", activo: true } }))?.id,
          empresaId,
          movimientos: { create: movimientos },
        },
      })

      if (medioPago === "cheque" && cheque) {
        await chequeService.crearDesdeCobro(tx, {
          reciboId: recibo.id,
          clienteId,
          cheque,
          montoDefault: netoRecibido,
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
        medioPago,
        cuentasCobrarIds: items.map((i) => i.cuentaCobrarId),
      },
      timestamp: new Date(),
    })

    return {
      reciboId: result.id,
      reciboNumero: numero,
      montoTotal,
      totalRetenciones,
      netoRecibido,
    }
  }
}

export const cobrosService = new CobrosService()
