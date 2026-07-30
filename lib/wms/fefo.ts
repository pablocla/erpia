/**
 * FEFO / FIFO allocation puro (testeable sin Prisma).
 * First Expired First Out; si no hay vencimiento, mayor path order inverso = FIFO por path.
 */

import type { PickAllocation, StockBinCandidate } from "./types"

/** Ordena candidatos: vencen primero; sin fecha al final; luego ordenPath asc (path corto). */
export function sortFefo(candidates: StockBinCandidate[]): StockBinCandidate[] {
  return [...candidates].sort((a, b) => {
    const aExp = a.fechaVencimiento?.getTime() ?? Number.POSITIVE_INFINITY
    const bExp = b.fechaVencimiento?.getTime() ?? Number.POSITIVE_INFINITY
    if (aExp !== bExp) return aExp - bExp
    if (a.ordenPath !== b.ordenPath) return a.ordenPath - b.ordenPath
    return a.codigoUbicacion.localeCompare(b.codigoUbicacion)
  })
}

/**
 * Asigna cantidad pedida a bins respetando FEFO y stock disponible.
 * Puede devolver short (suma allocations < pedida).
 */
export function allocateFefo(
  candidates: StockBinCandidate[],
  cantidadPedida: number,
): { allocations: PickAllocation[]; shortfall: number } {
  if (cantidadPedida <= 0) return { allocations: [], shortfall: 0 }

  const ordered = sortFefo(candidates.filter((c) => c.cantidadDisponible > 0))
  const allocations: PickAllocation[] = []
  let remaining = cantidadPedida

  for (const c of ordered) {
    if (remaining <= 0) break
    const take = Math.min(c.cantidadDisponible, remaining)
    if (take <= 0) continue
    allocations.push({
      ubicacionId: c.ubicacionId,
      codigoUbicacion: c.codigoUbicacion,
      loteId: c.loteId,
      cantidad: take,
      ordenPath: c.ordenPath,
    })
    remaining -= take
  }

  return { allocations, shortfall: Math.max(0, remaining) }
}

/** Sugerencia de putaway: fixed bin del producto, si no el bin vacío/pick de menor path. */
export function suggestPutawayBin(
  preferredUbicacionId: number | null | undefined,
  bins: Array<{ id: number; codigo: string; tipo: string; ordenPath: number; ocupacion: number; capacidad: number | null }>,
): number | null {
  if (preferredUbicacionId && bins.some((b) => b.id === preferredUbicacionId)) {
    return preferredUbicacionId
  }
  const pickBins = bins
    .filter((b) => b.tipo === "pick" || b.tipo === "bin")
    .filter((b) => b.capacidad == null || b.ocupacion < b.capacidad)
    .sort((a, b) => a.ordenPath - b.ordenPath || a.codigo.localeCompare(b.codigo))
  return pickBins[0]?.id ?? bins.sort((a, b) => a.ordenPath - b.ordenPath)[0]?.id ?? null
}

/** Clasificación ABC simple por unidades vendidas (A top 20%, B next 30%, C resto). */
export function classifyAbc(
  items: Array<{ productoId: number; unidades: number }>,
): Map<number, "A" | "B" | "C"> {
  const sorted = [...items].sort((a, b) => b.unidades - a.unidades)
  const n = sorted.length
  const map = new Map<number, "A" | "B" | "C">()
  if (n === 0) return map
  const aCut = Math.max(1, Math.ceil(n * 0.2))
  const bCut = Math.max(aCut, Math.ceil(n * 0.5))
  sorted.forEach((item, idx) => {
    const clase = idx < aCut ? "A" : idx < bCut ? "B" : "C"
    map.set(item.productoId, clase)
  })
  return map
}
