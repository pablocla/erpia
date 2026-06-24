"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Save,
  ChevronLeft,
  ClipboardCheck,
} from "lucide-react"
import { authFetch } from "@/lib/stores"
import type { ChecklistItem } from "@/lib/impuestos/pre-presentacion-service"

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export default function PrePresentacionPage() {
  const ahora = new Date()
  const [mes, setMes] = useState(ahora.getMonth() + 1)
  const [anio, setAnio] = useState(ahora.getFullYear())
  const [loading, setLoading] = useState(false)
  const [persistiendo, setPersistiendo] = useState(false)
  const [listo, setListo] = useState(false)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [resumen, setResumen] = useState<{ ok: number; total: number; criticos: number } | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/impuestos/pre-presentacion?mes=${mes}&anio=${anio}`)
      const data = await res.json()
      if (data.success) {
        setItems(data.items ?? [])
        setListo(data.listo ?? false)
        setResumen(data.resumen ?? null)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [mes, anio])

  const persistirLiquidacion = async () => {
    setPersistiendo(true)
    try {
      const res = await authFetch("/api/impuestos/pre-presentacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mes, anio }),
      })
      const data = await res.json()
      if (data.success) {
        setItems(data.checklist?.items ?? [])
        setListo(data.checklist?.listo ?? false)
        setResumen(data.checklist?.resumen ?? null)
      }
    } catch {
      /* ignore */
    } finally {
      setPersistiendo(false)
    }
  }

  const iconoItem = (item: ChecklistItem) => {
    if (item.ok) return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
    if (item.severidad === "critico") return <XCircle className="h-5 w-5 text-red-500 shrink-0" />
    return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/impuestos">
          <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
        </Link>
        <ClipboardCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Checklist Pre-Presentación</h1>
          <p className="text-sm text-muted-foreground">
            Validaciones automáticas antes de presentar IVA / IIBB / SICORE
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Período</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div className="w-40">
            <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MESES.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-28">
            <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[anio - 1, anio, anio + 1].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={cargar} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Evaluar
          </Button>
          <Button variant="secondary" onClick={persistirLiquidacion} disabled={persistiendo}>
            {persistiendo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Persistir liquidación IVA
          </Button>
        </CardContent>
      </Card>

      {resumen && (
        <div className="flex items-center gap-3">
          <Badge variant={listo ? "default" : "destructive"} className="text-sm px-3 py-1">
            {listo ? "Listo para presentar" : `${resumen.criticos} bloqueo(s) crítico(s)`}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {resumen.ok}/{resumen.total} validaciones OK
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Validaciones del período</CardTitle>
          <CardDescription>
            Cada ítem debe estar en verde antes de cerrar el mes y presentar ante AFIP/ARBA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Presioná &quot;Evaluar&quot; para correr el checklist del período seleccionado
            </p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card"
            >
              {iconoItem(item)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{item.label}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {item.severidad}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{item.detalle}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}