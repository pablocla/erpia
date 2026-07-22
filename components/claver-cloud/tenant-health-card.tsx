"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Shield, Wallet, Store, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type HealthPayload = {
  empresaId: number
  empresaNombre: string
  afipStatus: {
    tieneCertificado: boolean
    diasParaVencimiento: number
    estadoCertificado: "OK" | "POR_VENCER" | "VENCIDO" | "NO_CONFIGURADO"
    entorno?: string
  }
  mercadopagoStatus: {
    tokenConfigurado: boolean
    tokenValido: boolean
    qrHabilitado?: boolean
  }
  cajaStatus: {
    cajaAbierta: boolean
    ultimaApertura?: string | null
    operadorActual?: string
  }
  erroresRecientes: { mensaje?: string; severidad?: string; createdAt?: string }[]
  health?: { nivel: string; label: string }
  checkedAt?: string
}

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" }
}

function semaforo(ok: boolean, warn = false) {
  if (ok && !warn) return "bg-emerald-500"
  if (warn) return "bg-amber-500"
  return "bg-red-500"
}

interface TenantHealthCardProps {
  empresaId: string | number
  onImpersonate?: () => void
  className?: string
}

export function TenantHealthCard({ empresaId, onImpersonate, className }: TenantHealthCardProps) {
  const [data, setData] = useState<HealthPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/claver/tenants/${empresaId}/health`, {
        headers: authHeaders(),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Error ${res.status}`)
      }
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar health")
    } finally {
      setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    void load()
  }, [load])

  const afipOk = data?.afipStatus.estadoCertificado === "OK"
  const afipWarn = data?.afipStatus.estadoCertificado === "POR_VENCER"
  const mpOk = Boolean(data?.mercadopagoStatus.tokenValido)
  const cajaOk = Boolean(data?.cajaStatus.cajaAbierta)

  return (
    <Card className={cn("border-border/60", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          Diagnóstico tenant
          {data?.empresaNombre ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {data.empresaNombre}
            </span>
          ) : null}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("h-2 w-2 rounded-full", semaforo(afipOk, afipWarn))} />
              <Shield className="h-3.5 w-3.5" />
              AFIP
            </div>
            <p className="text-sm font-medium">
              {data?.afipStatus.estadoCertificado ?? "—"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {data?.afipStatus.tieneCertificado
                ? `Entorno: ${data.afipStatus.entorno ?? "—"}`
                : "Sin certificado"}
            </p>
          </div>

          <div className="rounded-lg border p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("h-2 w-2 rounded-full", semaforo(mpOk))} />
              <Wallet className="h-3.5 w-3.5" />
              MercadoPago
            </div>
            <p className="text-sm font-medium">
              {mpOk ? "Token OK" : data?.mercadopagoStatus.tokenConfigurado ? "Inactivo" : "No config."}
            </p>
          </div>

          <div className="rounded-lg border p-3 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("h-2 w-2 rounded-full", semaforo(cajaOk, false))} />
              <Store className="h-3.5 w-3.5" />
              Caja
            </div>
            <p className="text-sm font-medium">{cajaOk ? "Abierta" : "Cerrada"}</p>
            {data?.cajaStatus.operadorActual && (
              <p className="text-[11px] text-muted-foreground">{data.cajaStatus.operadorActual}</p>
            )}
          </div>
        </div>

        {data?.health && (
          <Badge variant="outline" className="text-xs">
            Salud global: {data.health.label} ({data.health.nivel})
          </Badge>
        )}

        {data?.erroresRecientes && data.erroresRecientes.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Últimos eventos</p>
            <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
              {data.erroresRecientes.map((e, i) => (
                <li key={i} className="truncate text-muted-foreground">
                  {e.mensaje}
                </li>
              ))}
            </ul>
          </div>
        )}

        {onImpersonate && (
          <Button className="w-full" variant="secondary" onClick={onImpersonate}>
            Ingresar como Soporte
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
