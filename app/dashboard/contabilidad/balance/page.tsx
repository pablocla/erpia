"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, Loader2, Sparkles } from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { DateRangePicker } from "@/components/date-range-picker"
import { type DateRange } from "react-day-picker"
import { PageShell, PageHeader } from "@/components/layout"

interface LineaBalance {
  cuenta: string
  debe: number
  haber: number
  saldo: number
}

export default function BalancePage() {
  const [lineas, setLineas] = useState<LineaBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange?.from) params.set("desde", dateRange.from.toISOString().slice(0, 10))
      if (dateRange?.to) params.set("hasta", dateRange.to.toISOString().slice(0, 10))
      const res = await fetch(`/api/contabilidad/balance-sumas?${params}`)
      const data = await res.json()
      if (data.success) setLineas(data.balance ?? [])
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [dateRange])

  useEffect(() => { cargar() }, [cargar])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: cargar,
  }))

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

  const renderSeccion = (titulo: string, items: LineaBalance[], total: number, colorClass: string, labelColorClass: string) => (
    <Card className="backdrop-blur-sm bg-card/60 border-muted/40 hover:shadow-sm transition-shadow">
      <CardHeader className="pb-3"><CardTitle className={`text-base font-semibold ${labelColorClass}`}>{titulo}</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 && <p className="text-xs text-muted-foreground py-2">Sin movimientos</p>}
        {items.map(l => (
          <div key={l.cuenta} className="flex justify-between text-sm border-b pb-1.5 pt-1 border-muted/20 last:border-0">
            <span className="text-muted-foreground font-medium">{l.cuenta}</span>
            <span className="font-semibold text-foreground font-mono text-xs tabular-nums">{fmt(l.saldo)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-sm pt-3 mt-2 border-t-2 border-muted/40">
          <span className="text-foreground">TOTAL {titulo.toUpperCase()}</span>
          <span className={colorClass}>{fmt(total)}</span>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <PageShell>
      <PageHeader
        title="Balance General"
        description="Estado de situación patrimonial, sumas y saldos clasificados de las cuentas contables."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5 text-primary/80" />
            Reporte Financiero
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Button variant="outline" size="sm" className="gap-2" onClick={exportarCSV}>
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="backdrop-blur-sm bg-card/60 hover:shadow-sm transition-shadow">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Activo</p>
                <p className="text-2xl font-bold mt-1 text-[var(--status-info-foreground)]">{fmt(totalActivo)}</p>
              </CardContent>
            </Card>
            <Card className="backdrop-blur-sm bg-card/60 hover:shadow-sm transition-shadow">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Pasivo</p>
                <p className="text-2xl font-bold mt-1 text-[var(--status-error-foreground)]">{fmt(totalPasivo)}</p>
              </CardContent>
            </Card>
            <Card className="backdrop-blur-sm bg-card/60 hover:shadow-sm transition-shadow">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Patrimonio Neto</p>
                <p className="text-2xl font-bold mt-1 text-[var(--status-success-foreground)]">{fmt(totalActivo - totalPasivo)}</p>
              </CardContent>
            </Card>
            <Card className="backdrop-blur-sm bg-card/60 hover:shadow-sm transition-shadow">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Resultado Neto</p>
                <p className={`text-2xl font-bold mt-1 ${resultadoNeto >= 0 ? "text-[var(--status-success-foreground)]" : "text-[var(--status-error-foreground)]"}`}>
                  {resultadoNeto >= 0 ? "+" : "-"}{fmt(resultadoNeto)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {renderSeccion("Activo", activo, totalActivo, "text-[var(--status-info-foreground)]", "text-[var(--status-info-foreground)]")}
              {renderSeccion("Ingresos", ingresos, totalIngresos, "text-[var(--status-success-foreground)]", "text-[var(--status-success-foreground)]")}
            </div>
            <div className="space-y-6">
              {renderSeccion("Pasivo", pasivo, totalPasivo, "text-[var(--status-error-foreground)]", "text-[var(--status-error-foreground)]")}
              {renderSeccion("Patrimonio", patrimonioLines, totalPatrimonio, "text-[var(--status-success-foreground)]", "text-[var(--status-success-foreground)]")}
              {renderSeccion("Egresos", egresos, totalEgresos, "text-[var(--status-warning-foreground)]", "text-[var(--status-warning-foreground)]")}
            </div>
          </div>
        </>
      )}
    </PageShell>
  )
}
