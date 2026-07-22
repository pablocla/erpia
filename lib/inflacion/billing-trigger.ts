/**
 * Gatillo platform: Claver indexa precios de suscripción / packs.
 *
 * Uso:
 *   const { precioIndexadoArs } = indexarPrecioCatalogo(24900, "2026-01")
 *   // checkout / resolvePrecioSku wrapper
 */

import { reexpresarMonto } from "./reexpresar"
import { getPlatformBillingPolicy } from "./policies"
import { periodoFromDate, parsePeriodo } from "./ipc-store"
import type { BillingIndexTriggerResult } from "./types"
import { aplicarPisoPrecioSuscripcion } from "@/lib/comercial/precio-minimo"

/**
 * Período base de precios de catálogo (cuando se fijaron los ARS “de lista”).
 * Env: CLAVER_PRECIO_BASE_PERIODO=2026-01
 */
export function getCatalogPriceBasePeriod(): string {
  return process.env.CLAVER_PRECIO_BASE_PERIODO || "2026-01"
}

function periodToDate(periodo: string): Date {
  const { year, month } = parsePeriodo(periodo)
  return new Date(year, month - 1, 15)
}

/**
 * Reexpresa un precio de catálogo Claver según IPC desde periodo base.
 */
export function indexarPrecioCatalogo(
  precioBaseArs: number,
  periodoBase?: string,
  fechaValuacion?: Date,
): BillingIndexTriggerResult {
  const policy = getPlatformBillingPolicy()
  const basePeriod = periodoBase || getCatalogPriceBasePeriod()
  const base = Math.round(Number(precioBaseArs) || 0)

  if (!policy.activo || base <= 0) {
    return {
      precioBaseArs: base,
      precioIndexadoArs: base,
      periodoBase: basePeriod,
      periodoActual: periodoFromDate(fechaValuacion ?? new Date()),
      factor: 1,
      topeAplicado: false,
      policyActiva: policy.activo,
    }
  }

  const r = reexpresarMonto({
    montoOriginal: base,
    fechaOrigen: periodToDate(basePeriod),
    fechaValuacion: fechaValuacion ?? new Date(),
    indiceCodigo: policy.indiceCodigo,
    topeVariacionPeriodo: policy.topeVariacionPeriodo,
  })

  const indexado = aplicarPisoPrecioSuscripcion(Math.round(r.montoAjustado))
  const factorSinTope =
    r.ipcOrigen > 0 ? r.ipcValuacion / r.ipcOrigen : 1

  return {
    precioBaseArs: base,
    precioIndexadoArs: indexado,
    periodoBase: basePeriod,
    periodoActual: r.periodoValuacion,
    factor: r.factor,
    topeAplicado: r.factor + 1e-9 < factorSinTope,
    policyActiva: true,
  }
}

/**
 * Wrapper para catálogo: si CLAVER_INDEXAR_PRECIOS=1 aplica índice.
 */
export function resolvePrecioIndexadoSiAplica(precioCatalogoArs: number): number {
  const flag = process.env.CLAVER_INDEXAR_PRECIOS
  if (flag !== "1" && flag !== "true") {
    return Math.round(Number(precioCatalogoArs) || 0)
  }
  return indexarPrecioCatalogo(precioCatalogoArs).precioIndexadoArs
}
