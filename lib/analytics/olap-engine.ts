/**
 * Capa OLAP ligera — series de tiempo con gap-filling (PostgreSQL generate_series).
 * Evita findMany + agregación en Node para gráficos de alto volumen.
 */

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { ReportDefinition } from "@/lib/reporting/semantic/types"

export type OlapGranularity = "day" | "month"

export interface TimeSeriesPoint {
  bucket: string
  value: number
  count: number
}

export interface TimeSeriesQuery {
  empresaId: number
  fuente: "ventas" | "compras"
  measure: "total" | "subtotal" | "iva" | "cantidad"
  granularity: OlapGranularity
  desde: Date
  hasta: Date
}

const ALLOWED_SOURCES = new Set(["ventas", "compras"])
const ALLOWED_MEASURES = new Set(["total", "subtotal", "iva", "cantidad"])

function extractDateRange(filtros: ReportDefinition["filtros"]): { desde: Date; hasta: Date } {
  let desde: Date | null = null
  let hasta: Date | null = null

  for (const f of filtros) {
    if (f.campo === "desde" && (f.op === "gte" || f.op === "eq")) desde = new Date(String(f.valor))
    if (f.campo === "hasta" && (f.op === "lte" || f.op === "eq")) hasta = new Date(String(f.valor))
    if (f.campo === "fecha" && f.op === "gte") desde = new Date(String(f.valor))
    if (f.campo === "fecha" && f.op === "lte") hasta = new Date(String(f.valor))
  }

  const now = new Date()
  if (!hasta) hasta = now
  if (!desde) {
    desde = new Date(hasta)
    desde.setDate(desde.getDate() - 30)
  }
  return { desde, hasta }
}

function formatBucket(d: Date, granularity: OlapGranularity): string {
  if (granularity === "month") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  }
  return d.toISOString().split("T")[0]
}

export function shouldUseOlapTimeSeries(def: ReportDefinition): boolean {
  if (def.vista !== "grafico" || !def.chart) return false
  if (!ALLOWED_SOURCES.has(def.fuente)) return false
  const eje = def.chart.ejeX
  return eje === "fecha" || eje === "mes" || def.dimensiones.some((d) => d.agruparPor === "dia" || d.agruparPor === "mes")
}

export function resolveOlapQuery(def: ReportDefinition, empresaId: number): TimeSeriesQuery | null {
  if (!shouldUseOlapTimeSeries(def)) return null

  const { desde, hasta } = extractDateRange(def.filtros)
  const eje = def.chart?.ejeX ?? "mes"
  const granularity: OlapGranularity =
    eje === "fecha" || def.dimensiones.some((d) => d.agruparPor === "dia") ? "day" : "month"

  const medida = def.medidas[0]?.campo ?? "total"
  const measure = ALLOWED_MEASURES.has(medida) ? (medida as TimeSeriesQuery["measure"]) : "total"

  return {
    empresaId,
    fuente: def.fuente as "ventas" | "compras",
    measure,
    granularity,
    desde,
    hasta,
  }
}

export async function queryTimeSeries(q: TimeSeriesQuery): Promise<TimeSeriesPoint[]> {
  if (!ALLOWED_SOURCES.has(q.fuente)) {
    throw new Error(`Fuente OLAP no permitida: ${q.fuente}`)
  }
  if (!ALLOWED_MEASURES.has(q.measure)) {
    throw new Error(`Medida OLAP no permitida: ${q.measure}`)
  }

  if (q.fuente === "ventas") {
    return queryVentasTimeSeries(q)
  }
  return queryComprasTimeSeries(q)
}

