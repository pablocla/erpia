"use client"

import { useCallback, useEffect, useState } from "react"
import {
  BarChart3,
  Eye,
  FileSpreadsheet,
  LayoutGrid,
  LineChart,
  Loader2,
  RefreshCw,
  Table2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TemplatePreviewResult } from "@/components/reporting/TemplatePreviewResult"
import type { SheetTemplate } from "@/lib/reporting/templates/types"
import type { QueryResult } from "@/lib/reporting/semantic/types"

const VISTA_META = {
  plano: { label: "Tabla plana", icon: Table2 },
  pivot: { label: "Pivot", icon: LayoutGrid },
  grafico: { label: "Gráfico", icon: BarChart3 },
} as const

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" }
}

export function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: {
  template: SheetTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  loading?: boolean
}) {
  const [previewResult, setPreviewResult] = useState<QueryResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewLoaded, setPreviewLoaded] = useState(false)

  const cargarPreview = useCallback(async () => {
    if (!template) return
    setPreviewLoading(true)
    setPreviewError(null)
    try {
      const res = await fetch(`/api/reporting/templates/${template.id}/preview`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ limit: 150 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "No se pudo cargar el ejemplo")
      setPreviewResult(data as QueryResult)
      setPreviewLoaded(true)
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Error")
      setPreviewResult(null)
    } finally {
      setPreviewLoading(false)
    }
  }, [template])

  useEffect(() => {
    if (!open) {
      setPreviewResult(null)
      setPreviewLoaded(false)
      setPreviewError(null)
      setPreviewLoading(false)
    }
  }, [open])

  if (!template) return null

  const vista = VISTA_META[template.vista]
  const VistaIcon = template.vista === "grafico" ? LineChart : vista.icon
  const filtros = template.definicion.filtros

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {template.nombre}
          </DialogTitle>
          <DialogDescription>{template.descripcion}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm overflow-y-auto flex-1 min-h-0 pr-1">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              <VistaIcon className="h-3 w-3 mr-1" />
              {vista.label}
            </Badge>
            <Badge variant="outline" className="text-[10px] capitalize">
              {template.fuente.replace("_", " ")}
            </Badge>
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>

          {filtros.length > 0 && (
            <p className="text-[11px] text-muted-foreground rounded-md border bg-muted/20 px-2.5 py-1.5">
              <span className="font-medium text-foreground">Período actualizado: </span>
              {filtros.map((f) => `${f.campo} ${f.op} ${f.valor}`).join(" · ")}
            </p>
          )}

          <div className="rounded-lg border bg-background overflow-hidden">
            {!previewLoaded && !previewLoading && (
              <div className="flex flex-col items-center justify-center py-10 px-4 gap-3 text-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Mirá un ejemplo con tus datos reales (máx. 150 registros, sin consumir consultas del plan).
                </p>
                <Button size="sm" onClick={() => void cargarPreview()}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver ejemplo
                </Button>
              </div>
            )}

            {previewLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Generando preview…</p>
              </div>
            )}

            {previewError && (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-destructive">{previewError}</p>
                <Button size="sm" variant="outline" onClick={() => void cargarPreview()}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Reintentar
                </Button>
              </div>
            )}

            {previewLoaded && previewResult && !previewLoading && (
              <div className="p-2">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] text-muted-foreground">
                    {previewResult.totalFilas} filas
                    {previewResult.truncado ? " (muestra limitada)" : ""}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10px]"
                    onClick={() => void cargarPreview()}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Actualizar
                  </Button>
                </div>
                <TemplatePreviewResult result={previewResult} vista={template.vista} />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 shrink-0 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {!previewLoaded && (
            <Button variant="secondary" onClick={() => void cargarPreview()} disabled={previewLoading}>
              {previewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Ver ejemplo
            </Button>
          )}
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Usar esta plantilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}