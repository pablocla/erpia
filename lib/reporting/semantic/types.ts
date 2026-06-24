import { z } from "zod"

export const FILTER_OPS = ["eq", "neq", "gte", "lte", "gt", "lt", "in", "contains"] as const
export const AGG_FNS = ["sum", "count", "avg", "min", "max"] as const
export const VISTA_TIPOS = ["plano", "pivot", "grafico"] as const
export const CHART_TIPOS = ["bar", "line", "pie", "area"] as const

export const reportFilterSchema = z.object({
  campo: z.string().min(1),
  op: z.enum(FILTER_OPS),
  valor: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]),
})

export const reportDimensionSchema = z.object({
  campo: z.string().min(1),
  agruparPor: z.enum(["dia", "mes", "anio"]).optional(),
})

export const reportMeasureSchema = z.object({
  campo: z.string().min(1),
  fn: z.enum(AGG_FNS),
  etiqueta: z.string().optional(),
})

export const reportPivotSchema = z.object({
  filas: z.array(z.string()).default([]),
  columnas: z.array(z.string()).default([]),
  medida: z.string().min(1),
  fn: z.enum(AGG_FNS).default("sum"),
})

export const reportChartSchema = z.object({
  tipo: z.enum(CHART_TIPOS).default("bar"),
  ejeX: z.string().min(1),
  series: z.array(z.string()).min(1),
  apilado: z.boolean().optional(),
})

export const reportDefinitionSchema = z.object({
  connectorId: z.string().default("claverp"),
  fuente: z.string().min(1),
  vista: z.enum(VISTA_TIPOS).default("plano"),
  dimensiones: z.array(reportDimensionSchema).default([]),
  medidas: z.array(reportMeasureSchema).default([]),
  filtros: z.array(reportFilterSchema).default([]),
  pivot: reportPivotSchema.optional(),
  chart: reportChartSchema.optional(),
  camposPlano: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(10000).optional(),
  orden: z.object({
    campo: z.string(),
    dir: z.enum(["asc", "desc"]),
  }).optional(),
})

export type ReportDefinition = z.infer<typeof reportDefinitionSchema>
export type ReportFilter = z.infer<typeof reportFilterSchema>
export type ReportPivot = z.infer<typeof reportPivotSchema>
export type ReportChart = z.infer<typeof reportChartSchema>
export type ReportMeasure = z.infer<typeof reportMeasureSchema>

export interface CatalogField {
  connectorId: string
  fuente: string
  campo: string
  etiqueta: string
  tipo: "dimension" | "medida" | "fecha"
  agregacion?: string
  requiereRol?: string[]
}

export interface CatalogSource {
  id: string
  etiqueta: string
  descripcion: string
  connectorId: string
}

export interface QueryColumn {
  key: string
  label: string
  tipo?: "string" | "number" | "date"
}

export interface QueryResult {
  columns: QueryColumn[]
  rows: Record<string, unknown>[]
  totalFilas: number
  truncado: boolean
  meta: {
    fuente: string
    vista: string
    ejecutadoEn: string
  }
  pivot?: {
    filas: string[]
    columnas: string[]
    celdas: Record<string, Record<string, number>>
    totalesFila: Record<string, number>
    totalesColumna: Record<string, number>
    granTotal: number
  }
  chart?: {
    tipo: string
    datos: { name: string; [key: string]: string | number }[]
  }
}