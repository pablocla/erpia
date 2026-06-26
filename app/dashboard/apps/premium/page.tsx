"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Package,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { getAuthHeaders } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

type GuardianPos = {
  nivel: "bajo" | "medio" | "alto"
  score: number
  anulacionesHoy: number
  devolucionesHoy: number
  ventasHoy: number
  alertas: string[]
}

type Liquidacion = {
  diferencia: number
  ventasQrTarjeta: number
  liquidadoMp: number
  alerta: boolean
}

type Fiscal = {
  montoRecuperableEstimado: number
  comprasSinDetalle: number
  proveedoresRiesgo: number
  alerta: boolean
}

type Propuesta = {
  nombre: string
  codigo: string
  cantidadSugerida: number
  urgencia: string
  diasCobertura: number
}

type Servicio = {
  sku: string
  nombre: string
  status: string
  precioArs: number
  activo: boolean
}

type Resumen = {
  guardianPos: GuardianPos
  liquidacionPagos: Liquidacion
  recuperadorFiscal: Fiscal
  reponedorJit: { total: number; urgentes: number; propuestas: Propuesta[] }
  servicios: Servicio[]
}

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

const riesgoColor = (nivel: string) => {
  if (nivel === "alto") return "destructive"
  if (nivel === "medio") return "secondary"
  return "outline"
}

export default function PremiumErp7Page() {
  const { toast } = useToast()
  const [data, setData] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/marketplace/intangibles/premium/resumen", {
        headers: getAuthHeaders(),
      })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function toggleSku(sku: string, activo: boolean) {
    setBusy(sku)
    try {
      const res = await fetch("/api/platform/productos", {
        method: "PATCH",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "sku", sku, activo }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Error")
      await cargar()
      window.dispatchEvent(new Event("productos-updated"))
      toast({ title: activo ? "Servicio activado" : "Servicio desactivado", description: sku })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "No se pudo cambiar",
        description: e instanceof Error ? e.message : "Error",
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex-1 w-full p-4 md:p-8 pt-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/apps"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            App Store
          </Link>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-500" />
            Premium ERP 7
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Guardián POS, liquidación MP, fiscal, reposición JIT y más — en un solo panel.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void cargar()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {loading && !data ? (
        <p className="text-sm text-muted-foreground text-center py-12">Cargando métricas…</p>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-violet-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-violet-500" />
                  Guardián POS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={riesgoColor(data.guardianPos.nivel)}>{data.guardianPos.nivel}</Badge>
                  <span className="text-2xl font-semibold">{data.guardianPos.score}</span>
                  <span className="text-xs text-muted-foreground">score</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {data.guardianPos.ventasHoy} ventas · {data.guardianPos.anulacionesHoy} anul. ·{" "}
                  {data.guardianPos.devolucionesHoy} devol.
                </p>
                {data.guardianPos.alertas.length > 0 && (
                  <ul className="mt-2 text-[11px] text-amber-700 space-y-0.5">
                    {data.guardianPos.alertas.map((a) => (
                      <li key={a}>• {a}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-500" />
                  Liquidación MP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-semibold ${data.liquidacionPagos.alerta ? "text-amber-600" : ""}`}>
                  {fmt(data.liquidacionPagos.diferencia)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  POS {fmt(data.liquidacionPagos.ventasQrTarjeta)} vs MP{" "}
                  {fmt(data.liquidacionPagos.liquidadoMp)}
                </p>
                {data.liquidacionPagos.alerta && (
                  <p className="text-[11px] text-amber-700 mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Revisar conciliación
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Recuperador Fiscal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{fmt(data.recuperadorFiscal.montoRecuperableEstimado)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.recuperadorFiscal.comprasSinDetalle} compras sin detalle ·{" "}
                  {data.recuperadorFiscal.proveedoresRiesgo} proveedores riesgo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-500" />
                  Reponedor JIT
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{data.reponedorJit.urgentes}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  urgentes de {data.reponedorJit.total} propuestas
                </p>
              </CardContent>
            </Card>
          </div>

          {data.reponedorJit.propuestas.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top reposición JIT</CardTitle>
              </CardHeader>
              <CardContent className="divide-y text-sm">
                {data.reponedorJit.propuestas.map((p) => (
                  <div key={p.codigo} className="flex items-center justify-between py-2 gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.codigo} · {p.diasCobertura}d cobertura
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={p.urgencia === "alta" ? "destructive" : "outline"}>
                        {p.urgencia}
                      </Badge>
                      <span className="text-xs font-mono">+{p.cantidadSugerida}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Servicios Premium 7</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {data.servicios.map((s) => (
                <div key={s.sku} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{s.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmt(s.precioArs)}/mes · {s.sku}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {s.status}
                  </Badge>
                  <Switch
                    checked={s.activo}
                    disabled={busy === s.sku || s.status === "planned"}
                    onCheckedChange={(v) => void toggleSku(s.sku, v)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-12">No se pudo cargar el panel.</p>
      )}
    </div>
  )
}