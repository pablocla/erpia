/**
 * Tasas del growth loop multi-nivel (confirmables por comercial).
 * Comisiones = crédito interno hasta liquidación (no CBU automático).
 */

export const AFILIADO_RATES = {
  /** Vendedor / hybrid — comisión directa sobre el pago del referido */
  sellerNivel1: 0.3,
  /** Segundo nivel (quien invitó al partner que cerró) */
  sellerNivel2: 0.05,
  /** Implementador — comisión directa */
  implementerNivel1: 0.2,
  implementerNivel2: 0.05,
  /** Bounty especial: 100% del primer pago de suscripción para el vendedor */
  bountyPrimerMes: 1.0,
  /** Canon de Franquicia / Licencia de Célula de Ventas (Opción Inversor) */
  precioLicenciaCelulaArs: 500000,
  /** Cell license USD para mercado yankee */
  precioLicenciaCelulaUsd: 799,
  /**
   * Meta mérito célula: 20 comercios que PAGUEN extra (no 20 fiados $0).
   * Consenso Grok+Claude §G E9.
   */
  clientesRequeridosParaCelulaGratis: 20,
  skuLicenciaCelula: "partner.licencia_celula",
  /** Reembolso del extra anula comisión si está dentro de esta ventana. Claude §F E14. */
  clawbackDias: 30,
  /** Crédito interno primero; cash recién después de esta antigüedad. Claude §F E13. */
  retiroCashDesdeDias: 60,
} as const

export function dentroDeClawback(fechaPago: Date, now = new Date()): boolean {
  const ms = AFILIADO_RATES.clawbackDias * 86_400_000
  return now.getTime() - fechaPago.getTime() <= ms
}

export function corteRetiroCash(now = new Date()): Date {
  return new Date(now.getTime() - AFILIADO_RATES.retiroCashDesdeDias * 86_400_000)
}

export type PartnerTipo = "dev" | "seller" | "implementer" | "hybrid"

export function tasaNivel1(tipo: string): number {
  if (tipo === "implementer") return AFILIADO_RATES.implementerNivel1
  return AFILIADO_RATES.sellerNivel1
}

export function tasaNivel2(tipo: string): number {
  if (tipo === "implementer") return AFILIADO_RATES.implementerNivel2
  return AFILIADO_RATES.sellerNivel2
}

/** Normaliza código de referido: CONTADOR_PEREZ */
export function normalizeReferralCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 40)
}
