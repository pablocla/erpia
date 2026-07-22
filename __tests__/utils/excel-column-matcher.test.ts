import { describe, it, expect } from "vitest"
import {
  matchColumns,
  applyColumnMapping,
  PRODUCT_IMPORT_TARGETS,
} from "@/lib/utils/excel-column-matcher"

describe("excel-column-matcher", () => {
  it("mapea headers típicos de almacén AR", () => {
    const headers = ["Cod", "Descripción", "P. Venta", "Costo", "Stock", "IVA"]
    const map = matchColumns(headers, PRODUCT_IMPORT_TARGETS)
    expect(map.codigo).toBe("Cod")
    expect(map.nombre).toBe("Descripción")
    expect(map.precioVenta).toBe("P. Venta")
    expect(map.precioCosto).toBe("Costo")
    expect(map.stockInicial).toBe("Stock")
    expect(map.alicuotaIva).toBe("IVA")
  })

  it("applyColumnMapping produce filas tipadas", () => {
    const headers = ["SKU", "Producto", "PVP"]
    const rows = [["A1", "Yerba", "1500"]]
    const mapping = matchColumns(headers)
    const out = applyColumnMapping(headers, rows, mapping)
    expect(out[0].codigo).toBe("A1")
    expect(out[0].nombre).toBe("Yerba")
    expect(out[0].precioVenta).toBe("1500")
  })
})
