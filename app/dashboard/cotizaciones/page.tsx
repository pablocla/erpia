"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DollarSign, TrendingUp, TrendingDown, RefreshCw,
  ArrowUpDown, Globe, Clock,
} from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface Cotizacion {
  monedaPar: string
  compra: number
  venta: number
  fecha: string
  fuente: string
}

const MONEDA_LABELS: Record<string, string> = {
  USD_OFICIAL: "Dólar Oficial",
  USD_MEP: "Dólar MEP (Bolsa)",
  USD_CCL: "Dólar CCL",
  EUR: "Euro",
  BRL: "Real brasileño",
}

const MONEDA_ICONS: Record<string, string> = {
  USD_OFICIAL: "🇺🇸",
  USD_MEP: "📈",
  USD_CCL: "💱",
  EUR: "🇪🇺",
  BRL: "🇧🇷",
}

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [historial, setHistorial] = useState<Cotizacion[]>([])
  const [monedaSeleccionada, setMonedaSeleccionada] = useState("USD_OFICIAL")
  const [loading, setLoading] = useState(true)
  const [actualizando, setActualizando] = useState(false)

  const headers = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cotRes, histRes] = await Promise.all([
        fetch("/api/cotizaciones", { headers }),
        fetch(`/api/cotizaciones?moneda=${monedaSeleccionada}&dias=30`, { headers }),
      ])
      if (cotRes.ok) setCotizaciones(await cotRes.json())
      if (histRes.ok) setHistorial(await histRes.json())
    } finally {
      setLoading(false)
    }
  }, [monedaSeleccionada])

  useEffect(() => { fetchData() }, [fetchData])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: fetchData,
  }))

  async function handleActualizar() {
    setActualizando(true)
    try {
      await fetch("/api/cotizaciones", {
        method: "POST",
        headers,
      })
      fetchData()
    } finally {
      setActualizando(false)
    }
  }

  const cotizacionActual = cotizaciones.find((c) => c.monedaPar === monedaSeleccionada)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cotizaciones</h1>
          <p className="text-muted-foreground">
            Tipo de cambio automático — Dólar, Euro, Real
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleActualizar} disabled={actualizando}>
          <RefreshCw className={`mr-2 h-4 w-4 ${actualizando ? "animate-spin" : ""}`} />
          {actualizando ? "Actualizando..." : "Actualizar cotizaciones"}
        </Button>
      </div>

      {/* Cotizaciones actuales */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cotizaciones.map((cot) => (
          <Card
            key={cot.monedaPar}
            className={`cursor-pointer transition-all ${
              monedaSeleccionada === cot.monedaPar ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setMonedaSeleccionada(cot.monedaPar)}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{MONEDA_ICONS[cot.monedaPar] ?? "💰"}</span>
                <Badge variant="outline" className="text-xs">{cot.fuente}</Badge>
              </div>
              <p className="font-semibold text-sm">{MONEDA_LABELS[cot.monedaPar] ?? cot.monedaPar}</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Compra</p>
                  <p className="font-bold text-emerald-600">${Number(cot.compra).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Venta</p>
                  <p className="font-bold text-red-600">${Number(cot.venta).toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(cot.fecha).toLocaleDateString("es-AR")}
              </p>
            </CardContent>
          </Card>
        ))}
        {cotizaciones.length === 0 && !loading && (
          <Card className="col-span-full">
            <CardContent className="py-10 text-center text-muted-foreground">
              No hay cotizaciones cargadas. Hacé clic en &quot;Actualizar cotizaciones&quot; para obtenerlas.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Historial */}
      {historial.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Historial {MONEDA_LABELS[monedaSeleccionada]} — Últimos 30 días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Fecha</th>
                    <th className="py-2 pr-4 text-right">Compra</th>
                    <th className="py-2 pr-4 text-right">Venta</th>
                    <th className="py-2 pr-4 text-right">Spread</th>
                    <th className="py-2">Fuente</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h, i) => {
                    const spread = ((Number(h.venta) - Number(h.compra)) / Number(h.compra) * 100)
                    const prevVenta = i > 0 ? Number(historial[i - 1].venta) : Number(h.venta)
                    const change = Number(h.venta) - prevVenta
                    return (
                      <tr key={`${h.fecha}-${h.fuente}`} className="border-b border-muted/50">
                        <td className="py-2 pr-4">{new Date(h.fecha).toLocaleDateString("es-AR")}</td>
                        <td className="py-2 pr-4 text-right font-mono">${Number(h.compra).toFixed(2)}</td>
                        <td className="py-2 pr-4 text-right font-mono">${Number(h.venta).toFixed(2)}</td>
                        <td className="py-2 pr-4 text-right font-mono text-muted-foreground">{spread.toFixed(1)}%</td>
                        <td className="py-2">
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">{h.fuente}</Badge>
                            {change > 0 && <TrendingUp className="h-3 w-3 text-red-500" />}
                            {change < 0 && <TrendingDown className="h-3 w-3 text-emerald-500" />}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
