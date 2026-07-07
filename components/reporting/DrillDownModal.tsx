"use client"

import { Loader2, Table2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ReportPlanoTable } from "@/components/reporting/ReportPlanoTable"
import type { QueryResult } from "@/lib/reporting/semantic/types"

export function DrillDownModal({
  open,
  onOpenChange,
  result,
  loading,
  title = "Detalle transaccional",
  description = "Comprobantes y filas subyacentes al segmento seleccionado.",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: QueryResult | null
  loading: boolean
  title?: string
  description?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Cargando detalle…
            </div>
          ) : result ? (
            <ReportPlanoTable columns={result.columns} rows={result.rows} />
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">
              No hay datos para mostrar.
            </p>
          )}
        </div>

        {result && !loading && (
          <p className="text-xs text-muted-foreground shrink-0 pt-2 border-t">
            {result.totalFilas} filas {result.truncado ? "(truncado a 500)" : ""}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}