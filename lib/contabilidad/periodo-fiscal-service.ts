/**
 * Período Fiscal Service
 *
 * Manages accounting periods (months) with open/closed/locked states.
 * Once a period is closed, no transactions (asientos, facturas, compras)
 * can be created with dates falling within that period.
 *
 * States:
 *   abierto   → normal operation, transactions allowed
 *   cerrado   → month-end close executed, re-openable by admin
 *   bloqueado → submitted to AFIP, not re-openable without audit trail
 *
 * Usage:
 *   Before creating any transaction, call `validarPeriodoAbierto(fecha, empresaId)`
 *   to ensure the target period is open.
 */

import { prisma } from "@/lib/prisma"

export class PeriodoFiscalService {

  /**
   * Validate that the period for a given date is open for transactions.
   * Throws if the period is closed or locked.
   * If no period record exists, auto-creates it as "abierto".
   */
  async validarPeriodoAbierto(fecha: Date, empresaId: number): Promise<void> {
    const mes = fecha.getMonth() + 1
    const anio = fecha.getFullYear()

    const periodo = await prisma.periodoFiscal.findUnique({
      where: { empresaId_mes_anio: { empresaId, mes, anio } },
    })

    if (!periodo) {
      // Auto-create as open
      await prisma.periodoFiscal.create({
        data: { empresaId, mes, anio, estado: "abierto" },
      })
      return
    }

    if (periodo.estado === "cerrado") {
      throw new Error(
        `El período ${String(mes).padStart(2, "0")}/${anio} está CERRADO. ` +
        `Debe reabrir el período antes de registrar transacciones.`
      )
    }

    if (periodo.estado === "bloqueado") {
      throw new Error(
        `El período ${String(mes).padStart(2, "0")}/${anio} está BLOQUEADO (presentado ante AFIP). ` +
        `No se pueden registrar transacciones en este período.`
      )
    }
  }

  /**
   * Close a period. Prevents new transactions in this month.
   */
  async cerrarPeriodo(
    mes: number,
    anio: number,
    empresaId: number,
    usuarioId: number,
    observaciones?: string
  ) {
    const periodo = await this.getOCrear(mes, anio, empresaId)

    if (periodo.estado === "bloqueado") {
      throw new Error("El período está bloqueado y no puede cerrarse nuevamente.")
    }

    // Validate: all previous periods should be closed
    const mesAnterior = mes === 1 ? 12 : mes - 1
    const anioAnterior = mes === 1 ? anio - 1 : anio
    const periodoAnterior = await prisma.periodoFiscal.findUnique({
      where: { empresaId_mes_anio: { empresaId, mes: mesAnterior, anio: anioAnterior } },
    })
    if (periodoAnterior && periodoAnterior.estado === "abierto") {
      throw new Error(
        `No se puede cerrar ${String(mes).padStart(2, "0")}/${anio} porque el período anterior ` +
        `${String(mesAnterior).padStart(2, "0")}/${anioAnterior} aún está abierto.`
      )
    }

    // Calculate summary before closing
    const fechaDesde = new Date(anio, mes - 1, 1)
    const fechaHasta = new Date(anio, mes, 0, 23, 59, 59, 999)

    const [asientos, facturas, compras] = await Promise.all([
      prisma.asientoContable.count({
        where: { fecha: { gte: fechaDesde, lte: fechaHasta }, deletedAt: null },
      }),
      prisma.factura.count({
        where: { createdAt: { gte: fechaDesde, lte: fechaHasta }, deletedAt: null },
      }),
      prisma.compra.count({
        where: { fecha: { gte: fechaDesde, lte: fechaHasta }, deletedAt: null },
      }),
    ])

    const updated = await prisma.periodoFiscal.update({
      where: { id: periodo.id },
      data: {
        estado: "cerrado",
        fechaCierre: new Date(),
        cerradoPor: usuarioId,
        observaciones: observaciones ?? `Cierre contable ${String(mes).padStart(2, "0")}/${anio}`,
      },
    })

    return {
      periodo: updated,
      resumen: { asientos, facturas, compras },
    }
  }

