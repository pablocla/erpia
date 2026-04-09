/**
 * Activos Fijos Service — Fixed Assets & Depreciation
 *
 * Línea recta: depreciación = (valorCompra - valorResidual) / vidaUtilMeses
 * Generates monthly journal entries for depreciation.
 */

import { prisma } from "@/lib/prisma"
import { getCuentaLabel } from "@/lib/config/parametro-service"

const DEFAULT_EMPRESA_ID = 1

export interface ActivoFijoInput {
  descripcion: string
  categoria?: string
  fechaCompra: string
  valorCompra: number
  valorResidual?: number
  vidaUtilMeses?: number
  identificador?: string
  observaciones?: string
  cuentaActivoCodigo?: string
  cuentaAmortizacionCodigo?: string
  empresaId?: number
}

export class ActivoFijoService {
  async crear(input: ActivoFijoInput) {
    const empresaId = input.empresaId ?? DEFAULT_EMPRESA_ID
    const valorCompra = input.valorCompra
    const valorResidual = input.valorResidual ?? 0

    return prisma.activoFijo.create({
      data: {
        descripcion: input.descripcion,
        categoria: input.categoria ?? "mueble_utensilio",
        fechaCompra: new Date(input.fechaCompra),
        valorCompra,
        valorResidual,
        vidaUtilMeses: input.vidaUtilMeses ?? 60,
        valorLibros: valorCompra, // starts at purchase value
        estado: "activo",
        identificador: input.identificador ?? null,
        observaciones: input.observaciones ?? null,
        cuentaActivoCodigo: input.cuentaActivoCodigo ?? null,
        cuentaAmortizacionCodigo: input.cuentaAmortizacionCodigo ?? null,
        empresaId,
      },
    })
  }

  async listar(empresaId = DEFAULT_EMPRESA_ID, filtros?: { categoria?: string; estado?: string }) {
    const where: any = { empresaId }
    if (filtros?.categoria) where.categoria = filtros.categoria
    if (filtros?.estado) where.estado = filtros.estado

    return prisma.activoFijo.findMany({
      where,
      orderBy: { fechaCompra: "desc" },
    })
  }

  async obtener(id: number) {
    return prisma.activoFijo.findUnique({ where: { id } })
  }

  /**
   * Calculate monthly depreciation amount (línea recta)
   */
  calcularDepreciacionMensual(valorCompra: number, valorResidual: number, vidaUtilMeses: number): number {
    if (vidaUtilMeses <= 0) return 0
    return (valorCompra - valorResidual) / vidaUtilMeses
  }

  /**
   * Calculate accumulated depreciation up to a given date
   */
  calcularAmortizacionAcumulada(
    fechaCompra: Date,
    valorCompra: number,
    valorResidual: number,
    vidaUtilMeses: number,
    hastaFecha: Date = new Date()
  ): { mesesTranscurridos: number; amortizacionAcumulada: number; valorLibros: number } {
    const mesesTranscurridos = Math.max(0,
      (hastaFecha.getFullYear() - fechaCompra.getFullYear()) * 12 +
      (hastaFecha.getMonth() - fechaCompra.getMonth())
    )
    const mesesEfectivos = Math.min(mesesTranscurridos, vidaUtilMeses)
    const depMensual = this.calcularDepreciacionMensual(valorCompra, valorResidual, vidaUtilMeses)
    const amortizacionAcumulada = depMensual * mesesEfectivos
    const valorLibros = Math.max(valorResidual, valorCompra - amortizacionAcumulada)

    return { mesesTranscurridos: mesesEfectivos, amortizacionAcumulada, valorLibros }
  }

