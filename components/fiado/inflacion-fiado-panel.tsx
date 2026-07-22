"use client"

/**
 * Panel Fiado + índice de inflación (modo informativo por default).
 * Usa lib/inflacion + APIs /api/inflacion/*
 */

import { useCallback, useEffect, useState } from "react"
import { authFetch } from "@/lib/stores"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, TrendingDown, Info } from "lucide-react"

type Policy = {
  subsystem: string
  activo: boolean
  soloInformativo: boolean
  indiceCodigo: string
  diasGraciaNominal: number
}

type Valuacion = {
  montoOriginal: number
  montoCobrableHoy: number
  soloInformativo: boolean
  policyActiva: boolean
  mensajeComerciante: string
  reexpresion: {
    montoAjustado: number
    perdidaPoderAdquisitivo: number
    factor: number
    periodoOrigen: string
    periodoValuacion: string
  }
}

export function InflacionFiadoPanel({
  saldoTotal,
  muestraMontoEjemplo = 10_000,
}: {
  /** Saldo total de la libreta (si hay) para valuación global */
  saldoTotal?: number
  muestraMontoEjemplo?: number
}) {
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [valuacion, setValuacion] = useState<Valuacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await authFetch("/api/inflacion/config")
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "No se pudo cargar política de inflación")
        return
      }
      const fiado = (data.tenant as Policy[] | undefined)?.find((p) => p.subsystem === "fiado")
      setPolicy(fiado ?? null)

      const monto = saldoTotal && saldoTotal > 0 ? saldoTotal : muestraMontoEjemplo
      // Origen: hace ~6 meses para que el seed IPC muestre diferencia
      const origen = new Date()
      origen.setMonth(origen.getMonth() - 6)

      const r2 = await authFetch("/api/inflacion/reexpresar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "tenant",
          subsystem: "fiado",
          montoOriginal: monto,
          fechaOrigen: origen.toISOString(),
        }),
      })
      const d2 = await r2.json()
      if (r2.ok && d2.valuacion) setValuacion(d2.valuacion)
    } catch {
      setError("Error de conexión con módulo de inflación")
    } finally {
      setLoading(false)
    }
  }, [saldoTotal, muestraMontoEjemplo])

  useEffect(() => {
    void load()
  }, [load])

  async function patchPolicy(patch: Partial<Policy>) {
    setSaving(true)
    setError("")
    try {
      const res = await authFetch("/api/inflacion/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subsystem: "fiado", ...patch }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "No se pudo guardar")
        return
      }
      setPolicy(data.policy)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(n)

  if (loading && !policy) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando índice de inflación…
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-amber-200/60 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-700" />
              Fiado e inflación (IPC)
            </CardTitle>
            <CardDescription>
              Ve cuánto poder adquisitivo perdés por cobrar tarde. Por defecto solo informa; no cambia el
              saldo cobrable sin activar cobro indexado.
            </CardDescription>
          </div>
          <Badge variant="outline">Referencia IPC</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Mostrar valuación por inflación</Label>
            <p className="text-xs text-muted-foreground">Activa el cálculo en esta libreta (modo seguro).</p>
          </div>
          <Switch
            checked={!!policy?.activo}
            disabled={saving}
            onCheckedChange={(v) =>
              void patchPolicy({ activo: v, soloInformativo: true })
            }
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Solo informativo (recomendado)</Label>
            <p className="text-xs text-muted-foreground">
              Si está ON, el cobro sigue en pesos nominales. Si OFF, el sistema propondrá monto
              indexado (revisar con abogado antes de usarlo con clientes).
            </p>
          </div>
          <Switch
            checked={policy?.soloInformativo !== false}
            disabled={saving || !policy?.activo}
            onCheckedChange={(v) => void patchPolicy({ soloInformativo: v })}
          />
        </div>

        {policy?.activo && valuacion && (
          <div className="rounded-lg border bg-background p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nominal / referencia</span>
              <span className="font-medium">{fmt(valuacion.montoOriginal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor en poder adquisitivo hoy</span>
              <span className="font-semibold text-amber-800 dark:text-amber-200">
                {fmt(valuacion.reexpresion.montoAjustado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pérdida estimada por mora/inflación</span>
              <span className="font-medium text-destructive">
                {fmt(valuacion.reexpresion.perdidaPoderAdquisitivo)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex gap-1.5 pt-1">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {valuacion.mensajeComerciante}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Períodos índice {valuacion.reexpresion.periodoOrigen} →{" "}
              {valuacion.reexpresion.periodoValuacion} · factor {valuacion.reexpresion.factor}. No es
              tasa de interés; es reexpresión por índice de referencia.
            </p>
          </div>
        )}

        {!policy?.activo && (
          <p className="text-xs text-muted-foreground">
            Activá la valuación para ver cuánto se licúa la cartera de fiado. El pack gratuito puede
            dejarlo en informativo; el cobro indexado es opt-in.
          </p>
        )}

        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
          Actualizar cálculo
        </Button>
      </CardContent>
    </Card>
  )
}
