/** Factura de Crédito Electrónica MiPyME — Ley 27.440 / RG AFIP */

export const FCE_TIPOS_CBTE = new Set([
  201, 202, 203, 206, 207, 208, 211, 212, 213,
])

export type TipoTransferenciaFce = "SCA" | "ADC"

const BASE_TO_FCE: Record<number, number> = {
  1: 201,
  2: 202,
  3: 203,
  6: 206,
  7: 207,
  8: 208,
  11: 211,
  12: 212,
  13: 213,
}

export function isFceTipoCbte(tipoCbte: number): boolean {
  return FCE_TIPOS_CBTE.has(tipoCbte)
}

export function isFceNotaCreditoDebito(tipoCbte: number): boolean {
  return [202, 203, 207, 208, 212, 213].includes(tipoCbte)
}

export function mapBaseTipoToFce(baseTipoCbte: number): number | null {
  return BASE_TO_FCE[baseTipoCbte] ?? null
}

export function normalizeCbu(cbu: string): string {
  return cbu.replace(/\D/g, "")
}

export function validateCbu(cbu: string): boolean {
  return /^\d{22}$/.test(normalizeCbu(cbu))
}

export function buildFceOpcionales(
  cbu: string,
  tipoTransferencia: TipoTransferenciaFce = "SCA"
): { Opcional: Array<{ Id: number; Valor: string }> } {
  const cbuNorm = normalizeCbu(cbu)
  if (!validateCbu(cbuNorm)) {
    throw new Error("CBU FCE inválido: debe tener 22 dígitos numéricos")
  }
  const tipo = tipoTransferencia === "ADC" ? "ADC" : "SCA"
  return {
    Opcional: [
      { Id: 2101, Valor: cbuNorm },
      { Id: 2102, Valor: tipo },
    ],
  }
}

export interface CbteAsociadoFce {
  Tipo: number
  PtoVta: number
  Nro: number
  Cuit?: string
  CbteFch?: string
}

export function buildCbtesAsocFce(
  asociado: CbteAsociadoFce
): { CbteAsoc: CbteAsociadoFce[] } {
  return { CbteAsoc: [asociado] }
}

export function formatFechaAfip(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}