  /**
   * Run monthly depreciation for all active assets of an empresa.
   * Updates valorLibros and generates accounting entries.
   */
  async correrDepreciacionMensual(mes: number, anio: number, empresaId = DEFAULT_EMPRESA_ID) {
    const activos = await prisma.activoFijo.findMany({
      where: { empresaId, estado: "activo" },
    })

    const resultados: { activoId: number; descripcion: string; monto: number; asientoId?: number }[] = []

    for (const activo of activos) {
      const depMensual = this.calcularDepreciacionMensual(
        Number(activo.valorCompra),
        Number(activo.valorResidual),
        activo.vidaUtilMeses
      )

      if (depMensual <= 0) continue

      // Check if asset is still within useful life
      const { valorLibros } = this.calcularAmortizacionAcumulada(
        activo.fechaCompra,
        Number(activo.valorCompra),
        Number(activo.valorResidual),
        activo.vidaUtilMeses,
        new Date(anio, mes - 1, 28) // end of target month
      )

      if (valorLibros <= Number(activo.valorResidual)) {
        // Fully depreciated — mark it
        await prisma.activoFijo.update({
          where: { id: activo.id },
          data: { estado: "totalmente_amortizado", valorLibros: Number(activo.valorResidual) },
        })
        continue
      }

      // Update valorLibros
      const nuevoValorLibros = Math.max(Number(activo.valorResidual), Number(activo.valorLibros) - depMensual)
      await prisma.activoFijo.update({
        where: { id: activo.id },
        data: { valorLibros: nuevoValorLibros },
      })

      // Generate accounting entry
      const [ctaAmort, ctaAmortAcum] = await Promise.all([
        getCuentaLabel(empresaId, "depreciacion", "gasto", "5.9", "Amortizaciones y Depreciaciones"),
        getCuentaLabel(empresaId, "depreciacion", "amort_acum", "1.2.2", "Amortización Acumulada"),
      ])

      const ultimoAsiento = await prisma.asientoContable.findFirst({ orderBy: { numero: "desc" } })
      const numero = (ultimoAsiento?.numero ?? 0) + 1
      const fecha = new Date(anio, mes - 1, 28)

      const asiento = await prisma.asientoContable.create({
        data: {
          numero,
          fecha,
          descripcion: `Depreciación ${mes}/${anio} — ${activo.descripcion}`,
          tipo: "depreciacion",
          empresaId,
          movimientos: {
            create: [
              { cuenta: `5.9 ${ctaAmort}`, debe: depMensual, haber: 0 },
              { cuenta: `${activo.cuentaAmortizacionCodigo ?? "1.2.2"} ${ctaAmortAcum}`, debe: 0, haber: depMensual },
            ],
          },
        },
      })

      resultados.push({ activoId: activo.id, descripcion: activo.descripcion, monto: depMensual, asientoId: asiento.id })
    }

    return {
      mes,
      anio,
      activosProcesados: resultados.length,
      totalDepreciacion: resultados.reduce((s, r) => s + r.monto, 0),
      detalle: resultados,
    }
  }

  /**
   * Dar de baja an asset — generates a loss/gain entry
   */
  async darDeBaja(id: number, motivoBaja?: string) {
    const activo = await prisma.activoFijo.findUnique({ where: { id } })
    if (!activo) throw new Error("Activo no encontrado")
    if (activo.estado === "dado_de_baja") throw new Error("Activo ya dado de baja")

    return prisma.activoFijo.update({
      where: { id },
      data: {
        estado: "dado_de_baja",
        observaciones: motivoBaja
          ? `${activo.observaciones ?? ""}\n[BAJA] ${motivoBaja}`.trim()
          : activo.observaciones,
      },
    })
  }

  /**
   * Get depreciation schedule for an asset
   */
  generarCuadroAmortizacion(valorCompra: number, valorResidual: number, vidaUtilMeses: number, fechaCompra: Date) {
    const depMensual = this.calcularDepreciacionMensual(valorCompra, valorResidual, vidaUtilMeses)
    const cuadro: { mes: number; fecha: string; depreciacion: number; acumulada: number; valorLibros: number }[] = []

    let acumulada = 0
    for (let i = 1; i <= vidaUtilMeses; i++) {
      acumulada += depMensual
      const fecha = new Date(fechaCompra)
      fecha.setMonth(fecha.getMonth() + i)
      cuadro.push({
        mes: i,
        fecha: fecha.toISOString().slice(0, 7),
        depreciacion: Math.round(depMensual * 100) / 100,
        acumulada: Math.round(acumulada * 100) / 100,
        valorLibros: Math.round(Math.max(valorResidual, valorCompra - acumulada) * 100) / 100,
      })
    }

    return cuadro
  }
}

export const activoFijoService = new ActivoFijoService()
