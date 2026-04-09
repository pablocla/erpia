/**
 * Cuentas a Cobrar / Cuentas a Pagar — Service
 *
 * Generates CC/CP records from invoices/purchases.
 * Provides aging reports (30/60/90/+90).
 * Handles payment application (Recibo → CC, OrdenPago → CP).
 */

import { prisma } from "@/lib/prisma"
import { eventBus } from "@/lib/events/event-bus"
import type { FacturaEmitidaPayload, CompraRegistradaPayload } from "@/lib/events/types"

export class CuentasService {
  // ─── CUENTAS A COBRAR ───────────────────────────────────────────────────────

  /**
   * Generate CuentaCobrar records from an invoice.
   * Uses condicionPago to split into installments if needed.
   */
  async generarCCPorFactura(facturaId: number): Promise<void> {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: { condicionPago: true },
    })
    if (!factura) return

    const cuotas = factura.condicionPago?.cuotas ?? 1
    const diasBase = factura.condicionPago?.diasVencimiento ?? 0
    const diasAdic = (factura.condicionPago?.diasAdicionales as number[] | null) ?? []

    // Contado → no generar CC
    if (cuotas === 1 && diasBase === 0) return

    const montoCuota = Math.round((factura.total / cuotas) * 100) / 100
    const fechaBase = factura.createdAt

    for (let i = 0; i < cuotas; i++) {
      const dias = i === 0 ? diasBase : (diasAdic[i - 1] ?? diasBase * (i + 1))
      const vencimiento = new Date(fechaBase)
      vencimiento.setDate(vencimiento.getDate() + dias)

      // Adjusto última cuota para evitar diferencia de redondeo
      const monto = i === cuotas - 1
        ? factura.total - montoCuota * (cuotas - 1)
        : montoCuota

      await prisma.cuentaCobrar.create({
        data: {
          facturaId: factura.id,
          clienteId: factura.clienteId,
          numeroCuota: i + 1,
          montoOriginal: monto,
          saldo: monto,
          fechaEmision: fechaBase,
          fechaVencimiento: vencimiento,
        },
      })
    }
  }

  /**
   * Apply a payment (Recibo) to one or more CuentaCobrar records.
   */
  async aplicarRecibo(clienteId: number, items: { cuentaCobrarId: number; monto: number }[]): Promise<number> {
    const montoTotal = items.reduce((acc, i) => acc + i.monto, 0)

    // Get next recibo number
    const ultimo = await prisma.recibo.findFirst({ orderBy: { numero: "desc" } })
    const numero = String((parseInt(ultimo?.numero ?? "0", 10) + 1)).padStart(8, "0")

    const recibo = await prisma.recibo.create({
      data: {
        numero,
        fecha: new Date(),
        montoTotal,
        clienteId,
        items: {
          create: items.map((i) => ({
            cuentaCobrarId: i.cuentaCobrarId,
            montoPagado: i.monto,
          })),
        },
      },
    })

    // Update each CC
    for (const item of items) {
      const cc = await prisma.cuentaCobrar.findUnique({ where: { id: item.cuentaCobrarId } })
      if (!cc) continue

      const nuevoSaldo = Number(cc.saldo) - item.monto
      const nuevoPagado = Number(cc.montoPagado) + item.monto

      await prisma.cuentaCobrar.update({
        where: { id: item.cuentaCobrarId },
        data: {
          montoPagado: nuevoPagado,
          saldo: Math.max(0, nuevoSaldo),
          estado: nuevoSaldo <= 0 ? "pagada" : "parcial",
        },
      })
    }

    return recibo.id
  }

  /**
   * Aging report for CC: current / 30 / 60 / 90 / +90 days.
   */
  async agingCC(clienteId?: number) {
    const where: any = { estado: { in: ["pendiente", "parcial", "vencida"] } }
    if (clienteId) where.clienteId = clienteId

    const cuentas = await prisma.cuentaCobrar.findMany({
      where,
      include: { cliente: { select: { id: true, nombre: true, cuit: true } } },
      orderBy: { fechaVencimiento: "asc" },
    })

    const hoy = new Date()
    const buckets = { corriente: 0, d30: 0, d60: 0, d90: 0, mas90: 0 }
    const detalle: any[] = []

    for (const cc of cuentas) {
      const saldo = Number(cc.saldo)
      const diasVencido = Math.floor((hoy.getTime() - new Date(cc.fechaVencimiento).getTime()) / 86400000)

      if (diasVencido <= 0) buckets.corriente += saldo
      else if (diasVencido <= 30) buckets.d30 += saldo
      else if (diasVencido <= 60) buckets.d60 += saldo
      else if (diasVencido <= 90) buckets.d90 += saldo
      else buckets.mas90 += saldo

      // Mark as vencida if overdue
      if (diasVencido > 0 && cc.estado === "pendiente") {
        await prisma.cuentaCobrar.update({ where: { id: cc.id }, data: { estado: "vencida" } })
      }

      detalle.push({
        id: cc.id,
        cliente: cc.cliente,
        facturaId: cc.facturaId,
        cuota: cc.numeroCuota,
        montoOriginal: Number(cc.montoOriginal),
        saldo,
        fechaVencimiento: cc.fechaVencimiento,
        diasVencido: Math.max(0, diasVencido),
      })
    }

    return { buckets, total: Object.values(buckets).reduce((a, b) => a + b, 0), detalle }
  }

  // ─── CUENTAS A PAGAR ───────────────────────────────────────────────────────

  /**
   * Generate CuentaPagar records from a purchase.
   */
  async generarCPPorCompra(compraId: number): Promise<void> {
    const compra = await prisma.compra.findUnique({
      where: { id: compraId },
      include: { condicionPago: true },
    })
    if (!compra) return

    const cuotas = compra.condicionPago?.cuotas ?? 1
    const diasBase = compra.condicionPago?.diasVencimiento ?? 0
    const diasAdic = (compra.condicionPago?.diasAdicionales as number[] | null) ?? []

    if (cuotas === 1 && diasBase === 0) return

    const montoCuota = Math.round((compra.total / cuotas) * 100) / 100
    const fechaBase = compra.fecha

    for (let i = 0; i < cuotas; i++) {
      const dias = i === 0 ? diasBase : (diasAdic[i - 1] ?? diasBase * (i + 1))
      const vencimiento = new Date(fechaBase)
      vencimiento.setDate(vencimiento.getDate() + dias)

      const monto = i === cuotas - 1
        ? compra.total - montoCuota * (cuotas - 1)
        : montoCuota

      await prisma.cuentaPagar.create({
        data: {
          compraId: compra.id,
          proveedorId: compra.proveedorId,
          numeroCuota: i + 1,
          montoOriginal: monto,
          saldo: monto,
          fechaEmision: fechaBase,
          fechaVencimiento: vencimiento,
        },
      })
    }
  }

  /**
   * Apply payment (OrdenPago) to one or more CuentaPagar records.
   */
  async aplicarOrdenPago(proveedorId: number, items: { cuentaPagarId: number; monto: number }[]): Promise<number> {
    const montoTotal = items.reduce((acc, i) => acc + i.monto, 0)

    const ultimo = await prisma.ordenPago.findFirst({ orderBy: { numero: "desc" } })
    const numero = String((parseInt(ultimo?.numero ?? "0", 10) + 1)).padStart(8, "0")

    const op = await prisma.ordenPago.create({
      data: {
        numero,
        fecha: new Date(),
        montoTotal,
        proveedorId,
        items: {
          create: items.map((i) => ({
            cuentaPagarId: i.cuentaPagarId,
            montoPagado: i.monto,
          })),
        },
      },
    })

    for (const item of items) {
      const cp = await prisma.cuentaPagar.findUnique({ where: { id: item.cuentaPagarId } })
      if (!cp) continue

      const nuevoSaldo = Number(cp.saldo) - item.monto
      const nuevoPagado = Number(cp.montoPagado) + item.monto

      await prisma.cuentaPagar.update({
        where: { id: item.cuentaPagarId },
        data: {
          montoPagado: nuevoPagado,
          saldo: Math.max(0, nuevoSaldo),
          estado: nuevoSaldo <= 0 ? "pagada" : "parcial",
        },
      })
    }

    return op.id
  }

  /**
   * Aging report for CP.
   */
  async agingCP(proveedorId?: number) {
    const where: any = { estado: { in: ["pendiente", "parcial", "vencida"] } }
    if (proveedorId) where.proveedorId = proveedorId

    const cuentas = await prisma.cuentaPagar.findMany({
      where,
      include: { proveedor: { select: { id: true, nombre: true, cuit: true } } },
      orderBy: { fechaVencimiento: "asc" },
    })

    const hoy = new Date()
    const buckets = { corriente: 0, d30: 0, d60: 0, d90: 0, mas90: 0 }
    const detalle: any[] = []

    for (const cp of cuentas) {
      const saldo = Number(cp.saldo)
      const diasVencido = Math.floor((hoy.getTime() - new Date(cp.fechaVencimiento).getTime()) / 86400000)

      if (diasVencido <= 0) buckets.corriente += saldo
      else if (diasVencido <= 30) buckets.d30 += saldo
      else if (diasVencido <= 60) buckets.d60 += saldo
      else if (diasVencido <= 90) buckets.d90 += saldo
      else buckets.mas90 += saldo

      if (diasVencido > 0 && cp.estado === "pendiente") {
        await prisma.cuentaPagar.update({ where: { id: cp.id }, data: { estado: "vencida" } })
      }

      detalle.push({
        id: cp.id,
        proveedor: cp.proveedor,
        compraId: cp.compraId,
        cuota: cp.numeroCuota,
        montoOriginal: Number(cp.montoOriginal),
        saldo,
        fechaVencimiento: cp.fechaVencimiento,
        diasVencido: Math.max(0, diasVencido),
      })
    }

    return { buckets, total: Object.values(buckets).reduce((a, b) => a + b, 0), detalle }
  }
}

// ─── EVENT BUS HANDLER REGISTRATION ─────────────────────────────────────────────

const cuentasService = new CuentasService()

eventBus.on<FacturaEmitidaPayload>("FACTURA_EMITIDA", "cc_por_venta", async (event) => {
  await cuentasService.generarCCPorFactura(event.payload.facturaId)
})

eventBus.on<CompraRegistradaPayload>("COMPRA_REGISTRADA", "cp_por_compra", async (event) => {
  await cuentasService.generarCPPorCompra(event.payload.compraId)
})

export { cuentasService }
