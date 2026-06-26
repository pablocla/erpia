import { describe, expect, it } from "vitest"
import {
  MODULOS_ALMACEN_ROSARIO,
  skusAlmacenRosario,
  getModuloAlmacen,
} from "@/lib/almacen-rosario/modulos-catalog"
import { RETAIL_EXTENSION_SKUS } from "@/lib/almacen-rosario/retail-skus"

describe("modulos-catalog", () => {
  it("expone 18 módulos POS (8 core + 10 retail)", () => {
    expect(MODULOS_ALMACEN_ROSARIO).toHaveLength(18)
    expect(skusAlmacenRosario()).toHaveLength(18)
  })

  it("tiene SKUs únicos y metadatos mínimos", () => {
    const skus = skusAlmacenRosario()
    expect(new Set(skus).size).toBe(18)

    for (const m of MODULOS_ALMACEN_ROSARIO) {
      expect(m.sku).toMatch(/^pos\./)
      expect(m.nombre.length).toBeGreaterThan(2)
      expect(m.pasosUso.length).toBeGreaterThan(0)
      expect(m.docAnchor.length).toBeGreaterThan(0)
      expect(m.flujoMermaid).toContain("flowchart")
    }
  })

  it("incluye extensiones retail", () => {
    for (const sku of RETAIL_EXTENSION_SKUS) {
      expect(getModuloAlmacen(sku)).toBeDefined()
    }
  })

  it("resuelve módulos core conocidos", () => {
    expect(getModuloAlmacen("pos.envases_gaseosas")?.nombre).toBe("Envases de Gaseosas")
    expect(getModuloAlmacen("pos.vale_dinero")?.docAnchor).toBe("vale-dinero")
  })
})