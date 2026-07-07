"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Scatter,
  ScatterChart,
} from "recharts"
import type { QueryResult } from "@/lib/reporting/semantic/types"
import type { ChartClickPayload } from "@/lib/reporting/engine/drill-down-resolver"

const COLORS = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#0891b2"]

export function ReportChartPanel({
  chart,
  compact = false,
  onDrill,
  drillable = false,
}: {
  chart: NonNullable<QueryResult["chart"]>
  compact?: boolean
  onDrill?: (payload: ChartClickPayload) => void
  drillable?: boolean
}) {
  if (!chart.datos.length) {
    return <p className="text-sm text-muted-foreground p-4">Sin datos para el gráfico.</p>
  }

  const height = compact ? 220 : 360
  const fontSize = compact ? 9 : 11
  const seriesKeys = Object.keys(chart.datos[0]).filter((k) => k !== "name")
  const canDrill = Boolean(onDrill && drillable)

  function handleClick(data: { name?: string; payload?: Record<string, string | number> }) {
    if (!onDrill || data.name == null) return
    onDrill({
      name: String(data.name),
      raw: data.payload,
    })
  }

  const cursorStyle = canDrill ? "pointer" : undefined

  if (chart.tipo === "pie" && seriesKeys[0]) {
    const key = seriesKeys[0]
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chart.datos}
            dataKey={key}
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={compact ? 72 : 120}
            label={!compact}
            onClick={canDrill ? (handleClick as any) : undefined}
            style={{ cursor: cursorStyle }}
          >
            {chart.datos.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (chart.tipo === "line") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chart.datos}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize }} interval={compact ? "preserveStartEnd" : undefined} />
          <YAxis tick={{ fontSize: fontSize }} tickFormatter={fmt} width={compact ? 48 : 60} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Legend />
          {seriesKeys.map((k, i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              activeDot={canDrill ? { onClick: (_, e: any) => handleClick(e.payload as { name?: string }) } : undefined}
              onClick={canDrill ? (handleClick as any) : undefined}
              style={{ cursor: cursorStyle }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (chart.tipo === "area") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chart.datos}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize }} interval={compact ? "preserveStartEnd" : undefined} />
          <YAxis tick={{ fontSize: fontSize }} tickFormatter={fmt} width={compact ? 48 : 60} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Legend />
          {seriesKeys.map((k, i) => (
            <Area
              key={k}
              type="monotone"
              dataKey={k}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.2}
              strokeWidth={2}
              activeDot={canDrill ? { onClick: (_, e: any) => handleClick(e.payload as { name?: string }) } : undefined}
              onClick={canDrill ? (handleClick as any) : undefined}
              style={{ cursor: cursorStyle }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  if (chart.tipo === "radar" && seriesKeys[0]) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius={compact ? 72 : 120} data={chart.datos}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" tick={{ fontSize }} />
          <PolarRadiusAxis />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Legend />
          {seriesKeys.map((k, i) => (
            <Radar
              key={k}
              name={k}
              dataKey={k}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.6}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    )
  }

  if (chart.tipo === "scatter") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="category" dataKey="name" name="Categoría" allowDuplicatedCategory={false} tick={{ fontSize }} interval={compact ? "preserveStartEnd" : undefined} />
          <YAxis type="number" dataKey={seriesKeys[0]} name={seriesKeys[0]} tickFormatter={fmt} width={compact ? 48 : 60} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: number) => fmt(v)} />
          <Legend />
          {seriesKeys.map((k, i) => (
            <Scatter
              key={k}
              name={k}
              data={chart.datos}
              fill={COLORS[i % COLORS.length]}
              onClick={canDrill ? (handleClick as any) : undefined}
              style={{ cursor: cursorStyle }}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chart.datos}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" tick={{ fontSize }} interval={compact ? "preserveStartEnd" : undefined} />
        <YAxis tick={{ fontSize: fontSize }} tickFormatter={fmt} width={compact ? 48 : 60} />
        <Tooltip formatter={(v: number) => fmt(v)} />
        <Legend />
        {seriesKeys.map((k, i) => (
          <Bar
            key={k}
            dataKey={k}
            fill={COLORS[i % COLORS.length]}
            radius={[4, 4, 0, 0]}
            onClick={canDrill ? (handleClick as any) : undefined}
            style={{ cursor: cursorStyle }}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n)
}
