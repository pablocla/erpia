"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"
import { cn } from "@/lib/utils"
import { Loader2, Search, CheckCircle2, AlertCircle } from "lucide-react"

export interface PadronLookupResult {
  cuit: string
  denominacion: string
  condicionIva: string
  condicionIvaCodigo: number
  estadoClave: string
  domicilioFiscal?: {
    direccion: string
    localidad: string
    provincia: string
    codigoPostal: string
  }
  actividadPrincipal?: { codigo: string; descripcion: string }
}

const CONDICION_MAP: Record<string, string> = {
  "Responsable Inscripto": "RESPONSABLE_INSCRIPTO",
  Monotributista: "MONOTRIBUTISTA",
  Exento: "EXENTO",
  "Consumidor Final": "CONSUMIDOR_FINAL",
}

interface CuitPadronLookupProps {
  cuit: string
  disabled?: boolean
  onResult: (result: PadronLookupResult) => void
  className?: string
}

export function CuitPadronLookup({ cuit, disabled, onResult, className }: CuitPadronLookupProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<PadronLookupResult | null>(null)

  const cuitLimpio = cuit.replace(/\D/g, "")

  async function consultar() {
    if (cuitLimpio.length !== 11) {
      toast({
        title: "CUIT inválido",
        description: "Ingresá un CUIT de 11 dígitos antes de consultar AFIP.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const res = await authFetch("/api/afip/padron", {
        method: "POST",
        body: JSON.stringify({ cuit: cuitLimpio }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Sin resultados",
          description: data.error ?? "No se encontró el CUIT en el padrón ARCA",
          variant: "destructive",
        })
        setLastResult(null)
        return
      }

      const result = data as PadronLookupResult
      setLastResult(result)
      onResult(result)
      toast({
        title: "Datos cargados desde AFIP",
        description: result.denominacion,
      })
    } catch {
      toast({ title: "Error de conexión con AFIP", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300"
        onClick={() => void consultar()}
        disabled={disabled || loading || cuitLimpio.length !== 11}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        Consultar CUIT en AFIP
      </Button>

      {lastResult && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="space-y-1 min-w-0">
              <p className="font-medium truncate">{lastResult.denominacion}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[10px]">
                  {lastResult.condicionIva}
                </Badge>
                <Badge
                  variant={lastResult.estadoClave === "AC" ? "default" : "destructive"}
                  className="text-[10px]"
                >
                  {lastResult.estadoClave === "AC" ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              {lastResult.domicilioFiscal && (
                <p className="text-xs text-muted-foreground">
                  {lastResult.domicilioFiscal.direccion}, {lastResult.domicilioFiscal.localidad}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {cuitLimpio.length > 0 && cuitLimpio.length !== 11 && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          El CUIT debe tener 11 dígitos para consultar AFIP
        </p>
      )}
    </div>
  )
}

export function mapCondicionIvaPadron(condicionIva: string): string {
  return CONDICION_MAP[condicionIva] ?? condicionIva
}