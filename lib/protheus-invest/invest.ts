import type { Asiento, Instrument, Investment, Valuacion } from "./seed"

export function instrumentOf(tipos: Instrument[], tipoId: string) {
  return tipos.find((t) => t.id === tipoId)
}

export function seriesOf(vals: Valuacion[], investId: string) {
  return vals.filter((v) => v.investId === investId).sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function lastValuacion(vals: Valuacion[], investId: string) {
  const s = seriesOf(vals, investId)
  return s[s.length - 1]
}

export function markToMarket(inv: Investment, vals: Valuacion[]) {
  return lastValuacion(vals, inv.id)?.valor ?? inv.capital
}

export function daysBetween(from: string, to: string) {
  return Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 86400000))
}

export function theoreticalValue(inv: Investment, fecha: string) {
  if (inv.tasa <= 0) return inv.capital
  const days = daysBetween(inv.inicio, fecha)
  return Math.round(inv.capital * (1 + (inv.tasa / 100) * (days / 365)))
}

export function splitRescue(capital: number, total: number) {
  return { capital, interes: Math.round(total - capital) }
}

export function nextMarketPrice(last: number) {
  const factor = 1 + (Math.random() * 0.012 - 0.004)
  return Math.round(last * factor * 10000) / 10000
}

export function asientosOf(rows: Asiento[], investId: string) {
  return rows.filter((a) => a.investId === investId)
}

export const ORIGEN_LABEL = { A: "API PPI", C: "Cálculo", M: "Manual" } as const
export const RENTA_LABEL = { F: "Renta fija", V: "Variable", M: "Mixta" } as const
export const ESTADO_LABEL = { activa: "Activa", rescatada: "Rescatada", cancelada: "Cancelada" } as const
export const MONEDA_LABEL = { 1: "ARS", 2: "USD" } as const

export const TODAY = "2026-09-17"
