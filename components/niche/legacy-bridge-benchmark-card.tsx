"use client"

import { useCallback, useState } from "react"
import { Gauge, Play, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAuthHeaders } from "@/lib/stores/auth-store"
import { cn } from "@/lib/utils"

const ENTITIES = [
  { id: "Customer", label: "Clientes" },
  { id: "Product", label: "Productos" },
  { id: "Invoice", label: "Facturas" },
  { id: "Order", label: "Pedidos" },
  { id: "Supplier", label: "Proveedores" },
] as const

type EntityId = (typeof ENTITIES)[number]["id"]

type BenchmarkResult = {
  entity: string
  legacy: { label: string; latencyMs: number; count: number; adapterId: string }
  claver: { label: string; latencyMs: number; count: number; adapterId: string }
  speedupFactor: number
  narrative: string
}

export function LegacyBridgeBenchmarkCard() {
  const [entity, setEntity] = useState<EntityId>("Customer")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BenchmarkResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const correr = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/legacy-bridge/benchmark?entity=${entity}&fast=1`,
        { headers: getAuthHeaders() },
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error ?? "No se pudo ejecutar el benchmark")
        return
      }
      setResult(await res.json())
    } catch {
      setError("Error de red al ejecutar benchmark")
    } finally {
      setLoading(false)
    }
  }, [entity])

  const maxMs = result ? Math.max(result.legacy.latencyMs, result.claver.latencyMs, 1) : 1

  return (
    <Card className="border-dashed bg-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          Legacy Bridge — demo Protheus vs Claver Edge
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Mostrá al cliente por qué el WebApp legacy es lento y Claver Edge responde al instante.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={entity} onValueChange={(v) => setEntity(v as EntityId)}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENTITIES.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => void correr()} disabled={loading}>
            <Play className="h-4 w-4 mr-1" />
            {loading ? "Midiendo…" : "Correr demo"}
          </Button>
          {result && (
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              {result.speedupFactor}× más rápido
            </Badge>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && (
          <div className="space-y-3">
            <p className="text-sm font-medium">{result.narrative}</p>
            <div className="space-y-2">
              <LatencyBar
                label={result.legacy.label}
                ms={result.legacy.latencyMs}
                maxMs={maxMs}
                variant="legacy"
                count={result.legacy.count}
              />
              <LatencyBar
                label={result.claver.label}
                ms={result.claver.latencyMs}
                maxMs={maxMs}
                variant="claver"
                count={result.claver.count}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Adaptador legacy: {result.legacy.adapterId} · Claver: {result.claver.adapterId}
            </p>
          </div>
        )}

        {!result && !loading && (
          <p className="text-xs text-muted-foreground">
            Tip vendedor: corré la demo con el cliente mirando — el contraste de barras cierra el upsell
            enterprise.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function LatencyBar({
  label,
  ms,
  maxMs,
  variant,
  count,
}: {
  label: string
  ms: number
  maxMs: number
  variant: "legacy" | "claver"
  count: number
}) {
  const pct = Math.max(8, Math.round((ms / maxMs) * 100))
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="tabular-nums">
          {ms.toLocaleString("es-AR")} ms · {count} reg.
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            variant === "legacy" ? "bg-amber-500/80" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}