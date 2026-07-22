/**
 * Reexpresión de montos por índice (IPC/UVA).
 * Fórmula: monto * (indice_valuacion / indice_origen)
 */

import { getIndiceEfectivo, periodoFromDate } from "./ipc-store"
import type { IndiceCodigo, ReexpresionInput, ReexpresionResult } from "./types"

function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v)
}

/**
 * Aplica tope de variación acumulada desde origen (no por mes suelto).
 * topeVariacionPeriodo = max incremento relativo total (ej. 0.15 = +15% max).
 */
function applyTope(factor: number, tope: number | null | undefined): number {
  if (tope == null || tope < 0) return factor
  const maxFactor = 1 + tope
  if (factor > maxFactor) return maxFactor
  if (factor < 1) return factor // deflación: no forzar suba
  return factor
}

export function reexpresarMonto(input: ReexpresionInput): ReexpresionResult {
  const codigo: IndiceCodigo = input.indiceCodigo ?? "IPC_NACIONAL"
  const origen = toDate(input.fechaOrigen)
  const valuacion = toDate(input.fechaValuacion ?? new Date())

  const i0 = getIndiceEfectivo(codigo, origen)
  const i1 = getIndiceEfectivo(codigo, valuacion)

  if (!i0 || !i1 || i0.periodo.valor <= 0) {
    const m = Math.round(Number(input.montoOriginal) || 0)
    return {
      montoOriginal: m,
      montoAjustado: m,
      perdidaPoderAdquisitivo: 0,
      factor: 1,
      periodoOrigen: periodoFromDate(origen),
      periodoValuacion: periodoFromDate(valuacion),
      ipcOrigen: i0?.periodo.valor ?? 0,
      ipcValuacion: i1?.periodo.valor ?? 0,
      indiceCodigo: codigo,
      estimado: true,
      disclaimer:
        "Sin índice disponible para el período; se mantiene el monto nominal. Cargá IPC/UVA en el catálogo.",
    }
  }

  let factor = i1.periodo.valor / i0.periodo.valor
  factor = applyTope(factor, input.topeVariacionPeriodo)

  const original = Math.round((Number(input.montoOriginal) || 0) * 100) / 100
  const ajustado = Math.round(original * factor * 100) / 100
  const perdida = Math.round((ajustado - original) * 100) / 100

  return {
    montoOriginal: original,
    montoAjustado: ajustado,
    perdidaPoderAdquisitivo: perdida,
    factor: Math.round(factor * 10000) / 10000,
    periodoOrigen: i0.periodo.periodo,
    periodoValuacion: i1.periodo.periodo,
    ipcOrigen: i0.periodo.valor,
    ipcValuacion: i1.periodo.valor,
    indiceCodigo: codigo,
    estimado: i0.estimado || i1.estimado,
    disclaimer:
      "Reexpresión por índice oficial de referencia (no es tasa de interés). Verificar marco legal del convenio con el deudor.",
  }
}

/**
 * ¿Aún puede pagar nominal? (dentro de diasGracia desde inicio del mes de valuación
 * o hasta diaPublicacion del índice).
 */
export function puedePagarNominal(opts: {
  fechaValuacion?: Date
  diasGraciaNominal: number
  diaPublicacion?: number
}): boolean {
  const hoy = opts.fechaValuacion ?? new Date()
  const diaPub = opts.diaPublicacion ?? 15
  // Gracia: desde día 1 del mes hasta max(diaPublicacion, diasGracia)
  const limite = Math.max(diaPub, opts.diasGraciaNominal)
  return hoy.getDate() <= limite
}
