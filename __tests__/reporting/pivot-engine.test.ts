import { describe, it, expect } from "vitest"
import { buildPivot } from "@/lib/reporting/engine/pivot-engine"

describe("pivot-engine", () => {
  it("builds pivot grid from rows", () => {
    const rows = [
      { mes: "2026-01", cliente: "A", total: 100 },
      { mes: "2026-01", cliente: "B", total: 200 },
      { mes: "2026-02", cliente: "A", total: 150 },
    ]
    const pivot = buildPivot({
      rows,
      filas: ["mes"],
      columnas: ["cliente"],
      medida: "total",
      fn: "sum",
    })
    expect(pivot.filas).toContain("2026-01")
    expect(pivot.columnas).toContain("A")
    expect(pivot.celdas["2026-01"]["A"]).toBe(100)
    expect(pivot.granTotal).toBe(450)
  })
})