/**
 * Estados Financieros — Balance General y Estado de Resultados
 *
 * Genera EECC a partir de los movimientos contables y el plan de cuentas.
 * Clasificación basada en CuentaContable.tipo: activo | pasivo | patrimonio | ingreso | egreso
 */

import { prisma } from "@/lib/prisma"

interface LineaBalance {
  codigo: string
  nombre: string
  categoria: string
  tipo: string
  saldo: number
}

interface BalanceGeneral {
  fechaCorte: Date
  activo: { total: number; detalle: LineaBalance[] }
  pasivo: { total: number; detalle: LineaBalance[] }
  patrimonioNeto: { total: number; detalle: LineaBalance[] }
  resultadoEjercicio: number
  cuadra: boolean
}

interface EstadoResultados {
  fechaDesde: Date
  fechaHasta: Date
  ingresos: { total: number; detalle: LineaBalance[] }
  egresos: { total: number; detalle: LineaBalance[] }
  resultadoBruto: number
  resultadoNeto: number
}

export class EstadosFinancierosService {
  /**
   * Balance General (Estado de Situación Patrimonial)
   * Activo = Pasivo + Patrimonio Neto + Resultado del Ejercicio
   */
  async generarBalanceGeneral(fechaCorte: Date, empresaId: number): Promise<BalanceGeneral> {
    // Get all movements up to fechaCorte
    const movimientos = await prisma.movimientoContable.findMany({
      where: {
        asiento: {
          fecha: { lte: fechaCorte },
          empresaId,
        },
      },
      include: {
        asiento: { select: { fecha: true, empresaId: true } },
      },
    })

    // Get plan de cuentas for classification
    const cuentasContables = await prisma.cuentaContable.findMany({
      where: { empresaId, activo: true, imputable: true },
    })
    const cuentaMap = new Map(cuentasContables.map((c) => [c.codigo, c]))

    // Aggregate saldos by cuenta
    const saldos = new Map<string, number>()
    for (const m of movimientos) {
      const actual = saldos.get(m.cuenta) ?? 0
      saldos.set(m.cuenta, actual + m.debe - m.haber)
    }

    // Classify by tipo
    const activo: LineaBalance[] = []
    const pasivo: LineaBalance[] = []
    const patrimonioNeto: LineaBalance[] = []
    const ingresos: LineaBalance[] = []
    const egresos: LineaBalance[] = []

    for (const [codigo, saldo] of saldos) {
      if (Math.abs(saldo) < 0.01) continue

      const cuenta = cuentaMap.get(codigo)
      const linea: LineaBalance = {
        codigo,
        nombre: cuenta?.nombre ?? codigo,
        categoria: cuenta?.categoria ?? "",
        tipo: cuenta?.tipo ?? "activo",
        saldo,
      }

      switch (cuenta?.tipo) {
        case "activo":
          activo.push(linea)
          break
        case "pasivo":
          pasivo.push({ ...linea, saldo: Math.abs(saldo) })
          break
        case "patrimonio":
          patrimonioNeto.push({ ...linea, saldo: Math.abs(saldo) })
          break
        case "ingreso":
          ingresos.push(linea)
          break
        case "egreso":
          egresos.push(linea)
          break
        default:
          // Cuentas sin clasificar van a activo si saldo deudor, pasivo si acreedor
          if (saldo > 0) activo.push(linea)
          else pasivo.push({ ...linea, saldo: Math.abs(saldo) })
      }
    }

    // Sort by codigo
    const sortByCodigo = (a: LineaBalance, b: LineaBalance) => a.codigo.localeCompare(b.codigo)
    activo.sort(sortByCodigo)
    pasivo.sort(sortByCodigo)
    patrimonioNeto.sort(sortByCodigo)

    const totalActivo = activo.reduce((s, l) => s + l.saldo, 0)
    const totalPasivo = pasivo.reduce((s, l) => s + l.saldo, 0)
    const totalPN = patrimonioNeto.reduce((s, l) => s + l.saldo, 0)
    const totalIngresos = ingresos.reduce((s, l) => s + Math.abs(l.saldo), 0)
    const totalEgresos = egresos.reduce((s, l) => s + Math.abs(l.saldo), 0)
    const resultadoEjercicio = totalIngresos - totalEgresos

    return {
      fechaCorte,
      activo: { total: totalActivo, detalle: activo },
      pasivo: { total: totalPasivo, detalle: pasivo },
      patrimonioNeto: { total: totalPN, detalle: patrimonioNeto },
      resultadoEjercicio,
      cuadra: Math.abs(totalActivo - (totalPasivo + totalPN + resultadoEjercicio)) < 0.01,
    }
  }

