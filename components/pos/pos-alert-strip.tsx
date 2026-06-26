"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, ChevronDown, ChevronUp, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface PosAlertItem {
  id: string
  severity: "error" | "warning" | "info"
  mensaje: string
  accion?: { label: string; href: string }
  inline?: React.ReactNode
}

interface PosAlertStripProps {
  alertas: PosAlertItem[]
}

const STYLES = {
  error: "bg-destructive/10 border-destructive/30 text-destructive",
  warning: "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100",
  info: "bg-muted/50 border-border text-muted-foreground",
}

export function PosAlertStrip({ alertas }: PosAlertStripProps) {
  const [expandido, setExpandido] = useState(false)

  if (alertas.length === 0) return null

  const principal = alertas[0]
  const resto = alertas.slice(1)

  return (
    <div className="shrink-0 border-b space-y-0">
      <div
        className={`flex items-center justify-between gap-2 px-3 py-1.5 sm:px-4 sm:py-2 border-b ${STYLES[principal.severity]}`}
      >
        <div className="flex items-center gap-2 min-w-0 text-xs sm:text-sm">
          {principal.severity === "error" ? (
            <Lock className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate sm:whitespace-normal">{principal.mensaje}</span>
          {principal.inline}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {principal.accion && (
            <Link href={principal.accion.href}>
              <Button size="sm" variant={principal.severity === "error" ? "destructive" : "outline"} className="h-7 text-[10px] sm:text-xs px-2">
                {principal.accion.label}
              </Button>
            </Link>
          )}
          {resto.length > 0 && (
            <button
              type="button"
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => setExpandido((v) => !v)}
              aria-label={expandido ? "Ocultar avisos" : "Ver más avisos"}
            >
              {expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="sr-only">+{resto.length}</span>
            </button>
          )}
        </div>
      </div>
      {expandido &&
        resto.map((a) => (
          <div
            key={a.id}
            className={`flex items-center justify-between gap-2 px-3 py-1.5 sm:px-4 border-b last:border-b-0 ${STYLES[a.severity]}`}
          >
            <span className="text-[11px] sm:text-xs min-w-0">{a.mensaje}</span>
            {a.accion && (
              <Link href={a.accion.href}>
                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 shrink-0">
                  {a.accion.label}
                </Button>
              </Link>
            )}
            {a.inline}
          </div>
        ))}
    </div>
  )
}