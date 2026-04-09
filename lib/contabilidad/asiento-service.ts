import { prisma } from "@/lib/prisma"
import { getCuentaLabel } from "@/lib/config/parametro-service"
import { periodoFiscalService } from "@/lib/contabilidad/periodo-fiscal-service"
import type { AsientoContableData } from "@/lib/types"

// Default empresaId used when caller doesn't supply one.
// In a real multi-tenant deployment this comes from the auth context.
const DEFAULT_EMPRESA_ID = 1

export class AsientoService {
  async generarAsientoVenta(facturaId: number, empresaId = DEFAULT_EMPRESA_ID): Promise<void> {
    try {
      const factura = await prisma.factura.findUnique({
        where: { id: facturaId },
        include: { lineas: true, cliente: true },
      })
      if (!factura) throw new Error("Factura no encontrada")

      // Validate fiscal period is open
      await periodoFiscalService.validarPeriodoAbierto(factura.createdAt, empresaId)

      // Resolve account names from DB config (or fallback to hardcoded)
      const [ctaCaja, ctaVentas, ctaIvaDF, ctaPercepciones] = await Promise.all([
        getCuentaLabel(empresaId, "venta", "caja", "1.1", "Caja"),
        getCuentaLabel(empresaId, "venta", "ingreso", "4.1", "Ventas"),
        getCuentaLabel(empresaId, "venta", "iva_df", "2.2", "IVA Débito Fiscal"),
        getCuentaLabel(empresaId, "venta", "percepciones", "2.3", "Percepciones a Pagar"),
      ])

      const ultimoAsiento = await prisma.asientoContable.findFirst({ orderBy: { numero: "desc" } })
      const numeroAsiento = (ultimoAsiento?.numero || 0) + 1

      await prisma.asientoContable.create({
        data: {
          fecha: factura.createdAt,
          numero: numeroAsiento,
          descripcion: `Venta según Factura ${factura.tipo} ${factura.numero.toString().padStart(8, "0")} - Cliente: ${factura.cliente.nombre}`,
          tipo: "venta",
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
        include: { movimientos: true },
      })

      // Asiento generado - observable via DB query
    } catch (error) {
      console.error("Error al generar asiento de venta:", error)
      throw error
    }
  }

  async generarAsientoCompra(compraId: number, empresaId = DEFAULT_EMPRESA_ID): Promise<void> {
    try {
      const compra = await prisma.compra.findUnique({
        where: { id: compraId },
        include: { lineas: true, proveedor: true },
      })
      if (!compra) throw new Error("Compra no encontrada")

      // Validate fiscal period is open
      await periodoFiscalService.validarPeriodoAbierto(compra.fecha, empresaId)

      const [ctaMercaderia, ctaIvaCF, ctaProveedores] = await Promise.all([
        getCuentaLabel(empresaId, "compra", "mercaderia", "1.4", "Mercaderías"),
        getCuentaLabel(empresaId, "compra", "iva_cf", "1.6", "IVA Crédito Fiscal"),
        getCuentaLabel(empresaId, "compra", "proveedores", "2.1", "Proveedores"),
      ])

      const ultimoAsiento = await prisma.asientoContable.findFirst({ orderBy: { numero: "desc" } })
      const numeroAsiento = (ultimoAsiento?.numero || 0) + 1

      await prisma.asientoContable.create({
        data: {
          fecha: compra.fecha,
          numero: numeroAsiento,
          descripcion: `Compra según Factura ${compra.tipo} ${compra.numero} - Proveedor: ${compra.proveedor.nombre}`,
          tipo: "compra",
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
        include: { movimientos: true },
      })

      // Asiento generado - observable via DB query
    } catch (error) {
      console.error("Error al generar asiento de compra:", error)
      throw error
    }
  }

  async crearAsientoManual(data: AsientoContableData & { empresaId?: number }): Promise<void> {
    try {
      const eid = data.empresaId ?? DEFAULT_EMPRESA_ID
      // Validate fiscal period is open
      await periodoFiscalService.validarPeriodoAbierto(data.fecha, eid)

      // Validar que el asiento esté balanceado
      const totalDebe = data.movimientos.reduce((sum, m) => sum + m.debe, 0)
      const totalHaber = data.movimientos.reduce((sum, m) => sum + m.haber, 0)

      if (Math.abs(totalDebe - totalHaber) > 0.01) {
        throw new Error("El asiento no está balanceado. Debe = Haber")
      }

      // Crear el asiento
      await prisma.asientoContable.create({
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
    } catch (error) {
      console.error("Error al crear asiento manual:", error)
      throw error
    }
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

  async obtenerLibroMayor(cuenta: string, fechaDesde: Date, fechaHasta: Date) {
    const movimientos = await prisma.movimientoContable.findMany({
      where: {
        cuenta,
        asiento: {
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

    // Calcular saldo acumulado
    let saldo = 0
    const movimientosConSaldo = movimientos.map((m) => {
      saldo += m.debe - m.haber
      return {
        ...m,
        saldo,
      }
    })

    return movimientosConSaldo
  }

  async obtenerBalanceSumas() {
    const movimientos = await prisma.movimientoContable.findMany({
      include: {
        asiento: true,
      },
    })

    // Agrupar por cuenta
    const cuentas = new Map<string, { debe: number; haber: number; saldo: number }>()

    movimientos.forEach((m) => {
      const cuenta = cuentas.get(m.cuenta) || { debe: 0, haber: 0, saldo: 0 }
      cuenta.debe += m.debe
      cuenta.haber += m.haber
      cuenta.saldo += m.debe - m.haber
      cuentas.set(m.cuenta, cuenta)
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
    try {
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

      const ultimoAsiento = await prisma.asientoContable.findFirst({ orderBy: { numero: "desc" } })
      const numeroAsiento = (ultimoAsiento?.numero || 0) + 1

      await prisma.asientoContable.create({
        data: {
          fecha: new Date(),
          numero: numeroAsiento,
          descripcion: `NC ${nc.tipo} Nº ${nc.numero.toString().padStart(8, "0")} - ${nc.motivo} - Cliente: ${nc.cliente.nombre}`,
          tipo: "manual",
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

      // Asiento NC generado - observable via DB query
    } catch (error) {
      console.error("Error al generar asiento de NC:", error)
      throw error
    }
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
    try {
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

      const ultimoAsiento = await prisma.asientoContable.findFirst({ orderBy: { numero: "desc" } })
      const numeroAsiento = (ultimoAsiento?.numero ?? 0) + 1

      await prisma.asientoContable.create({
        data: {
          fecha: factura.createdAt,
          numero: numeroAsiento,
          descripcion: `CMV Factura ${factura.tipo} ${factura.numero.toString().padStart(8, "0")} - ${factura.cliente.nombre}`,
          tipo: "cmv",
          facturaId: factura.id,
          movimientos: {
            create: [
              { cuenta: ctaCMV, debe: totalCMV, haber: 0 },
              { cuenta: ctaMercaderia, debe: 0, haber: totalCMV },
            ],
          },
        },
      })

      // Asiento CMV generado - observable via DB query
    } catch (error) {
      console.error("Error al generar asiento de CMV:", error)
      throw error
    }
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

    const ultimoAsiento = await prisma.asientoContable.findFirst({ orderBy: { numero: "desc" } })
    const numeroAsiento = (ultimoAsiento?.numero ?? 0) + 1

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
    const asiento = await prisma.asientoContable.create({
      data: {
        fecha: fechaHasta,
        numero: numeroAsiento,
        descripcion: `Liquidación IVA ${mesStr}/${periodo.anio} — ${posicion === "a_pagar" ? "Saldo a pagar" : "Saldo a favor"}: $${saldo.toFixed(2)}`,
        tipo: "liquidacion_iva",
        movimientos: { create: movimientos },
      },
    })

    // Liquidación IVA completada - observable via DB query

    return { debitoFiscal, creditoFiscal, saldo, posicion, asientoId: asiento.id }
  }
}
