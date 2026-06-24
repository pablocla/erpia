import { describe, expect, it } from "vitest"
import { restoreExplorerFromDefinition } from "@/lib/reporting/restore-definition"
import type { ReportDefinition } from "@/lib/reporting/semantic/types"

const campos = [
  { campo: "mes", etiqueta: "Mes", tipo: "dimension" },
  { campo: "cliente", etiqueta: "Cliente", tipo: "dimension" },
  { campo: "total", etiqueta: "Total", tipo: "medida" },
]

describe("restoreExplorerFromDefinition", () => {
  it("restaura pivot filas, columnas y medidas", () => {
    const def: ReportDefinition = {
      connectorId: "claverp",
      fuente: "ventas",
      vista: "pivot",
      dimensiones: [{ campo: "mes" }, { campo: "cliente" }],
      medidas: [{ campo: "total", fn: "sum", etiqueta: "sum_total" }],
      filtros: [{ campo: "desde", op: "gte", valor: "2026-01-01" }],
      pivot: {
        filas: ["mes"],
        columnas: ["cliente"],
        medida: "sum_total",
        fn: "sum",
      },
    }

    const restored = restoreExplorerFromDefinition(def, campos, "Ventas mensual")
    expect(restored.fuente).toBe("ventas")
    expect(restored.vista).toBe("pivot")
    expect(restored.filas.map((f) => f.campo)).toEqual(["mes"])
    expect(restored.columnas.map((f) => f.campo)).toEqual(["cliente"])
    expect(restored.valores.map((f) => f.campo)).toEqual(["total"])
    expect(restored.saveName).toBe("Ventas mensual")
  })

  it("restaura tipo de gráfico", () => {
    const def: ReportDefinition = {
      connectorId: "claverp",
      fuente: "ventas",
      vista: "grafico",
      dimensiones: [{ campo: "mes" }],
      medidas: [{ campo: "total", fn: "sum", etiqueta: "sum_total" }],
      filtros: [],
      chart: { tipo: "line", ejeX: "mes", series: ["sum_total"] },
    }

    const restored = restoreExplorerFromDefinition(def, campos)
    expect(restored.chartTipo).toBe("line")
    expect(restored.filas[0]?.campo).toBe("mes")
  })
})