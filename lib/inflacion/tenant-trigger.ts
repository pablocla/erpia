/**
 * Gatillos tenant: fiado, CxC, listas, presupuestos.
 */

import { reexpresarMonto, puedePagarNominal } from "./reexpresar"
import { getTenantPolicy } from "./policies"
import type { InflacionSubsystem, ReexpresionResult } from "./types"

export interface TenantDebtValuation {
  empresaId: number
  subsystem: InflacionSubsystem
  montoOriginal: number
  fechaOrigen: Date | string
  /** Si policy soloInformativo o gracia nominal: monto a cobrar hoy */
  montoCobrableHoy: number
  reexpresion: ReexpresionResult
  policyActiva: boolean
  soloInformativo: boolean
  puedePagarNominalHoy: boolean
  mensajeComerciante: string
  mensajeDeudor: string
}

/**
 * Valúa una deuda/saldo del tenant con la policy del subsystem.
 */
export function valuarDeudaTenant(input: {
  empresaId: number
  subsystem: InflacionSubsystem
  montoOriginal: number
  fechaOrigen: Date | string
  fechaValuacion?: Date
}): TenantDebtValuation {
  const policy = getTenantPolicy(input.empresaId, input.subsystem)
  const valuacion = input.fechaValuacion ?? new Date()

  const reexpresion = reexpresarMonto({
    montoOriginal: input.montoOriginal,
    fechaOrigen: input.fechaOrigen,
    fechaValuacion: valuacion,
    indiceCodigo: policy.indiceCodigo,
    topeVariacionPeriodo: policy.topeVariacionPeriodo,
  })

  const gracia = puedePagarNominal({
    fechaValuacion: valuacion,
    diasGraciaNominal: policy.diasGraciaNominal,
    diaPublicacion: policy.diaPublicacion,
  })

  const policyActiva = policy.activo
  const soloInformativo = !policyActiva || policy.soloInformativo

  let montoCobrableHoy = reexpresion.montoOriginal
  if (policyActiva && !policy.soloInformativo) {
    montoCobrableHoy = gracia ? reexpresion.montoOriginal : reexpresion.montoAjustado
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(n)

  const mensajeComerciante = policyActiva
    ? soloInformativo
      ? `Saldo nominal ${fmt(reexpresion.montoOriginal)}. En poder adquisitivo hoy ≈ ${fmt(reexpresion.montoAjustado)} (pérdida ≈ ${fmt(reexpresion.perdidaPoderAdquisitivo)}). El cobro sigue en nominal (modo informativo).`
      : gracia
        ? `Podés cobrar nominal ${fmt(reexpresion.montoOriginal)} hasta fin de gracia. Después el saldo de referencia pasa a ${fmt(reexpresion.montoAjustado)}.`
        : `Saldo de referencia indexado: ${fmt(reexpresion.montoAjustado)} (orig. ${fmt(reexpresion.montoOriginal)}).`
    : `Indexación desactivada. Saldo nominal ${fmt(reexpresion.montoOriginal)}.`

  const mensajeDeudor = policyActiva && !soloInformativo
    ? gracia
      ? `Tu saldo es ${fmt(reexpresion.montoOriginal)}. Si pagás dentro del período de gracia, se mantiene ese monto. Luego se actualiza por índice de precios de referencia a ${fmt(reexpresion.montoAjustado)}.`
      : `Tu saldo actualizado por índice de referencia es ${fmt(reexpresion.montoAjustado)} (compra/origen ${fmt(reexpresion.montoOriginal)}).`
    : `Tu saldo es ${fmt(reexpresion.montoOriginal)}.`

  return {
    empresaId: input.empresaId,
    subsystem: input.subsystem,
    montoOriginal: reexpresion.montoOriginal,
    fechaOrigen: input.fechaOrigen,
    montoCobrableHoy,
    reexpresion,
    policyActiva,
    soloInformativo,
    puedePagarNominalHoy: gracia,
    mensajeComerciante,
    mensajeDeudor,
  }
}

/**
 * Reexpresa un precio de lista del tenant (listas_precio).
 */
export function valuarPrecioLista(input: {
  empresaId: number
  precioLista: number
  fechaBaseLista: Date | string
}): ReexpresionResult {
  const policy = getTenantPolicy(input.empresaId, "listas_precio")
  if (!policy.activo) {
    return reexpresarMonto({
      montoOriginal: input.precioLista,
      fechaOrigen: input.fechaBaseLista,
      // factor 1 forced by inactive — still compute for info
    })
  }
  return reexpresarMonto({
    montoOriginal: input.precioLista,
    fechaOrigen: input.fechaBaseLista,
    indiceCodigo: policy.indiceCodigo,
    topeVariacionPeriodo: policy.topeVariacionPeriodo,
  })
}
