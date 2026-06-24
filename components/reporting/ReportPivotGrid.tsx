"use client"

import type { QueryResult } from "@/lib/reporting/semantic/types"
import { cn } from "@/lib/utils"

export function ReportPivotGrid({
  pivot,
  rowField,
  colField,
  onRowDrill,
  onColDrill,
  onCellDrill,
}: {
  pivot: NonNullable<QueryResult["pivot"]>
  rowField?: { campo: string; etiqueta: string }
  colField?: { campo: string; etiqueta: string }
  onRowDrill?: (valor: string) => void
  onColDrill?: (valor: string) => void
  onCellDrill?: (fila: string, col: string) => void
}) {
  return (
    <div className="overflow-auto rounded-lg border max-h-[480px]">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 sticky top-0">
          <tr>
            <th className="text-left px-3 py-2" />
            {pivot.columnas.map((c) => (
              <th
                key={c}
                className={cn(
                  "text-right px-3 py-2 font-medium whitespace-nowrap",
                  colField && onColDrill && "cursor-pointer hover:bg-primary/10 hover:underline decoration-dotted",
                )}
                onClick={colField && onColDrill ? () => onColDrill(c) : undefined}
                title={colField ? `Drill: ${colField.etiqueta}` : undefined}
              >
                {c}
              </th>
            ))}
            <th className="text-right px-3 py-2 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {pivot.filas.map((fila) => (
            <tr key={fila} className="border-t hover:bg-muted/20">
              <td
                className={cn(
                  "px-3 py-1.5 font-medium whitespace-nowrap",
                  rowField && onRowDrill && "cursor-pointer hover:bg-primary/10 hover:underline decoration-dotted",
                )}
                onClick={rowField && onRowDrill ? () => onRowDrill(fila) : undefined}
                title={rowField ? `Drill: ${rowField.etiqueta}` : undefined}
              >
                {fila}
              </td>
              {pivot.columnas.map((col) => (
                <td
                  key={col}
                  className={cn(
                    "px-3 py-1.5 text-right tabular-nums",
                    onCellDrill && rowField && colField && "cursor-pointer hover:bg-primary/10",
                  )}
                  onClick={
                    onCellDrill && rowField && colField
                      ? () => onCellDrill(fila, col)
                      : undefined
                  }
                  title={onCellDrill && rowField && colField ? "Drill fila + columna" : undefined}
                >
                  {fmt(pivot.celdas[fila]?.[col] ?? 0)}
                </td>
              ))}
              <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                {fmt(pivot.totalesFila[fila] ?? 0)}
              </td>
            </tr>
          ))}
          <tr className="border-t bg-muted/30 font-medium">
            <td className="px-3 py-2">Total</td>
            {pivot.columnas.map((col) => (
              <td key={col} className="px-3 py-2 text-right tabular-nums">
                {fmt(pivot.totalesColumna[col] ?? 0)}
              </td>
            ))}
            <td className="px-3 py-2 text-right tabular-nums">{fmt(pivot.granTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n)
}