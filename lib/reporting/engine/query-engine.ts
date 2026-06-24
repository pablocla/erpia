import { assertFieldAllowed, listCatalogFields } from "@/lib/reporting/semantic/catalog"
import type { QueryColumn, QueryResult, ReportDefinition } from "@/lib/reporting/semantic/types"
import { reportDefinitionSchema } from "@/lib/reporting/semantic/types"
import { fetchClaverpSource } from "@/lib/reporting/connectors/claverp-adapter"
import { groupRows } from "@/lib/reporting/engine/aggregators"
import { buildPivot } from "@/lib/reporting/engine/pivot-engine"

function buildColumns(
  connectorId: string,
  fuente: string,
  keys: string[],
): QueryColumn[] {
  const catalog = listCatalogFields(connectorId, fuente)
  return keys.map((key) => {
    const field = catalog.find((c) => c.campo === key)
    return {
      key,
      label: field?.etiqueta ?? key,
      tipo: field?.tipo === "medida" ? "number" : field?.tipo === "fecha" ? "date" : "string",
    }
  })
}

function buildChartData(
  rows: Record<string, unknown>[],
  ejeX: string,
  series: string[],
  tipo: string,
): QueryResult["chart"] {
  const datos = rows.map((r) => {
    const point: { name: string; [key: string]: string | number } = {
      name: String(r[ejeX] ?? ""),
    }
    for (const s of series) {
      point[s] = Number(r[s] ?? 0)
    }
    return point
  })
  return { tipo, datos }
}

export async function executeReport(
  rawDef: unknown,
  empresaId: number,
  rol: string,
): Promise<QueryResult> {
  const def = reportDefinitionSchema.parse(rawDef)
  const connectorId = def.connectorId ?? "claverp"

  for (const d of def.dimensiones) {
    assertFieldAllowed(connectorId, def.fuente, d.campo, rol)
  }
  for (const m of def.medidas) {
    assertFieldAllowed(connectorId, def.fuente, m.campo, rol)
  }
  for (const f of def.filtros) {
    assertFieldAllowed(connectorId, def.fuente, f.campo, rol)
  }
  if (def.camposPlano) {
    for (const c of def.camposPlano) {
      assertFieldAllowed(connectorId, def.fuente, c, rol)
    }
  }

  let rawRows: Record<string, unknown>[]
  if (connectorId === "claverp") {
    rawRows = await fetchClaverpSource(empresaId, def)
  } else {
    throw new Error(`Conector no implementado: ${connectorId}`)
  }

  const truncado = rawRows.length >= (def.limit ?? 10000)

  if (def.vista === "plano") {
    const campos = def.camposPlano?.length
      ? def.camposPlano
      : listCatalogFields(connectorId, def.fuente).map((c) => c.campo)
    const rows = rawRows.map((r) => {
      const out: Record<string, unknown> = {}
      for (const c of campos) out[c] = r[c]
      return out
    })
    return {
      columns: buildColumns(connectorId, def.fuente, campos),
      rows,
      totalFilas: rows.length,
      truncado,
      meta: {
        fuente: def.fuente,
        vista: "plano",
        ejecutadoEn: new Date().toISOString(),
      },
    }
  }

  const dimKeys = def.dimensiones.map((d) => d.campo)
  const measures = def.medidas.length
    ? def.medidas.map((m) => ({
        campo: m.campo,
        fn: m.fn,
        etiqueta: m.etiqueta ?? `${m.fn}_${m.campo}`,
      }))
    : [{ campo: "total", fn: "sum" as const, etiqueta: "sum_total" }]

  const aggregated = groupRows(rawRows, dimKeys, measures)
  const colKeys = [...dimKeys, ...measures.map((m) => m.etiqueta ?? `${m.fn}_${m.campo}`)]

  if (def.vista === "pivot" && def.pivot) {
    const medidaCol = def.pivot.medida
    const pivotRows = aggregated.map((r) => ({
      ...r,
      [medidaCol]: Number(r[def.pivot!.medida] ?? r[`${def.pivot!.fn}_${def.pivot!.medida}`] ?? 0),
    }))
    const pivot = buildPivot({
      rows: pivotRows,
      filas: def.pivot.filas,
      columnas: def.pivot.columnas,
      medida: medidaCol,
      fn: def.pivot.fn,
    })
    return {
      columns: buildColumns(connectorId, def.fuente, colKeys),
      rows: aggregated,
      totalFilas: aggregated.length,
      truncado,
      meta: {
        fuente: def.fuente,
        vista: "pivot",
        ejecutadoEn: new Date().toISOString(),
      },
      pivot,
    }
  }

  if (def.vista === "grafico" && def.chart) {
    const chart = buildChartData(
      aggregated,
      def.chart.ejeX,
      def.chart.series,
      def.chart.tipo,
    )
    return {
      columns: buildColumns(connectorId, def.fuente, colKeys),
      rows: aggregated,
      totalFilas: aggregated.length,
      truncado,
      meta: {
        fuente: def.fuente,
        vista: "grafico",
        ejecutadoEn: new Date().toISOString(),
      },
      chart,
    }
  }

  return {
    columns: buildColumns(connectorId, def.fuente, colKeys),
    rows: aggregated,
    totalFilas: aggregated.length,
    truncado,
    meta: {
      fuente: def.fuente,
      vista: def.vista,
      ejecutadoEn: new Date().toISOString(),
    },
  }
}