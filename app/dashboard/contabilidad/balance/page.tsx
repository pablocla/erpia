"use client"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, Loader2 } from "lucide-react"

interface LineaBalance {
  cuenta: string
  debe: number
  haber: number
  saldo: number
}

export default function BalancePage() {
  const [lineas, setLineas] = useState<LineaBalance[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/contabilidad/balance-sumas")
      const data = await res.json()
      if (data.success) setLineas(data.balance ?? [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Classify by account code prefix
  const activo = lineas.filter(l => l.cuenta.startsWith("1."))
  const pasivo = lineas.filter(l => l.cuenta.startsWith("2."))
  const patrimonioLines = lineas.filter(l => l.cuenta.startsWith("3."))
  const ingresos = lineas.filter(l => l.cuenta.startsWith("4."))
  const egresos = lineas.filter(l => l.cuenta.startsWith("5."))

  const totalActivo = activo.reduce((s, l) => s + l.saldo, 0)
  const totalPasivo = pasivo.reduce((s, l) => s + l.saldo, 0)
  const totalPatrimonio = patrimonioLines.reduce((s, l) => s + l.saldo, 0)
  const totalIngresos = ingresos.reduce((s, l) => s + l.saldo, 0)
  const totalEgresos = egresos.reduce((s, l) => s + Math.abs(l.saldo), 0)
  const resultadoNeto = totalIngresos - totalEgresos

  const fmt = (n: number) => `$${Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`

  const exportarCSV = async () => {
    try {
      const res = await fetch("/api/contabilidad/exportar-csv?tipo=balance")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `balance-general-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }

  const renderSeccion = (titulo: string, items: LineaBalance[], total: number, color: string) => (
    <Card className="dashboard-surface">
      <CardHeader className="pb-3"><CardTitle className={`text-base ${color}`}>{titulo}</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 && <p className="text-xs text-muted-foreground">Sin movimientos</p>}
        {items.map(l => (
          <div key={l.cuenta} className="flex justify-between text-sm border-b pb-1 last:border-0">
            <span className="text-muted-foreground">{l.cuenta}</span>
            <span className="font-medium tabular-nums">{fmt(l.saldo)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-sm pt-2 border-t-2">
          <span>TOTAL {titulo.toUpperCase()}</span>
          <span className={color}>{fmt(total)}</span>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-cyan-500" />
          <div><h1 className="text-2xl font-bold">Balance General</h1><p className="text-sm text-muted-foreground">Estado patrimonial — {lineas.length} cuentas con movimientos</p></div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={exportarCSV}><Download className="h-3.5 w-3.5" />Exportar CSV</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="dashboard-surface"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total Activo</p><p className="text-lg font-bold text-blue-600">{fmt(totalActivo)}</p></CardContent></Card>
        <Card className="dashboard-surface"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total Pasivo</p><p className="text-lg font-bold text-red-600">{fmt(totalPasivo)}</p></CardContent></Card>
        <Card className="dashboard-surface"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Patrimonio Neto</p><p className="text-lg font-bold text-green-600">{fmt(totalActivo - totalPasivo)}</p></CardContent></Card>
        <Card className="dashboard-surface"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Resultado Neto</p><p className={`text-lg font-bold ${resultadoNeto >= 0 ? "text-emerald-600" : "text-red-600"}`}>{resultadoNeto >= 0 ? "+" : "-"}{fmt(resultadoNeto)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          {renderSeccion("Activo", activo, totalActivo, "text-blue-600")}
          {renderSeccion("Ingresos", ingresos, totalIngresos, "text-emerald-600")}
        </div>
        <div className="space-y-4">
          {renderSeccion("Pasivo", pasivo, totalPasivo, "text-red-600")}
          {renderSeccion("Patrimonio", patrimonioLines, totalPatrimonio, "text-green-600")}
          {renderSeccion("Egresos", egresos, totalEgresos, "text-orange-600")}
        </div>
      </div>
    </div>
  )
}
