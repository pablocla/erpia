import type { FieldItem } from "@/components/reporting/FieldExplorer"
import type { FilterDraft } from "@/components/reporting/FilterBar"
import type { ReportVista } from "@/components/reporting/ViewToggle"
import type { ReportDefinition } from "@/lib/reporting/semantic/types"

type ChartTipo = "bar" | "line" | "pie" | "area"

export interface RestoredExplorerState {
  fuente: string
  vista: ReportVista
  filas: FieldItem[]
  columnas: FieldItem[]
  valores: FieldItem[]
  filtros: FilterDraft[]
  chartTipo: ChartTipo
  saveName: string
}

function fieldFromCampo(campos: FieldItem[], campo: string): FieldItem {
  return campos.find((c) => c.campo === campo) ?? { campo, etiqueta: campo, tipo: "dimension" }
}

export function restoreExplorerFromDefinition(
  def: ReportDefinition,
  campos: FieldItem[],
  nombre?: string,
): RestoredExplorerState {
  const filas = def.pivot?.filas?.map((c) => fieldFromCampo(campos, c)) ?? []
  const columnas = def.pivot?.columnas?.map((c) => fieldFromCampo(campos, c)) ?? []

  let valores: FieldItem[] = []
  if (def.medidas?.length) {
    valores = def.medidas.map((m) => fieldFromCampo(campos, m.campo))
  } else if (def.pivot?.medida) {
    const match = def.pivot.medida.match(/^(?:sum|count|avg|min|max)_(.+)$/)
    const campo = match?.[1] ?? "total"
    valores = [fieldFromCampo(campos, campo)]
  }

  if (filas.length === 0 && columnas.length === 0 && def.dimensiones?.length) {
    const dims = def.dimensiones.map((d) => fieldFromCampo(campos, d.campo))
    if (def.vista === "grafico") {
      filas.push(dims[0])
    } else {
      filas.push(...dims)
    }
  }

  return {
    fuente: def.fuente,
    vista: def.vista as ReportVista,
    filas,
    columnas,
    valores,
    filtros: def.filtros ?? [],
    chartTipo: (def.chart?.tipo ?? "bar") as ChartTipo,
    saveName: nombre ?? "",
  }
}