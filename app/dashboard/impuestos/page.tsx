"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Download, FileSpreadsheet, Loader2, Calculator, TrendingUp, TrendingDown } from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface DetalleIVA {
  total: number
  base: number
  iva21: number
  iva105: number
  iva27: number
  totalPercepciones?: number
  totalRetenciones?: number
}

interface ReporteIVA {
  periodo: string
  ivaVentas: DetalleIVA
  ivaCompras: DetalleIVA
  saldo: number
}

export default function ImpuestosPage() {
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [reporte, setReporte] = useState<ReporteIVA | null>(null)
  const [loading, setLoading] = useState(false)

  const generarReporte = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/impuestos/iva?mes=${mes}&anio=${anio}`)
      const data = await res.json()
      if (data.success) setReporte(data.reporte)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: generarReporte,
  }))

  const descargarLibro = async (tipo: "ventas" | "compras") => {
    const endpoint = tipo === "ventas" ? "libro-iva-ventas" : "libro-iva-compras"
    const res = await fetch(`/api/impuestos/${endpoint}?mes=${mes}&anio=${anio}&formato=csv`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `libro-iva-${tipo}-${mes}-${anio}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const descargarPresentacion = async () => {
    const res = await fetch(`/api/impuestos/presentacion-afip?mes=${mes}&anio=${anio}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `presentacion-iva-${mes}-${anio}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const fmt = (n: number) => `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calculator className="h-6 w-6 text-red-500" />
        <div><h1 className="text-2xl font-bold">Impuestos — IVA</h1><p className="text-sm text-muted-foreground">Liquidación IVA mensual y libros fiscales</p></div>
      </div>

      <Card className="dashboard-surface">
        <CardHeader className="pb-3"><CardTitle className="text-base">Seleccionar Período</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Mes</p>
              <Select value={mes.toString()} onValueChange={v => setMes(Number(v))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <SelectItem key={m} value={m.toString()}>{new Date(2024, m - 1).toLocaleString("es-AR", { month: "long" })}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Año</p>
              <Select value={anio.toString()} onValueChange={v => setAnio(Number(v))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(a => <SelectItem key={a} value={a.toString()}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generarReporte} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              Liquidar IVA
            </Button>
          </div>
        </CardContent>
      </Card>

      {reporte && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="dashboard-surface border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-green-600" /><p className="text-xs text-muted-foreground">IVA Débito Fiscal (Ventas)</p></div>
                <p className="text-2xl font-bold text-green-600">{fmt(reporte.ivaVentas.total)}</p>
                <p className="text-xs text-muted-foreground mt-1">Base imponible: {fmt(reporte.ivaVentas.base)}</p>
              </CardContent>
            </Card>
            <Card className="dashboard-surface border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-blue-600" /><p className="text-xs text-muted-foreground">IVA Crédito Fiscal (Compras)</p></div>
                <p className="text-2xl font-bold text-blue-600">{fmt(reporte.ivaCompras.total)}</p>
                <p className="text-xs text-muted-foreground mt-1">Base imponible: {fmt(reporte.ivaCompras.base)}</p>
              </CardContent>
            </Card>
            <Card className={`dashboard-surface border-l-4 ${reporte.saldo > 0 ? "border-l-red-500" : "border-l-emerald-500"}`}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Posición Fiscal</p>
                <p className={`text-2xl font-bold ${reporte.saldo > 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(reporte.saldo)}</p>
                <Badge variant={reporte.saldo > 0 ? "destructive" : "default"} className="text-[10px] mt-1">
                  {reporte.saldo > 0 ? "A pagar a AFIP" : "Saldo a favor"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Detalle por alícuota */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="dashboard-surface">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-green-600">Detalle Débito Fiscal</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">IVA 21%</span><span className="font-medium tabular-nums">{fmt(reporte.ivaVentas.iva21)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA 10.5%</span><span className="font-medium tabular-nums">{fmt(reporte.ivaVentas.iva105)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA 27%</span><span className="font-medium tabular-nums">{fmt(reporte.ivaVentas.iva27)}</span></div>
                {(reporte.ivaVentas.totalPercepciones ?? 0) > 0 && (
                  <div className="flex justify-between border-t pt-1"><span className="text-muted-foreground">Percepciones</span><span className="font-medium tabular-nums">{fmt(reporte.ivaVentas.totalPercepciones!)}</span></div>
                )}
              </CardContent>
            </Card>
            <Card className="dashboard-surface">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-600">Detalle Crédito Fiscal</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">IVA 21%</span><span className="font-medium tabular-nums">{fmt(reporte.ivaCompras.iva21)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA 10.5%</span><span className="font-medium tabular-nums">{fmt(reporte.ivaCompras.iva105)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA 27%</span><span className="font-medium tabular-nums">{fmt(reporte.ivaCompras.iva27)}</span></div>
                {(reporte.ivaCompras.totalRetenciones ?? 0) > 0 && (
                  <div className="flex justify-between border-t pt-1"><span className="text-muted-foreground">Retenciones</span><span className="font-medium tabular-nums">{fmt(reporte.ivaCompras.totalRetenciones!)}</span></div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Download section */}
          <Card className="dashboard-surface">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Descargas</CardTitle></CardHeader>
            <CardContent className="flex gap-3">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => descargarLibro("ventas")}><FileSpreadsheet className="h-3.5 w-3.5" />Libro IVA Ventas</Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => descargarLibro("compras")}><FileSpreadsheet className="h-3.5 w-3.5" />Libro IVA Compras</Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={descargarPresentacion}><Download className="h-3.5 w-3.5" />Archivo presentación AFIP</Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
