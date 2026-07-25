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
  /** Meta meritocrática: 20 comercios activos otorgados por mérito sin pagar canon */
  clientesRequeridosParaCelulaGratis: 20,
  skuLicenciaCelula: "partner.licencia_celula",
} as const

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
