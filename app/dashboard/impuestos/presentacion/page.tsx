"use client"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Receipt, Download, CheckCircle2, Clock, Loader2, RefreshCw } from "lucide-react"

interface PeriodoIVA {
  periodo: string
  mes: number
  anio: number
  ivaVentas: number
  ivaCompras: number
  saldo: number
  cargado: boolean
}

export default function PresentacionAFIPPage() {
  const [periodos, setPeriodos] = useState<PeriodoIVA[]>([])
  const [loading, setLoading] = useState(true)
  const [descargando, setDescargando] = useState<string | null>(null)

  const cargarPeriodos = useCallback(async () => {
    setLoading(true)
    const ahora = new Date()
    const lista: PeriodoIVA[] = []

    // Load last 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
      const mes = d.getMonth() + 1
      const anio = d.getFullYear()
      const periodo = d.toLocaleString("es-AR", { month: "long", year: "numeric" })
      lista.push({ periodo, mes, anio, ivaVentas: 0, ivaCompras: 0, saldo: 0, cargado: false })
    }

    // Fetch each period from the IVA API
    const results = await Promise.allSettled(
      lista.map(async (p) => {
        const res = await fetch(`/api/impuestos/iva?mes=${p.mes}&anio=${p.anio}`)
        const data = await res.json()
        if (data.success && data.reporte) {
          return { ...p, ivaVentas: data.reporte.ivaVentas.total, ivaCompras: data.reporte.ivaCompras.total, saldo: data.reporte.saldo, cargado: true }
        }
        return { ...p, cargado: true }
      })
    )

    setPeriodos(results.map((r, i) => r.status === "fulfilled" ? r.value : { ...lista[i], cargado: true }))
    setLoading(false)
  }, [])

  useEffect(() => { cargarPeriodos() }, [cargarPeriodos])

  const descargar = async (tipo: "ventas" | "compras" | "presentacion", p: PeriodoIVA) => {
    setDescargando(`${tipo}-${p.mes}-${p.anio}`)
    try {
      let url: string
      let filename: string
      if (tipo === "presentacion") {
        url = `/api/impuestos/presentacion-afip?mes=${p.mes}&anio=${p.anio}`
        filename = `presentacion-iva-${p.mes}-${p.anio}.txt`
      } else {
        const endpoint = tipo === "ventas" ? "libro-iva-ventas" : "libro-iva-compras"
        url = `/api/impuestos/${endpoint}?mes=${p.mes}&anio=${p.anio}&formato=csv`
        filename = `libro-iva-${tipo}-${p.mes}-${p.anio}.csv`
      }
      const res = await fetch(url)
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(objUrl)
    } catch { /* ignore */ } finally { setDescargando(null) }
  }

  const fmt = (n: number) => `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
  const hayDatos = (p: PeriodoIVA) => p.ivaVentas > 0 || p.ivaCompras > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-6 w-6 text-red-500" />
          <div><h1 className="text-2xl font-bold">Presentación AFIP</h1><p className="text-sm text-muted-foreground">IVA mensual, DDJJ y exportaciones SIAP — últimos 6 períodos</p></div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={cargarPeriodos} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-4">
          {periodos.map(p => (
            <Card key={`${p.mes}-${p.anio}`} className="dashboard-surface">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold capitalize">{p.periodo}</h3>
                      <Badge variant={hayDatos(p) ? "default" : "secondary"} className="text-xs gap-1">
                        {hayDatos(p) ? <><CheckCircle2 className="h-3 w-3" />Con datos</> : <><Clock className="h-3 w-3" />Sin datos</>}
                      </Badge>
                    </div>
                  </div>
                  {hayDatos(p) ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => descargar("ventas", p)} disabled={descargando !== null}>
                        <Download className="h-3 w-3" />Libro Ventas
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => descargar("compras", p)} disabled={descargando !== null}>
                        <Download className="h-3 w-3" />Libro Compras
                      </Button>
                      <Button size="sm" className="gap-1 text-xs" onClick={() => descargar("presentacion", p)} disabled={descargando !== null}>
                        <Download className="h-3 w-3" />Presentación AFIP
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin comprobantes en el período</p>
                  )}
                </div>
                {hayDatos(p) && (
                  <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                    <div><p className="text-xs text-muted-foreground">IVA Débito (Ventas)</p><p className="font-bold text-red-600">{fmt(p.ivaVentas)}</p></div>
                    <div><p className="text-xs text-muted-foreground">IVA Crédito (Compras)</p><p className="font-bold text-green-600">{fmt(p.ivaCompras)}</p></div>
                    <div>
                      <p className="text-xs text-muted-foreground">Posición fiscal</p>
                      <p className={`font-bold ${p.saldo > 0 ? "text-red-600" : "text-emerald-600"}`}>{p.saldo > 0 ? "" : "+"}{fmt(Math.abs(p.saldo))}</p>
                      <p className="text-[10px] text-muted-foreground">{p.saldo > 0 ? "A pagar" : "A favor"}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
