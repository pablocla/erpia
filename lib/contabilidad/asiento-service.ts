import { prisma } from "@/lib/prisma"
import type { PrismaClient } from "@prisma/client"
import { getCuentaLabel } from "@/lib/config/parametro-service"
import { periodoFiscalService } from "@/lib/contabilidad/periodo-fiscal-service"
import type { AsientoContableData } from "@/lib/types"

// Default empresaId used when caller doesn't supply one.
// In a real multi-tenant deployment this comes from the auth context.
const DEFAULT_EMPRESA_ID = 1

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">

/**
 * Resolve TipoAsiento ID by codigo. Returns undefined if not found (backward compatible).
 */
async function resolveTipoAsientoId(codigo: string, empresaId: number, tx: TxClient = prisma): Promise<number | undefined> {
  const tipo = await tx.tipoAsiento.findFirst({ where: { empresaId, codigo, activo: true } })
  return tipo?.id ?? undefined
}

/**
 * Get next asiento number inside a transaction to prevent race conditions.
 */
async function nextNumeroAsiento(tx: TxClient): Promise<number> {
  const ultimo = await tx.asientoContable.findFirst({ orderBy: { numero: "desc" } })
  return (ultimo?.numero ?? 0) + 1
}

export class AsientoService {
  async generarAsientoVenta(facturaId: number, empresaId = DEFAULT_EMPRESA_ID): Promise<void> {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: { lineas: true, cliente: true },
    })
    if (!factura) throw new Error("Factura no encontrada")

    await periodoFiscalService.validarPeriodoAbierto(factura.createdAt, empresaId)

    const [ctaCaja, ctaVentas, ctaIvaDF, ctaPercepciones] = await Promise.all([
      getCuentaLabel(empresaId, "venta", "caja", "1.1", "Caja"),
      getCuentaLabel(empresaId, "venta", "ingreso", "4.1", "Ventas"),
      getCuentaLabel(empresaId, "venta", "iva_df", "2.2", "IVA Débito Fiscal"),
      getCuentaLabel(empresaId, "venta", "percepciones", "2.3", "Percepciones a Pagar"),
    ])

    await prisma.$transaction(async (tx) => {
      const numero = await nextNumeroAsiento(tx)

      await tx.asientoContable.create({
        data: {
          fecha: factura.createdAt,
          numero,
          descripcion: `Venta según Factura ${factura.tipo} ${factura.numero.toString().padStart(8, "0")} - Cliente: ${factura.cliente.nombre}`,
          tipo: "venta",
          tipoAsientoId: await resolveTipoAsientoId("VENTA", empresaId, tx),
          facturaId: factura.id,
          empresaId,
          movimientos: {
            create: [
              { cuenta: ctaCaja, debe: factura.total + (factura.totalPercepciones ?? 0), haber: 0 },
              { cuenta: ctaVentas, debe: 0, haber: factura.subtotal },
              { cuenta: ctaIvaDF, debe: 0, haber: factura.iva },
              ...((factura.totalPercepciones ?? 0) > 0
                ? [{ cuenta: ctaPercepciones, debe: 0, haber: factura.totalPercepciones }]
                : []),
            ],
          },
        },
      })
    })
  }

  async generarAsientoCompra(compraId: number, empresaId = DEFAULT_EMPRESA_ID): Promise<void> {
    const compra = await prisma.compra.findUnique({
      where: { id: compraId },
      include: { lineas: true, proveedor: true },
    })
    if (!compra) throw new Error("Compra no encontrada")

    await periodoFiscalService.validarPeriodoAbierto(compra.fecha, empresaId)

    const [ctaMercaderia, ctaIvaCF, ctaProveedores] = await Promise.all([
      getCuentaLabel(empresaId, "compra", "mercaderia", "1.4", "Mercaderías"),
      getCuentaLabel(empresaId, "compra", "iva_cf", "1.6", "IVA Crédito Fiscal"),
      getCuentaLabel(empresaId, "compra", "proveedores", "2.1", "Proveedores"),
    ])

    await prisma.$transaction(async (tx) => {
      const numero = await nextNumeroAsiento(tx)

      await tx.asientoContable.create({
        data: {
          fecha: compra.fecha,
          numero,
          descripcion: `Compra según Factura ${compra.tipo} ${compra.numero} - Proveedor: ${compra.proveedor.nombre}`,
          tipo: "compra",
          tipoAsientoId: await resolveTipoAsientoId("COMPRA", empresaId, tx),
          compraId: compra.id,
          empresaId,
          movimientos: {
            create: [
              { cuenta: ctaMercaderia, debe: compra.subtotal, haber: 0 },
              { cuenta: ctaIvaCF, debe: compra.iva, haber: 0 },
              { cuenta: ctaProveedores, debe: 0, haber: compra.total },
            ],
          },
        },
      })
    })
  }

  async crearAsientoManual(data: AsientoContableData & { empresaId?: number }): Promise<void> {
    const eid = data.empresaId ?? DEFAULT_EMPRESA_ID
    await periodoFiscalService.validarPeriodoAbierto(data.fecha, eid)

    const totalDebe = data.movimientos.reduce((sum, m) => sum + m.debe, 0)
    const totalHaber = data.movimientos.reduce((sum, m) => sum + m.haber, 0)

    if (Math.abs(totalDebe - totalHaber) > 0.01) {
      throw new Error("El asiento no está balanceado. Debe = Haber")
    }

    await prisma.$transaction(async (tx) => {
      await tx.asientoContable.create({
        data: {
          fecha: data.fecha,
          numero: data.numero,
          descripcion: data.descripcion,
          tipo: data.tipo,
          empresaId: eid,
          movimientos: {
            create: data.movimientos,
          },
        },
      })
    })
  }

  async obtenerLibroDiario(fechaDesde: Date, fechaHasta: Date, empresaId?: number) {
    const where: Record<string, unknown> = {
      fecha: {
        gte: fechaDesde,
        lte: fechaHasta,
      },
    }
    if (empresaId) where.empresaId = empresaId

    const asientos = await prisma.asientoContable.findMany({
      where,
      include: {
        movimientos: true,
      },
      orderBy: {
        numero: "asc",
      },
    })

    return asientos
  }

  async obtenerLibroMayor(cuenta: string, fechaDesde: Date, fechaHasta: Date, empresaId?: number) {
    const movimientos = await prisma.movimientoContable.findMany({
      where: {
        cuenta,
        asiento: {
          ...(empresaId ? { empresaId } : {}),
          fecha: {
            gte: fechaDesde,
            lte: fechaHasta,
          },
        },
      },
      include: {
        asiento: true,
      },
      orderBy: {
        asiento: {
          fecha: "asc",
        },
      },
    })

    // Calcular saldo acumulado (Decimal → number para aritmética JS)
    let saldo = 0
    const movimientosConSaldo = movimientos.map((m) => {
      saldo += Number(m.debe) - Number(m.haber)
      return {
        ...m,
        debe: Number(m.debe),
        haber: Number(m.haber),
        saldo,
      }
    })

    return movimientosConSaldo
  }

  async obtenerBalanceSumas(empresaId?: number) {
    const movimientos = await prisma.movimientoContable.findMany({
      where: empresaId
        ? { asiento: { empresaId } }
        : undefined,
      include: {
        asiento: true,
      },
    })

    // Agrupar por cuenta (Decimal → number para aritmética JS)
    const cuentas = new Map<string, { debe: number; haber: number; saldo: number }>()

    movimientos.forEach((m) => {
      const debe = Number(m.debe)
      const haber = Number(m.haber)
      const acc = cuentas.get(m.cuenta) || { debe: 0, haber: 0, saldo: 0 }
      acc.debe += debe
      acc.haber += haber
      acc.saldo += debe - haber
      cuentas.set(m.cuenta, acc)
    })

    return Array.from(cuentas.entries()).map(([cuenta, totales]) => ({
      cuenta,
      debe: totales.debe,
      haber: totales.haber,
      saldo: totales.saldo,
    }))
  }

  async exportarAsientosCSV(fechaDesde: Date, fechaHasta: Date): Promise<string> {
    const asientos = await this.obtenerLibroDiario(fechaDesde, fechaHasta)

    let csv = "Número,Fecha,Descripción,Cuenta,Debe,Haber\n"

    asientos.forEach((asiento) => {
      asiento.movimientos.forEach((mov) => {
        const fecha = asiento.fecha.toISOString().split("T")[0]
        csv += `${asiento.numero},"${fecha}","${asiento.descripcion}","${mov.cuenta}",${mov.debe},${mov.haber}\n`
      })
    })

    return csv
  }

  async generarAsientoNC(ncId: number, empresaId = DEFAULT_EMPRESA_ID): Promise<void> {
    const nc = await prisma.notaCredito.findUnique({
      where: { id: ncId },
      include: { cliente: true, factura: true },
    })
    if (!nc) throw new Error("Nota de crédito no encontrada")

    const [ctaVentas, ctaIvaDF, ctaCaja] = await Promise.all([
      getCuentaLabel(empresaId, "nc", "ingreso", "4.1", "Ventas"),
      getCuentaLabel(empresaId, "nc", "iva_df", "2.2", "IVA Débito Fiscal"),
      getCuentaLabel(empresaId, "nc", "caja", "1.1", "Caja"),
    ])

    await prisma.$transaction(async (tx) => {
      const numero = await nextNumeroAsiento(tx)

      await tx.asientoContable.create({
        data: {
          fecha: new Date(),
          numero,
          descripcion: `NC ${nc.tipo} Nº ${nc.numero.toString().padStart(8, "0")} - ${nc.motivo} - Cliente: ${nc.cliente.nombre}`,
          tipo: "manual",
          tipoAsientoId: await resolveTipoAsientoId("NC", empresaId, tx),
          empresaId,
          movimientos: {
            create: [
              { cuenta: ctaVentas, debe: nc.subtotal, haber: 0 },
              { cuenta: ctaIvaDF, debe: nc.iva, haber: 0 },
              { cuenta: ctaCaja, debe: 0, haber: nc.total },
            ],
          },
        },
      })
    })
  }

  /**
   * Asiento de Costo de Mercadería Vendida (CMV)
   * Triggered on FACTURA_EMITIDA for each line that has productoId.
   *
   * DEBE  5.1 CMV                    (costo)
   * HABER 1.4 Mercaderías             (costo)
   *
   * Uses weighted average cost (promedioPonderado) or product's costo field.
   */
  async generarAsientoCMV(facturaId: number, empresaId = DEFAULT_EMPRESA_ID): Promise<void> {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: {
        lineas: { include: { producto: true } },
        cliente: true,
      },
    })
    if (!factura) throw new Error("Factura no encontrada")

    let totalCMV = 0
    for (const linea of factura.lineas) {
      if (!linea.producto) continue
      const costo = Number(linea.producto.precioCompra ?? 0)
      totalCMV += costo * linea.cantidad
    }

    if (totalCMV <= 0) return

    const [ctaCMV, ctaMercaderia] = await Promise.all([
      getCuentaLabel(empresaId, "cmv", "cmv", "5.1", "CMV"),
      getCuentaLabel(empresaId, "cmv", "mercaderia", "1.4", "Mercaderías"),
    ])

    await prisma.$transaction(async (tx) => {
      const numero = await nextNumeroAsiento(tx)

      await tx.asientoContable.create({
        data: {
          empresaId,
          fecha: factura.createdAt,
          numero,
          descripcion: `CMV Factura ${factura.tipo} ${factura.numero.toString().padStart(8, "0")} - ${factura.cliente.nombre}`,
          tipo: "cmv",
          tipoAsientoId: await resolveTipoAsientoId("VENTA", empresaId, tx),
          facturaId: factura.id,
          movimientos: {
            create: [
              { cuenta: ctaCMV, debe: totalCMV, haber: 0 },
              { cuenta: ctaMercaderia, debe: 0, haber: totalCMV },
            ],
          },
        },
      })
    })
  }

  /**
   * Asiento de Liquidación de IVA mensual
   *
   * Cierra las cuentas transitorias de IVA DF e IVA CF contra IVA a Pagar (o IVA a Favor).
   * Se ejecuta una vez al mes al cierre del período fiscal.
   *
   * Si DF > CF:  DEBE IVA DF / HABER IVA CF / HABER IVA a Pagar
   * Si CF > DF:  DEBE IVA DF / DEBE IVA a Favor / HABER IVA CF
   */
  async generarAsientoLiquidacionIVA(periodo: { mes: number; anio: number }, empresaId = DEFAULT_EMPRESA_ID): Promise<{
    debitoFiscal: number
    creditoFiscal: number
    saldo: number
    posicion: "a_pagar" | "a_favor"
    asientoId: number
  }> {
    // Resolve account labels from DB config
    const [ctaIvaDF, ctaIvaCF, ctaIvaPagar, ctaIvaFavor] = await Promise.all([
      getCuentaLabel(empresaId, "liquidacion_iva", "iva_df", "2.2", "IVA Débito Fiscal"),
      getCuentaLabel(empresaId, "liquidacion_iva", "iva_cf", "1.6", "IVA Crédito Fiscal"),
      getCuentaLabel(empresaId, "liquidacion_iva", "iva_a_pagar", "2.5", "IVA a Pagar"),
      getCuentaLabel(empresaId, "liquidacion_iva", "iva_a_favor", "1.8", "IVA a Favor"),
    ])

    const fechaDesde = new Date(periodo.anio, periodo.mes - 1, 1)
    const fechaHasta = new Date(periodo.anio, periodo.mes, 0, 23, 59, 59)

    // Sum IVA DF — use the resolved label to match existing movimientos
    const movimientosDF = await prisma.movimientoContable.findMany({
      where: {
        cuenta: ctaIvaDF,
        asiento: { fecha: { gte: fechaDesde, lte: fechaHasta } },
      },
    })
    const debitoFiscal = movimientosDF.reduce((sum, m) => sum + m.haber - m.debe, 0)

    const movimientosCF = await prisma.movimientoContable.findMany({
      where: {
        cuenta: ctaIvaCF,
        asiento: { fecha: { gte: fechaDesde, lte: fechaHasta } },
      },
    })
    const creditoFiscal = movimientosCF.reduce((sum, m) => sum + m.debe - m.haber, 0)

    const saldo = Math.abs(debitoFiscal - creditoFiscal)
    const posicion = debitoFiscal >= creditoFiscal ? "a_pagar" as const : "a_favor" as const

    const movimientos: { cuenta: string; debe: number; haber: number }[] = []

    if (debitoFiscal > 0) {
      movimientos.push({ cuenta: ctaIvaDF, debe: debitoFiscal, haber: 0 })
    }
    if (creditoFiscal > 0) {
      movimientos.push({ cuenta: ctaIvaCF, debe: 0, haber: creditoFiscal })
    }
    if (posicion === "a_pagar") {
      movimientos.push({ cuenta: ctaIvaPagar, debe: 0, haber: saldo })
    } else {
      movimientos.push({ cuenta: ctaIvaFavor, debe: saldo, haber: 0 })
    }

    const mesStr = String(periodo.mes).padStart(2, "0")

    const asiento = await prisma.$transaction(async (tx) => {
      const numero = await nextNumeroAsiento(tx)

      return tx.asientoContable.create({
        data: {
          empresaId,
          fecha: fechaHasta,
          numero,
          descripcion: `Liquidación IVA ${mesStr}/${periodo.anio} — ${posicion === "a_pagar" ? "Saldo a pagar" : "Saldo a favor"}: $${saldo.toFixed(2)}`,
          tipo: "liquidacion_iva",
          movimientos: { create: movimientos },
        },
      })
    })

    return { debitoFiscal, creditoFiscal, saldo, posicion, asientoId: asiento.id }
  }

  /**
   * Anular (reverse) a journal entry by creating a mirror entry with swapped debe/haber.
   * The original entry is soft-deleted (deletedAt set).
   * Returns the reversal asiento ID.
   */
  async anularAsiento(asientoId: number, motivo: string, empresaId = DEFAULT_EMPRESA_ID): Promise<number> {
    const asiento = await prisma.asientoContable.findUnique({
      where: { id: asientoId },
      include: { movimientos: true },
    })
    if (!asiento) throw new Error("Asiento no encontrado")
    if (asiento.deletedAt) throw new Error("El asiento ya fue anulado")

    await periodoFiscalService.validarPeriodoAbierto(asiento.fecha, empresaId)

    const movimientosReversos = asiento.movimientos.map((m) => ({
      cuenta: m.cuenta,
      debe: m.haber,
      haber: m.debe,
    }))

    return prisma.$transaction(async (tx) => {
      const numero = await nextNumeroAsiento(tx)

      // Soft-delete original
      await tx.asientoContable.update({
        where: { id: asientoId },
        data: { deletedAt: new Date() },
      })

      // Create reversal entry
      const reverso = await tx.asientoContable.create({
        data: {
          empresaId,
          fecha: new Date(),
          numero,
          descripcion: `ANULACIÓN Asiento #${asiento.numero} — ${motivo}`,
          tipo: "anulacion",
          movimientos: { create: movimientosReversos },
        },
      })

      return reverso.id
    })
  }

  /**
   * Genera asiento de cobro (Recibo).
   * Delega en cobrosService que ya contiene la lógica inline.
   * Equivalente a:
   *   DEBE  Caja/Banco                  (netoRecibido)
   *   DEBE  Retenciones sufridas        (IVA/Ganancias/IIBB)
   *   HABER Deudores por Ventas         (montoTotal)
   */
  async generarAsientoCobro(reciboId: number, empresaId = DEFAULT_EMPRESA_ID): Promise<void> {
    const recibo = await prisma.recibo.findUnique({
      where: { id: reciboId },
      include: { cliente: true },
    })
    if (!recibo) throw new Error("Recibo no encontrado")

    const [ctaCaja, ctaBanco, ctaRetIVA, ctaRetGan, ctaRetIIBB, ctaDeudores] = await Promise.all([
      getCuentaLabel(empresaId, "cobro", "caja", "1.1.1", "Caja Moneda Nacional"),
      getCuentaLabel(empresaId, "cobro", "banco", "1.1.3", "Banco Cuenta Corriente"),
      getCuentaLabel(empresaId, "cobro", "ret_iva_sufrida", "1.5.2", "Retenciones de IVA Sufridas"),
      getCuentaLabel(empresaId, "cobro", "ret_gan_sufrida", "1.5.3", "Retenciones de Ganancias Sufridas"),
      getCuentaLabel(empresaId, "cobro", "ret_iibb_sufrida", "1.5.4", "Retenciones de IIBB Sufridas"),
      getCuentaLabel(empresaId, "cobro", "deudores", "1.3.1", "Deudores por Ventas"),
    ])

    const montoTotal = Number(recibo.montoTotal)
    const netoRecibido = Number(recibo.netoRecibido)
    const retencionIVA = Number(recibo.retencionIVA)
    const retencionGanancias = Number(recibo.retencionGanancias)
    const retencionIIBB = Number(recibo.retencionIIBB)

    const cuentaCaja = recibo.medioPago === "efectivo" ? ctaCaja : ctaBanco
    const movimientos: { cuenta: string; debe: number; haber: number }[] = []
    if (netoRecibido > 0) movimientos.push({ cuenta: cuentaCaja, debe: netoRecibido, haber: 0 })
    if (retencionIVA > 0) movimientos.push({ cuenta: ctaRetIVA, debe: retencionIVA, haber: 0 })
    if (retencionGanancias > 0) movimientos.push({ cuenta: ctaRetGan, debe: retencionGanancias, haber: 0 })
    if (retencionIIBB > 0) movimientos.push({ cuenta: ctaRetIIBB, debe: retencionIIBB, haber: 0 })
    movimientos.push({ cuenta: ctaDeudores, debe: 0, haber: montoTotal })

    await prisma.$transaction(async (tx) => {
      const numero = await nextNumeroAsiento(tx)
      await tx.asientoContable.create({
        data: {
          fecha: recibo.fecha,
          numero,
          descripcion: `Cobro Recibo ${recibo.numero} - Cliente: ${recibo.cliente.nombre}`,
          tipo: "cobro",
          tipoAsientoId: await resolveTipoAsientoId("COBRO", empresaId, tx),
          empresaId,
          movimientos: { create: movimientos },
        },
      })
    })
  }

  /**
   * Genera asiento de pago (Orden de Pago).
   * Equivalente a:
   *   DEBE  Proveedores               (montoTotal)
   *   HABER Caja/Banco                (netoPagado)
   *   HABER Retenciones a depositar   (IVA/Ganancias/IIBB)
   */
  async generarAsientoPago(ordenPagoId: number, empresaId = DEFAULT_EMPRESA_ID): Promise<void> {
    const op = await prisma.ordenPago.findUnique({
      where: { id: ordenPagoId },
      include: { proveedor: true },
    })
    if (!op) throw new Error("Orden de pago no encontrada")

    const [ctaProveedores, ctaCaja, ctaBanco, ctaRetIVADep, ctaRetGanDep, ctaRetIIBBDep] = await Promise.all([
      getCuentaLabel(empresaId, "pago", "proveedores", "2.1.1", "Proveedores"),
      getCuentaLabel(empresaId, "pago", "caja", "1.1.1", "Caja Moneda Nacional"),
      getCuentaLabel(empresaId, "pago", "banco", "1.1.3", "Banco Cuenta Corriente"),
      getCuentaLabel(empresaId, "pago", "ret_iva_depositar", "2.3.2", "Retenciones IVA a Depositar"),
      getCuentaLabel(empresaId, "pago", "ret_gan_depositar", "2.3.3", "Retenciones Ganancias a Depositar"),
      getCuentaLabel(empresaId, "pago", "ret_iibb_depositar", "2.3.4", "Retenciones IIBB a Depositar"),
    ])

    const montoTotal = Number(op.montoTotal)
    const netoPagado = Number(op.netoPagado)
    const retencionIVA = Number(op.retencionIVA)
    const retencionGanancias = Number(op.retencionGanancias)
    const retencionIIBB = Number(op.retencionIIBB)

    const cuentaBanco = op.medioPago === "efectivo" ? ctaCaja : ctaBanco
    const movimientos: { cuenta: string; debe: number; haber: number }[] = []
    movimientos.push({ cuenta: ctaProveedores, debe: montoTotal, haber: 0 })
    if (netoPagado > 0) movimientos.push({ cuenta: cuentaBanco, debe: 0, haber: netoPagado })
    if (retencionIVA > 0) movimientos.push({ cuenta: ctaRetIVADep, debe: 0, haber: retencionIVA })
    if (retencionGanancias > 0) movimientos.push({ cuenta: ctaRetGanDep, debe: 0, haber: retencionGanancias })
    if (retencionIIBB > 0) movimientos.push({ cuenta: ctaRetIIBBDep, debe: 0, haber: retencionIIBB })

    await prisma.$transaction(async (tx) => {
      const numero = await nextNumeroAsiento(tx)
      await tx.asientoContable.create({
        data: {
          fecha: op.fecha,
          numero,
          descripcion: `Pago Orden ${op.numero} - Proveedor: ${op.proveedor.nombre}`,
          tipo: "pago",
          tipoAsientoId: await resolveTipoAsientoId("PAGO", empresaId, tx),
          empresaId,
          movimientos: { create: movimientos },
        },
      })
    })
  }
}
