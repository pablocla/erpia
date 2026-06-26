"use client"

import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, FileText, Loader2, QrCode, RefreshCw } from "lucide-react"

export interface FiscalEmissionData {
  success: boolean
  numero?: string | number
  tipo?: string
  cae?: string
  vencimientoCAE?: string
  qrBase64?: string
  error?: string
  pendienteCae?: boolean
  esFce?: boolean
  esExportacion?: boolean
  esTicket?: boolean
  modalidadAuth?: "CAE" | "CAEA" | "NINGUNA"
}

interface FiscalEmissionResultProps {
  data: FiscalEmissionData | null
  className?: string
  title?: string
  onRetry?: () => void
  retrying?: boolean
  actions?: ReactNode
}

export function FiscalEmissionResult({
  data,
  className,
  title = "Resultado fiscal",
  onRetry,
  retrying = false,
  actions,
}: FiscalEmissionResultProps) {
  if (!data) return null

  if (!data.success && !data.pendienteCae) {
    return (
      <Card className={cn("border-red-200 bg-red-50/50 dark:bg-red-950/20", className)}>
        <CardContent className="pt-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">Error de emisión AFIP</p>
            <p className="text-sm text-red-700/90 dark:text-red-300 mt-1">{data.error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.pendienteCae || !data.cae) {
    return (
      <Card className={cn("border-amber-200 bg-amber-50/50 dark:bg-amber-950/20", className)}>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Comprobante guardado — pendiente de CAE</p>
              {data.numero != null && (
                <p className="text-sm flex items-center gap-1.5 mt-1">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono">
                    {data.tipo ? `${data.tipo}-` : ""}
                    {data.numero}
                  </span>
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {data.error ?? "AFIP no respondió. Reintentá la emisión o sincronizá desde Facturas."}
              </p>
            </div>
          </div>
          {(onRetry || actions) && (
            <div className="flex flex-wrap gap-2 pl-8">
              {onRetry && (
                <Button size="sm" variant="secondary" onClick={onRetry} disabled={retrying}>
                  {retrying ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Reintentar CAE
                </Button>
              )}
              {actions}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20", className)}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">{title}</p>
              {data.esFce && (
                <Badge className="bg-amber-500/90 text-amber-950 text-[10px]">FCE MiPyME</Badge>
              )}
              {data.esExportacion && (
                <Badge variant="outline" className="text-[10px]">Exportación</Badge>
              )}
              {data.modalidadAuth === "CAEA" && (
                <Badge className="bg-violet-600/90 text-[10px]">CAEA</Badge>
              )}
              {data.esTicket && (
                <Badge variant="destructive" className="text-[10px]">Sin CAE</Badge>
              )}
            </div>
            {data.numero != null && (
              <p className="text-sm flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono">
                  {data.tipo ? `${data.tipo}-` : ""}
                  {data.numero}
                </span>
              </p>
            )}
            <p className="text-sm">
              <span className="text-muted-foreground">
                {data.modalidadAuth === "CAEA" ? "CAEA:" : "CAE:"}
              </span>{" "}
              <span className="font-mono font-medium">{data.cae}</span>
            </p>
            {data.vencimientoCAE && (
              <p className="text-xs text-muted-foreground">
                Vence {new Date(data.vencimientoCAE).toLocaleDateString("es-AR")}
              </p>
            )}
          </div>
          {data.qrBase64 && (
            <div className="text-center shrink-0">
              <img
                src={data.qrBase64}
                alt="QR AFIP"
                className="h-24 w-24 rounded-lg border bg-white p-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <QrCode className="h-3 w-3" />
                QR fiscal
              </p>
            </div>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2 mt-3">{actions}</div>}
      </CardContent>
    </Card>
  )
}