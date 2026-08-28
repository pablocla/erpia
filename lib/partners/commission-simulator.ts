import { AFILIADO_RATES } from "@/lib/partners/affiliate-config"

/** Precio ilustrativo del extra (Cobrá). No es lista pública — HUM-01. */
export const EXTRA_PRECIO_ILUSTRATIVO_ARS = 20_000

export interface SimulacionPartnerInput {
  referidos: number
  /** 0–100: % de referidos que prenden un extra de pago */
  upsellPct: number
  extraArs: number
  n1Rate: number
  bountyRate?: number
  /** 0–1 retención a mes 6 de quienes pagaron */
  retencionMes6?: number
}

export interface SimulacionPartner {
  pagadores: number
  mes1Bounty: number
  mensualRecurrente: number
  mes6: number
}

/**
 * N referidos × %upsell × extra. Mes 1 = bounty (100% del extra).
 * Mes 6 = pagadores × extra × N1 × retención.
 * Ancla $0 no entra: pagadores = 0 si upsell = 0.
 */
export function simularComisionPartner(input: SimulacionPartnerInput): SimulacionPartner {
  const referidos = Math.max(0, Math.floor(input.referidos))
  const upsell = Math.min(100, Math.max(0, input.upsellPct)) / 100
  const extra = Math.max(0, input.extraArs)
  const n1 = Math.min(1, Math.max(0, input.n1Rate))
  const bounty = input.bountyRate ?? AFILIADO_RATES.bountyPrimerMes
  const ret = input.retencionMes6 ?? 0.4

  const pagadores = Math.round(referidos * upsell)
  const mes1Bounty = pagadores * extra * bounty
  const mensualRecurrente = pagadores * extra * n1
  const mes6 = mensualRecurrente * Math.min(1, Math.max(0, ret))

  return { pagadores, mes1Bounty, mensualRecurrente, mes6 }
}