  /**
   * Reopen a closed period (admin only). Locked periods cannot be reopened.
   */
  async reabrirPeriodo(mes: number, anio: number, empresaId: number, usuarioId: number) {
    const periodo = await prisma.periodoFiscal.findUnique({
      where: { empresaId_mes_anio: { empresaId, mes, anio } },
    })

    if (!periodo) throw new Error("Período no encontrado.")
    if (periodo.estado === "abierto") throw new Error("El período ya está abierto.")
    if (periodo.estado === "bloqueado") {
      throw new Error("El período está bloqueado (presentado ante AFIP). No se puede reabrir.")
    }

    return prisma.periodoFiscal.update({
      where: { id: periodo.id },
      data: {
        estado: "abierto",
        observaciones: `Reabierto por usuario ${usuarioId} el ${new Date().toISOString()}`,
      },
    })
  }

  /**
   * Lock a period permanently (after AFIP submission).
   */
  async bloquearPeriodo(mes: number, anio: number, empresaId: number) {
    const periodo = await prisma.periodoFiscal.findUnique({
      where: { empresaId_mes_anio: { empresaId, mes, anio } },
    })

    if (!periodo) throw new Error("Período no encontrado.")
    if (periodo.estado === "abierto") {
      throw new Error("Debe cerrar el período antes de bloquearlo.")
    }

    return prisma.periodoFiscal.update({
      where: { id: periodo.id },
      data: { estado: "bloqueado" },
    })
  }

  /**
   * List all periods for an empresa, with status and transaction counts.
   */
  async listarPeriodos(empresaId: number, anio?: number) {
    const where: any = { empresaId }
    if (anio) where.anio = anio

    const periodos = await prisma.periodoFiscal.findMany({
      where,
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
    })

    // Enrich with transaction counts
    const enriched = await Promise.all(
      periodos.map(async (p) => {
        const fechaDesde = new Date(p.anio, p.mes - 1, 1)
        const fechaHasta = new Date(p.anio, p.mes, 0, 23, 59, 59, 999)

        const [asientos, facturas, compras] = await Promise.all([
          prisma.asientoContable.count({
            where: { fecha: { gte: fechaDesde, lte: fechaHasta }, deletedAt: null },
          }),
          prisma.factura.count({
            where: { createdAt: { gte: fechaDesde, lte: fechaHasta }, deletedAt: null },
          }),
          prisma.compra.count({
            where: { fecha: { gte: fechaDesde, lte: fechaHasta }, deletedAt: null },
          }),
        ])

        return { ...p, conteo: { asientos, facturas, compras } }
      })
    )

    return enriched
  }

  /**
   * Get current period status for a date range display.
   * Generates 12 months for a given year, filling in missing periods as "abierto".
   */
  async getAnioCompleto(empresaId: number, anio: number) {
    const existentes = await prisma.periodoFiscal.findMany({
      where: { empresaId, anio },
      orderBy: { mes: "asc" },
    })

    const meses = []
    const MESES_LABEL = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ]

    for (let m = 1; m <= 12; m++) {
      const existente = existentes.find((p) => p.mes === m)
      meses.push({
        mes: m,
        anio,
        label: MESES_LABEL[m - 1],
        estado: existente?.estado ?? "abierto",
        fechaCierre: existente?.fechaCierre ?? null,
        cerradoPor: existente?.cerradoPor ?? null,
        id: existente?.id ?? null,
      })
    }

    return meses
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private async getOCrear(mes: number, anio: number, empresaId: number) {
    const existing = await prisma.periodoFiscal.findUnique({
      where: { empresaId_mes_anio: { empresaId, mes, anio } },
    })
    if (existing) return existing

    return prisma.periodoFiscal.create({
      data: { empresaId, mes, anio, estado: "abierto" },
    })
  }
}

export const periodoFiscalService = new PeriodoFiscalService()
