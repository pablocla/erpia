"use client"

import type { QueryColumn } from "@/lib/reporting/semantic/types"
import { cn } from "@/lib/utils"

export function ReportPlanoTable({
  columns,
  rows,
  onCellDrill,
  drillableKeys,
}: {
  columns: QueryColumn[]
  rows: Record<string, unknown>[]
  onCellDrill?: (campo: string, etiqueta: string, valor: string | number) => void
  drillableKeys?: Set<string>
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">Sin datos para mostrar.</p>
  }

  function canDrill(key: string, tipo?: string) {
    if (!onCellDrill) return false
    if (tipo === "number") return false
    if (drillableKeys) return drillableKeys.has(key)
    return tipo !== "number"
  }

  return (
    <div className="overflow-auto rounded-lg border max-h-[480px]">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 sticky top-0">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="text-left font-medium px-3 py-2 whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t hover:bg-muted/20">
              {columns.map((c) => {
                const drill = canDrill(c.key, c.tipo)
                const value = row[c.key]
                return (
                  <td
                    key={c.key}
                    className={cn(
                      "px-3 py-1.5 whitespace-nowrap",
                      drill && "cursor-pointer hover:bg-primary/10 hover:underline decoration-dotted",
                    )}
                    onClick={
                      drill && value != null
                        ? () => onCellDrill!(c.key, c.label, String(value))
                        : undefined
                    }
                    title={drill ? "Clic para drill-down" : undefined}
                  >
                    {formatCell(value, c.tipo)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatCell(value: unknown, tipo?: string): string {
  if (value == null) return "—"
  if (tipo === "number" && typeof value === "number") {
    return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value)
  }
  return String(value)
}