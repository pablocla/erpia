import { describe, it, expect } from "vitest"
import {
  buildTransactionalDetailDefinition,
  drillStackToFilters,
  mergeDefinitionWithDrill,
  parseChartClick,
  pushDrillFilter,
} from "@/lib/reporting/engine/drill-down-resolver"
import type { ReportDefinition } from "@/lib/reporting/semantic/types"

const baseDef: ReportDefinition = {
  connectorId: "claverp",
  fuente: "ventas",
  vista: "grafico",
  dimensiones: [{ campo: "mes" }],
  medidas: [{ campo: "total", fn: "sum", etiqueta: "sum_total" }],
  filtros: [{ campo: "desde", op: "gte", valor: "2026-01-01" }],
  chart: { tipo: "bar", ejeX: "mes", series: ["sum_total"] },
}

describe("drill-down-resolver", () => {
  it("converts drill stack to eq filters", () => {
    const filters = drillStackToFilters([
      { campo: "mes", etiqueta: "Mes", valor: "2026-03" },
    ])
    expect(filters).toEqual([{ campo: "mes", op: "eq", valor: "2026-03" }])
  })

  it("merges drill filters into definition", () => {
    const merged = mergeDefinitionWithDrill(baseDef, [
      { campo: "mes", etiqueta: "Mes", valor: "2026-03" },
    ])
    expect(merged.filtros).toContainEqual({ campo: "mes", op: "eq", valor: "2026-03" })
    expect(merged.filtros).toContainEqual({ campo: "desde", op: "gte", valor: "2026-01-01" })
  })

  it("builds transactional plano definition", () => {
    const detail = buildTransactionalDetailDefinition(baseDef, [
      { campo: "mes", etiqueta: "Mes", valor: "2026-03" },
    ])
    expect(detail.vista).toBe("plano")
    expect(detail.dimensiones).toEqual([])
    expect(detail.medidas).toEqual([])
    expect(detail.limit).toBe(500)
    expect(detail.filtros).toContainEqual({ campo: "mes", op: "eq", valor: "2026-03" })
  })

  it("parses chart click payload", () => {
    const filter = parseChartClick({ name: "2026-03" }, "mes", "Mes")
    expect(filter).toEqual({ campo: "mes", etiqueta: "Mes", valor: "2026-03" })
  })

  it("replaces same campo on push", () => {
    const stack = pushDrillFilter(
      [{ campo: "mes", etiqueta: "Mes", valor: "2026-01" }],
      { campo: "mes", etiqueta: "Mes", valor: "2026-02" },
    )
    expect(stack).toHaveLength(1)
    expect(stack[0].valor).toBe("2026-02")
  })

  it("appends different campo on push", () => {
    const stack = pushDrillFilter(
      [{ campo: "mes", etiqueta: "Mes", valor: "2026-01" }],
      { campo: "cliente", etiqueta: "Cliente", valor: "ACME" },
    )
    expect(stack).toHaveLength(2)
  })
})