async function queryVentasTimeSeries(q: TimeSeriesQuery): Promise<TimeSeriesPoint[]> {
  const isCount = q.measure === "cantidad"
  const aggExpr = isCount ? Prisma.sql`COUNT(f.id)::float` : Prisma.sql`COALESCE(SUM(f.${Prisma.raw(q.measure)}), 0)::float`

  if (q.granularity === "day") {
    const rows = await prisma.$queryRaw<{ bucket: Date; value: number; count: number }[]>`
      SELECT
        gs.bucket::date AS bucket,
        ${aggExpr} AS value,
        COUNT(f.id)::int AS count
      FROM generate_series(${q.desde}::date, ${q.hasta}::date, '1 day'::interval) AS gs(bucket)
      LEFT JOIN facturas f ON
        f."empresaId" = ${q.empresaId}
        AND f."deletedAt" IS NULL
        AND f.estado <> 'anulada'
        AND f."createdAt"::date = gs.bucket::date
      GROUP BY gs.bucket
      ORDER BY gs.bucket ASC
    `
    return rows.map((r) => ({
      bucket: formatBucket(new Date(r.bucket), "day"),
      value: Number(r.value),
      count: Number(r.count),
    }))
  }

  const rows = await prisma.$queryRaw<{ bucket: Date; value: number; count: number }[]>`
    SELECT
      date_trunc('month', gs.bucket)::date AS bucket,
      ${aggExpr} AS value,
      COUNT(f.id)::int AS count
    FROM generate_series(
      date_trunc('month', ${q.desde}::timestamp),
      date_trunc('month', ${q.hasta}::timestamp),
      '1 month'::interval
    ) AS gs(bucket)
    LEFT JOIN facturas f ON
      f."empresaId" = ${q.empresaId}
      AND f."deletedAt" IS NULL
      AND f.estado <> 'anulada'
      AND date_trunc('month', f."createdAt") = date_trunc('month', gs.bucket)
    GROUP BY date_trunc('month', gs.bucket)
    ORDER BY bucket ASC
  `
  return rows.map((r) => ({
    bucket: formatBucket(new Date(r.bucket), "month"),
    value: Number(r.value),
    count: Number(r.count),
  }))
}

async function queryComprasTimeSeries(q: TimeSeriesQuery): Promise<TimeSeriesPoint[]> {
  const isCount = q.measure === "cantidad"
  const aggExpr = isCount ? Prisma.sql`COUNT(c.id)::float` : Prisma.sql`COALESCE(SUM(c.${Prisma.raw(q.measure)}), 0)::float`

  if (q.granularity === "day") {
    const rows = await prisma.$queryRaw<{ bucket: Date; value: number; count: number }[]>`
      SELECT
        gs.bucket::date AS bucket,
        ${aggExpr} AS value,
        COUNT(c.id)::int AS count
      FROM generate_series(${q.desde}::date, ${q.hasta}::date, '1 day'::interval) AS gs(bucket)
      LEFT JOIN compras c ON
        c."empresaId" = ${q.empresaId}
        AND c."deletedAt" IS NULL
        AND c.fecha::date = gs.bucket::date
      GROUP BY gs.bucket
      ORDER BY gs.bucket ASC
    `
    return rows.map((r) => ({
      bucket: formatBucket(new Date(r.bucket), "day"),
      value: Number(r.value),
      count: Number(r.count),
    }))
  }

  const rows = await prisma.$queryRaw<{ bucket: Date; value: number; count: number }[]>`
    SELECT
      date_trunc('month', gs.bucket)::date AS bucket,
      ${aggExpr} AS value,
      COUNT(c.id)::int AS count
    FROM generate_series(
      date_trunc('month', ${q.desde}::timestamp),
      date_trunc('month', ${q.hasta}::timestamp),
      '1 month'::interval
    ) AS gs(bucket)
    LEFT JOIN compras c ON
      c."empresaId" = ${q.empresaId}
      AND c."deletedAt" IS NULL
      AND date_trunc('month', c.fecha) = date_trunc('month', gs.bucket)
    GROUP BY date_trunc('month', gs.bucket)
    ORDER BY bucket ASC
  `
  return rows.map((r) => ({
    bucket: formatBucket(new Date(r.bucket), "month"),
    value: Number(r.value),
    count: Number(r.count),
  }))
}

/** Convierte serie OLAP a filas compatibles con query-engine (chart). */
export function timeSeriesToChartRows(
  points: TimeSeriesPoint[],
  ejeX: string,
  seriesKey: string,
): Record<string, unknown>[] {
  const key = ejeX === "fecha" ? "fecha" : "mes"
  return points.map((p) => ({
    [key]: p.bucket,
    [seriesKey]: p.value,
    cantidad: p.count,
  }))
}