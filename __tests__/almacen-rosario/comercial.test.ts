import { describe, expect, it } from "vitest"
import { ALMACEN_ROSARIO_GRUPOS, DOLOR_POR_SKU, modulosPorGrupo } from "@/lib/almacen-rosario/comercial"
import { skusAlmacenRosario } from "@/lib/almacen-rosario/modulos-catalog"

describe("almacen-rosario/comercial", () => {
  it("tiene dolor definido para los 18 SKUs", () => {
    for (const sku of skusAlmacenRosario()) {
      expect(DOLOR_POR_SKU[sku]?.length).toBeGreaterThan(10)
    }
  })

  it("agrupa los 18 módulos sin duplicar", () => {
    const grouped = modulosPorGrupo()
    const all = grouped.flatMap((g) => g.modulos.map((m) => m.sku))
    expect(new Set(all).size).toBe(18)
    expect(all.length).toBe(18)
  })

  it("grupos cubren todos los skus del catálogo", () => {
    const inGroups = new Set(ALMACEN_ROSARIO_GRUPOS.flatMap((g) => g.skus))
    for (const sku of skusAlmacenRosario()) {
      expect(inGroups.has(sku)).toBe(true)
    }
  })
})