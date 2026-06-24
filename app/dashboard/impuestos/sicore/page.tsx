"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/data-table"
import { useToast } from "@/hooks/use-toast"
import { authFetch } from "@/lib/stores"
import { Download, FileText, RefreshCw, Shield } from "lucide-react"

interface RetencionSicore {
  id: number
  tipo: string
  codigoSicore: string
  base: number
  alicuota: number
  monto: number
  estado: string
  fechaRetencion: string
  proveedor?: { nombre: string; cuit?: string | null }
}

export default function SicorePage() {
  const { toast } = useToast()
  const [mes, setMes] = useState(new Date().getMonth() + 1)
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [retenciones, setRetenciones] = useState<RetencionSicore[]>([])
  const [totales, setTotales] = useState<{ iva: number; ganancias: number; total: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/impuestos/sicore?mes=${mes}&anio=${anio}`)
      if (res.ok) {
        const data = await res.json()
        setRetenciones(data.retenciones ?? [])
        setTotales(data.totales ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [mes, anio])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function exportarSiap() {
    const res = await authFetch(`/api/impuestos/sicore?mes=${mes}&anio=${anio}&formato=siap`)
    if (!res.ok) {
      toast({ title: "Error al exportar", variant: "destructive" })
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sicore_${anio}_${String(mes).padStart(2, "0")}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Archivo SICORE descargado" })
  }

  const fmt = (n: number) => `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SICORE — Retenciones AFIP</h1>
            <p className="text-sm text-muted-foreground">
              IVA y Ganancias · exportación SIAP para presentación
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void cargar()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button size="sm" className="gap-2" onClick={() => void exportarSiap()}>
            <Download className="h-4 w-4" />
            Exportar SIAP
          </Button>
        </div>
      </div>

      <Card className="dashboard-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Período</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div className="w-40">
            <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {new Date(2024, m - 1).toLocaleString("es-AR", { month: "long" })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-28">
            <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((a) => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {totales && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Retenciones IVA</p>
              <p className="text-xl font-bold">{fmt(totales.iva)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Retenciones Ganancias</p>
              <p className="text-xl font-bold">{fmt(totales.ganancias)}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200/60">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Total período</p>
              <p className="text-xl font-bold text-red-700">{fmt(totales.total)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable<RetencionSicore>
        data={retenciones}
        rowKey="id"
        loading={loading}
        emptyIcon={<FileText className="h-10 w-10 text-muted-foreground/40" />}
        emptyMessage="Sin retenciones SICORE. Se registran al pagar proveedores si la empresa es agente de retención."
        columns={[
          {
            key: "fechaRetencion",
            header: "Fecha",
            cell: (r) => new Date(r.fechaRetencion).toLocaleDateString("es-AR"),
          },
          {
            key: "proveedor",
            header: "Proveedor",
            cell: (r) => r.proveedor?.nombre ?? "—",
          },
          {
            key: "codigoSicore",
            header: "Código",
            cell: (r) => <span className="font-mono text-xs">{r.codigoSicore}</span>,
          },
          {
            key: "tipo",
            header: "Tipo",
            cell: (r) => <Badge variant="outline" className="text-[10px] uppercase">{r.tipo}</Badge>,
          },
          {
            key: "base",
            header: "Base",
            cell: (r) => fmt(Number(r.base)),
          },
          {
            key: "monto",
            header: "Retenido",
            cell: (r) => <span className="font-medium">{fmt(Number(r.monto))}</span>,
          },
          {
            key: "estado",
            header: "Estado",
            cell: (r) => (
              <Badge variant={r.estado === "acreditada" ? "default" : "secondary"} className="text-[10px]">
                {r.estado}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  )
}