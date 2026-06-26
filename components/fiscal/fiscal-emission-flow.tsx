"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, GitBranch } from "lucide-react"
import {
  EMISSION_PATHS,
  resolveEmissionPath,
  type ResolveEmissionPathInput,
} from "@/lib/fiscal/emission-flow"

interface FiscalEmissionFlowProps {
  /** Resalta el camino activo según el último comprobante */
  active?: ResolveEmissionPathInput
  compact?: boolean
}

export function FiscalEmissionFlow({ active, compact = false }: FiscalEmissionFlowProps) {
  const [open, setOpen] = useState(!compact)
  const activePath = active ? resolveEmissionPath(active) : null

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            Rutas de emisión fiscal
          </CardTitle>
          {compact && (
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setOpen((v) => !v)}>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
        {activePath && (
          <p className="text-xs text-muted-foreground">
            Camino actual: <strong>{activePath.label}</strong>
          </p>
        )}
      </CardHeader>
      {open && (
        <CardContent className="space-y-2 pt-0">
          <div className="grid gap-2 sm:grid-cols-2">
            {EMISSION_PATHS.map((path) => {
              const isActive = activePath?.id === path.id
              return (
                <div
                  key={path.id}
                  className={`rounded-lg border p-2.5 text-xs ${
                    isActive ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{path.label}</span>
                    {isActive && <Badge className="text-[9px] h-4">Activo</Badge>}
                    {path.modalidadAuth && (
                      <Badge variant="outline" className="text-[9px] h-4">
                        {path.modalidadAuth}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{path.descripcion}</p>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-muted-foreground pt-1">
            Cobro con tarjeta/QR en POS es registro de caja (manual o MercadoPago).
            No integra Posnet — el comprobante fiscal se emite por AFIP independientemente del medio de cobro.
          </p>
        </CardContent>
      )}
    </Card>
  )
}