  /**
   * Estado de Resultados (P&L) — Ingresos vs Egresos en un período
   */
  async generarEstadoResultados(fechaDesde: Date, fechaHasta: Date, empresaId: number): Promise<EstadoResultados> {
    const movimientos = await prisma.movimientoContable.findMany({
      where: {
        asiento: {
          fecha: { gte: fechaDesde, lte: fechaHasta },
          empresaId,
        },
      },
      include: {
        asiento: { select: { fecha: true, empresaId: true } },
      },
    })

    const cuentasContables = await prisma.cuentaContable.findMany({
      where: { empresaId, activo: true, imputable: true, tipo: { in: ["ingreso", "egreso"] } },
    })
    const cuentaMap = new Map(cuentasContables.map((c) => [c.codigo, c]))

    const saldos = new Map<string, number>()
    for (const m of movimientos) {
      const actual = saldos.get(m.cuenta) ?? 0
      saldos.set(m.cuenta, actual + m.debe - m.haber)
    }

    const ingresos: LineaBalance[] = []
    const egresos: LineaBalance[] = []

    for (const [codigo, saldo] of saldos) {
      const cuenta = cuentaMap.get(codigo)
      if (!cuenta) continue

      const linea: LineaBalance = {
        codigo,
        nombre: cuenta.nombre,
        categoria: cuenta.categoria,
        tipo: cuenta.tipo,
        saldo: Math.abs(saldo),
      }

      if (cuenta.tipo === "ingreso") ingresos.push(linea)
      else if (cuenta.tipo === "egreso") egresos.push(linea)
    }

    const sortByCodigo = (a: LineaBalance, b: LineaBalance) => a.codigo.localeCompare(b.codigo)
    ingresos.sort(sortByCodigo)
    egresos.sort(sortByCodigo)

    const totalIngresos = ingresos.reduce((s, l) => s + l.saldo, 0)
    const totalEgresos = egresos.reduce((s, l) => s + l.saldo, 0)

    return {
      fechaDesde,
      fechaHasta,
      ingresos: { total: totalIngresos, detalle: ingresos },
      egresos: { total: totalEgresos, detalle: egresos },
      resultadoBruto: totalIngresos - totalEgresos,
      resultadoNeto: totalIngresos - totalEgresos,
    }
  }

  /**
   * Cierre de ejercicio — Genera asiento de refundición
   * Debita cuentas de ingreso (las cierra) y acredita cuentas de egreso (las cierra)
   * El neto va a Resultados del Ejercicio (patrimonio)
   */
  async cerrarEjercicio(ejercicioId: number, empresaId: number): Promise<{ asientoId: number }> {
    const ejercicio = await prisma.ejercicioContable.findUnique({
      where: { id: ejercicioId },
    })
    if (!ejercicio) throw new Error("Ejercicio no encontrado")
    if (ejercicio.estado === "cerrado") throw new Error("El ejercicio ya está cerrado")

    // Get P&L for the exercise period
    const eerr = await this.generarEstadoResultados(ejercicio.fechaInicio, ejercicio.fechaFin, empresaId)

    // Build refundición movements
    const movimientos: { cuenta: string; debe: number; haber: number }[] = []

    // Close income accounts (debit to zero them)
    for (const ingreso of eerr.ingresos.detalle) {
      if (ingreso.saldo > 0) {
        movimientos.push({ cuenta: ingreso.codigo, debe: ingreso.saldo, haber: 0 })
      }
    }

    // Close expense accounts (credit to zero them)
    for (const egreso of eerr.egresos.detalle) {
      if (egreso.saldo > 0) {
        movimientos.push({ cuenta: egreso.codigo, debe: 0, haber: egreso.saldo })
      }
    }

    // Net result to "Resultados del Ejercicio" account
    const ctaResultado = "3.3" // Patrimonio → Resultados del Ejercicio
    if (eerr.resultadoNeto > 0) {
      movimientos.push({ cuenta: ctaResultado, debe: 0, haber: eerr.resultadoNeto })
    } else if (eerr.resultadoNeto < 0) {
      movimientos.push({ cuenta: ctaResultado, debe: Math.abs(eerr.resultadoNeto), haber: 0 })
    }

    if (movimientos.length === 0) throw new Error("No hay movimientos de resultado para cerrar")

    const asiento = await prisma.$transaction(async (tx) => {
      const ultimo = await tx.asientoContable.findFirst({ orderBy: { numero: "desc" } })
      const numero = (ultimo?.numero ?? 0) + 1

      const created = await tx.asientoContable.create({
        data: {
          fecha: ejercicio.fechaFin,
          numero,
          descripcion: `Cierre de Ejercicio — ${ejercicio.nombre}`,
          tipo: "cierre",
          empresaId,
          movimientos: { create: movimientos },
        },
      })

      await tx.ejercicioContable.update({
        where: { id: ejercicioId },
        data: {
          estado: "cerrado",
          asientoCierreId: created.id,
          fechaCierre: new Date(),
        },
      })

      return created
    })

    return { asientoId: asiento.id }
  }
}

export const estadosFinancierosService = new EstadosFinancierosService()
