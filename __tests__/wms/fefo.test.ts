import { describe, it, expect } from "vitest"
import { allocateFefo, sortFefo, suggestPutawayBin, classifyAbc } from "@/lib/wms/fefo"
import type { StockBinCandidate } from "@/lib/wms/types"

function cand(partial: Partial<StockBinCandidate> & Pick<StockBinCandidate, "ubicacionId" | "codigoUbicacion" | "cantidadDisponible">): StockBinCandidate {
  return {
    stockUbicacionId: partial.stockUbicacionId ?? partial.ubicacionId,
    ordenPath: partial.ordenPath ?? 10,
    productoId: partial.productoId ?? 1,
    loteId: partial.loteId ?? null,
    fechaVencimiento: partial.fechaVencimiento ?? null,
    ...partial,
  }
}

describe("WMS FEFO", () => {
  it("sortFefo prioriza vencimiento más próximo", () => {
    const list = sortFefo([
      cand({
        ubicacionId: 1,
        codigoUbicacion: "B-01",
        cantidadDisponible: 5,
        fechaVencimiento: new Date("2027-01-01"),
        ordenPath: 1,
      }),
      cand({
        ubicacionId: 2,
        codigoUbicacion: "A-01",
        cantidadDisponible: 5,
        fechaVencimiento: new Date("2026-06-01"),
        ordenPath: 5,
      }),
    ])
    expect(list[0].codigoUbicacion).toBe("A-01")
  })

  it("allocateFefo parte en varios bins y reporta shortfall", () => {
    const { allocations, shortfall } = allocateFefo(
      [
        cand({
          ubicacionId: 1,
          codigoUbicacion: "A-01",
          cantidadDisponible: 3,
          fechaVencimiento: new Date("2026-01-01"),
          ordenPath: 1,
          loteId: 10,
        }),
        cand({
          ubicacionId: 2,
          codigoUbicacion: "A-02",
          cantidadDisponible: 4,
          fechaVencimiento: new Date("2026-06-01"),
          ordenPath: 2,
          loteId: 11,
        }),
      ],
      10,
    )
    expect(allocations).toHaveLength(2)
    expect(allocations[0].cantidad).toBe(3)
    expect(allocations[1].cantidad).toBe(4)
    expect(shortfall).toBe(3)
  })

  it("suggestPutawayBin usa preferida o pick vacío", () => {
    const bins = [
      { id: 1, codigo: "BULK", tipo: "bulk", ordenPath: 100, ocupacion: 50, capacidad: 100 },
      { id: 2, codigo: "A-01", tipo: "pick", ordenPath: 1, ocupacion: 0, capacidad: 20 },
    ]
    expect(suggestPutawayBin(1, bins)).toBe(1)
    expect(suggestPutawayBin(null, bins)).toBe(2)
  })

  it("classifyAbc marca top 20% como A", () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      productoId: i + 1,
      unidades: 100 - i * 10,
    }))
    const map = classifyAbc(items)
    expect(map.get(1)).toBe("A")
    expect(map.get(10)).toBe("C")
  })
})
