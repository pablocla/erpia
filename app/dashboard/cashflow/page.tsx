"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowDownRight, ArrowUpRight, TrendingUp, RefreshCw,
  DollarSign, Calendar, BarChart3, Wallet,
} from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { DateRangePicker } from "@/components/date-range-picker"
import { type DateRange } from "react-day-picker"

interface FlujoCajaSemana {
  semana: string
  ingresos: number
  egresos: number
  neto: number
  acumulado: number
}

interface Resumen {
  proximos30: { ingresos: number; egresos: number; neto: number }
  proximos60: { ingresos: number; egresos: number; neto: number }
  proximos90: { ingresos: number; egresos: number; neto: number }
}

function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

export default function CashflowPage() {
  const [flujo, setFlujo] = useState<FlujoCajaSemana[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerando, setRegenerando] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [fRes, rRes] = await Promise.all([
        fetch("/api/cashflow?vista=semanal", { headers }),
        fetch("/api/cashflow?vista=resumen", { headers }),
      ])
      const [fData, rData] = await Promise.all([fRes.json(), rRes.json()])
      if (fData.success) setFlujo(fData.data)
      if (rData.success) setResumen(rData.data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: fetchData,
  }))

  const regenerar = async () => {
    setRegenerando(true)
    try {
      await fetch("/api/cashflow", { method: "POST", headers, body: JSON.stringify({ diasHorizonte: 90 }) })
      await fetchData()
    } catch {}
    finally { setRegenerando(false) }
  }

  const flujoFiltrado = useMemo(() => {
    if (!dateRange?.from) return flujo
    return flujo.filter((f) => {
      const d = new Date(f.semana)
      if (dateRange.from && d < dateRange.from) return false
      if (dateRange.to && d > dateRange.to) return false
      return true
    })
  }, [flujo, dateRange])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" />
            Flujo de Fondos Proyectado
          </h1>
          <p className="text-sm text-muted-foreground">Proyección de cash flow basado en CxC, CxP, cheques y gastos fijos</p>
        </div>
        <div className="flex gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="sm" onClick={regenerar} disabled={regenerando}>
            <RefreshCw className={`h-4 w-4 mr-1 ${regenerando ? "animate-spin" : ""}`} />
            Regenerar proyección
          </Button>
        </div>
      </div>

      {/* Resumen 30/60/90 */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResumenCard titulo="Próximos 30 días" data={resumen.proximos30} />
          <ResumenCard titulo="Próximos 60 días" data={resumen.proximos60} />
          <ResumenCard titulo="Próximos 90 días" data={resumen.proximos90} />
        </div>
      )}

      {/* Tabla semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detalle por semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          {flujoFiltrado.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Sin proyecciones. Hacé clic en "Regenerar proyección" para generar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 px-3 font-medium">Semana</th>
                    <th className="py-2 px-3 font-medium text-right">Ingresos</th>
                    <th className="py-2 px-3 font-medium text-right">Egresos</th>
                    <th className="py-2 px-3 font-medium text-right">Neto</th>
                    <th className="py-2 px-3 font-medium text-right">Acumulado</th>
                    <th className="py-2 px-3 font-medium">Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {flujoFiltrado.map((f) => {
                    const maxVal = Math.max(...flujoFiltrado.map(x => Math.max(x.ingresos, x.egresos)), 1)
                    const barIngreso = (f.ingresos / maxVal) * 100
                    const barEgreso = (f.egresos / maxVal) * 100

                    return (
                      <tr key={f.semana} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2.5 px-3 font-medium">
                          {new Date(f.semana).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                        </td>
                        <td className="py-2.5 px-3 text-right text-green-600">{formatARS(f.ingresos)}</td>
                        <td className="py-2.5 px-3 text-right text-red-500">{formatARS(f.egresos)}</td>
                        <td className={`py-2.5 px-3 text-right font-medium ${f.neto >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {formatARS(f.neto)}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${f.acumulado >= 0 ? "text-green-700" : "text-red-600"}`}>
                          {formatARS(f.acumulado)}
                        </td>
                        <td className="py-2.5 px-3 w-32">
                          <div className="flex gap-0.5 items-end h-6">
                            <div className="bg-green-500/60 rounded-t" style={{ width: "45%", height: `${Math.max(barIngreso, 4)}%` }} />
                            <div className="bg-red-500/60 rounded-t" style={{ width: "45%", height: `${Math.max(barEgreso, 4)}%` }} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ResumenCard({ titulo, data }: { titulo: string; data: { ingresos: number; egresos: number; neto: number } }) {
  return (
    <Card className={`border-l-4 ${data.neto >= 0 ? "border-l-green-500" : "border-l-red-500"}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-green-600"><ArrowUpRight className="h-3.5 w-3.5" /> Ingresos</span>
          <span className="font-medium">{formatARS(data.ingresos)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-red-500"><ArrowDownRight className="h-3.5 w-3.5" /> Egresos</span>
          <span className="font-medium">{formatARS(data.egresos)}</span>
        </div>
        <div className="border-t pt-2 flex items-center justify-between">
          <span className="font-medium">Neto</span>
          <span className={`text-lg font-bold ${data.neto >= 0 ? "text-green-600" : "text-red-500"}`}>
            {formatARS(data.neto)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
