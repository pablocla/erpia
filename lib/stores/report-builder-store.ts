import { create } from "zustand"
import type { FieldItem } from "@/components/reporting/FieldExplorer"
import type { FilterDraft } from "@/components/reporting/FilterBar"
import type { DrillFilter } from "@/components/reporting/DrillBreadcrumb"
import type { ReportVista } from "@/components/reporting/ViewToggle"
import type { QueryResult, ReportDefinition } from "@/lib/reporting/semantic/types"
import { useDashboardBiStore } from "@/lib/stores/dashboard-bi-store"

type ChartTipo = "bar" | "line" | "pie" | "area" | "radar" | "scatter"

interface ReportBuilderState {
  fuente: string
  vista: ReportVista
  chartTipo: ChartTipo
  campos: FieldItem[]
  filas: FieldItem[]
  columnas: FieldItem[]
  valores: FieldItem[]
  filtros: FilterDraft[]
  drillStack: DrillFilter[]
  result: QueryResult | null
  loading: boolean
  error: string | null
  saveName: string
  loadedReportId: number | null
  loadedTemplateId: string | null

  setFuente: (v: string) => void
  setVista: (v: ReportVista) => void
  setChartTipo: (v: ChartTipo) => void
  setCampos: (v: FieldItem[]) => void
  setFilas: (v: FieldItem[] | ((p: FieldItem[]) => FieldItem[])) => void
  setColumnas: (v: FieldItem[] | ((p: FieldItem[]) => FieldItem[])) => void
  setValores: (v: FieldItem[] | ((p: FieldItem[]) => FieldItem[])) => void
  setFiltros: (v: FilterDraft[]) => void
  setDrillStack: (v: DrillFilter[] | ((p: DrillFilter[]) => DrillFilter[])) => void
  setResult: (v: QueryResult | null) => void
  setLoading: (v: boolean) => void
  setError: (v: string | null) => void
  setSaveName: (v: string) => void
  setLoadedReportId: (v: number | null) => void
  setLoadedTemplateId: (v: string | null) => void
  resetZones: () => void
  resetAll: () => void
}

const INITIAL: Pick<
  ReportBuilderState,
  | "fuente"
  | "vista"
  | "chartTipo"
  | "campos"
  | "filas"
  | "columnas"
  | "valores"
  | "filtros"
  | "drillStack"
  | "result"
  | "loading"
  | "error"
  | "saveName"
  | "loadedReportId"
  | "loadedTemplateId"
> = {
  fuente: "ventas",
  vista: "plano",
  chartTipo: "bar",
  campos: [],
  filas: [],
  columnas: [],
  valores: [],
  filtros: [],
  drillStack: [],
  result: null,
  loading: false,
  error: null,
  saveName: "",
  loadedReportId: null,
  loadedTemplateId: null,
}

export const useReportBuilderStore = create<ReportBuilderState>((set) => ({
  ...INITIAL,

  setFuente: (fuente) => set({ fuente }),
  setVista: (vista) => set({ vista }),
  setChartTipo: (chartTipo) => set({ chartTipo }),
  setCampos: (campos) => set({ campos }),
  setFilas: (filas) =>
    set((s) => ({
      filas: typeof filas === "function" ? filas(s.filas) : filas,
    })),
  setColumnas: (columnas) =>
    set((s) => ({
      columnas: typeof columnas === "function" ? columnas(s.columnas) : columnas,
    })),
  setValores: (valores) =>
    set((s) => ({
      valores: typeof valores === "function" ? valores(s.valores) : valores,
    })),
  setFiltros: (filtros) => set({ filtros }),
  setDrillStack: (drillStack) =>
    set((s) => ({
      drillStack: typeof drillStack === "function" ? drillStack(s.drillStack) : drillStack,
    })),
  setResult: (result) => set({ result }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSaveName: (saveName) => set({ saveName }),
  setLoadedReportId: (loadedReportId) => set({ loadedReportId }),
  setLoadedTemplateId: (loadedTemplateId) => set({ loadedTemplateId }),
  resetZones: () =>
    set({
      filas: [],
      columnas: [],
      valores: [],
      drillStack: [],
      result: null,
    }),
  resetAll: () => set({ ...INITIAL }),
}))

/** Construye ReportDefinition desde el estado del builder (misma lógica que explorar). */
export function buildDefinitionFromBuilder(state: {
  fuente: string
  vista: ReportVista
  chartTipo: ChartTipo
  campos: FieldItem[]
  filas: FieldItem[]
  columnas: FieldItem[]
  valores: FieldItem[]
  filtros: FilterDraft[]
  drillStack: DrillFilter[]
}): ReportDefinition {
  const drillFiltros = state.drillStack.map((d) => ({
    campo: d.campo,
    op: "eq" as const,
    valor: d.valor,
  }))

  const globalState = useDashboardBiStore.getState()
  const globalFiltros = []
  if (globalState.globalDesde) {
    globalFiltros.push({ campo: "fecha", op: "gte" as const, valor: globalState.globalDesde })
  }
  if (globalState.globalHasta) {
    globalFiltros.push({ campo: "fecha", op: "lte" as const, valor: globalState.globalHasta })
  }

  const filtrosEfectivos = [...state.filtros, ...drillFiltros, ...globalFiltros]

  const dimensiones = [...state.filas, ...state.columnas]
    .filter((f, i, arr) => arr.findIndex((x) => x.campo === f.campo) === i)
    .map((f) => ({ campo: f.campo }))

  const medidas = state.valores.length
    ? state.valores.map((v) => ({
        campo: v.campo,
        fn: (v.tipo === "medida" && v.campo === "cantidad" ? "count" : "sum") as "sum" | "count",
        etiqueta: `${v.tipo === "medida" && v.campo === "cantidad" ? "count" : "sum"}_${v.campo}`,
      }))
    : [{ campo: "total", fn: "sum" as const, etiqueta: "sum_total" }]

  const def: ReportDefinition = {
    connectorId: "claverp",
    fuente: state.fuente,
    vista: state.vista,
    dimensiones: state.vista === "plano" ? [] : dimensiones,
    medidas: state.vista === "plano" ? [] : medidas,
    filtros: filtrosEfectivos,
    limit: 5000,
  }

  if (state.vista === "plano") {
    def.camposPlano = state.campos.map((c) => c.campo)
  }

  if (state.vista === "pivot" && state.valores[0]) {
    def.pivot = {
      filas: state.filas.map((f) => f.campo),
      columnas: state.columnas.map((f) => f.campo),
      medida: medidas[0].etiqueta ?? `sum_${state.valores[0].campo}`,
      fn: medidas[0].fn,
    }
  }

  if (state.vista === "grafico") {
    def.chart = {
      tipo: state.chartTipo,
      ejeX: state.filas[0]?.campo ?? dimensiones[0]?.campo ?? "mes",
      series: medidas.map((m) => m.etiqueta ?? `${m.fn}_${m.campo}`),
    }
  }

  return def
}