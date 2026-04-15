"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Hash, CheckCircle, XCircle } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import type { TipoComprobanteAfip } from "@/lib/afip/tipos-comprobante"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface PuntoVenta {
  id: number
  numero: number
  nombre: string
}

interface Serie {
  id: number
  codigo: string
  descripcion?: string
  tipoCbteAfip: number
  letraComprobante: string
  nombreComprobante: string
  ultimoNumero: number
  activo: boolean
  puntoVentaId: number
  puntoVenta?: PuntoVenta
}

const LETRA_COLORS: Record<string, string> = {
  A: "bg-blue-100 text-blue-800",
  B: "bg-green-100 text-green-800",
  C: "bg-orange-100 text-orange-800",
  E: "bg-violet-100 text-violet-800",
  M: "bg-pink-100 text-pink-800",
  R: "bg-yellow-100 text-yellow-800",
  "": "bg-slate-100 text-slate-800",
}

export default function SeriesPage() {
  const [series, setSeries] = useState<Serie[]>([])
  const [puntosVenta, setPuntosVenta] = useState<PuntoVenta[]>([])
  const [tiposCbte, setTiposCbte] = useState<TipoComprobanteAfip[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Serie | null>(null)
  const [form, setForm] = useState({
    codigo: "",
    descripcion: "",
    tipoCbteAfip: "",
    puntoVentaId: "",
  })
  const [filtroPV, setFiltroPV] = useState("todos")

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [resSeries, resPV, resTipos] = await Promise.all([
        fetch("/api/series?activo=false"),
        fetch("/api/puntos-venta"),
        fetch("/api/afip/tipos-comprobante"),
      ])
      if (resSeries.ok) setSeries(await resSeries.json())
      if (resPV.ok) setPuntosVenta(await resPV.json())
      if (resTipos.ok) {
        const data = await resTipos.json()
        setTiposCbte(data.tipos ?? data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const seriesFiltradas = filtroPV === "todos" ? series : series.filter((s) => String(s.puntoVentaId) === filtroPV)

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: cargar,
    onNew: () => { setEditando(null); setForm({ codigo: "", descripcion: "", tipoCbteAfip: "", puntoVentaId: String(puntosVenta[0]?.id ?? "") }); setDialogOpen(true) },
  }))

  function abrirNuevo() {
    setEditando(null)
    setForm({ codigo: "", descripcion: "", tipoCbteAfip: "", puntoVentaId: String(puntosVenta[0]?.id ?? "") })
    setDialogOpen(true)
  }

  function abrirEditar(s: Serie) {
    setEditando(s)
    setForm({
      codigo: s.codigo,
      descripcion: s.descripcion ?? "",
      tipoCbteAfip: String(s.tipoCbteAfip),
      puntoVentaId: String(s.puntoVentaId),
    })
    setDialogOpen(true)
  }

  async function guardar() {
    const payload = {
      codigo: form.codigo,
      descripcion: form.descripcion || undefined,
      tipoCbteAfip: Number(form.tipoCbteAfip),
      puntoVentaId: Number(form.puntoVentaId),
    }

    const url    = editando ? `/api/series/${editando.id}` : "/api/series"
    const method = editando ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setDialogOpen(false)
      cargar()
    }
  }

  // Auto-generar código a partir del tipo y PV elegido
  useEffect(() => {
    if (editando || !form.tipoCbteAfip || !form.puntoVentaId) return
    const tipo = tiposCbte.find((t) => t.tipoCbte === Number(form.tipoCbteAfip))
    const pv = puntosVenta.find((p) => p.id === Number(form.puntoVentaId))
    if (tipo && pv) {
      const letra = tipo.letra || "X"
      const pvNum = String(pv.numero).padStart(4, "0")
      setForm((f) => ({ ...f, codigo: `${letra}${pvNum}` }))
    }
  }, [form.tipoCbteAfip, form.puntoVentaId, editando, tiposCbte, puntosVenta])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maestro de Series</h1>
          <p className="text-muted-foreground text-sm">
            Series de numeración por Punto de Venta y Tipo de Comprobante AFIP
          </p>
        </div>
        <Button onClick={abrirNuevo} disabled={puntosVenta.length === 0}>
          <Plus className="h-4 w-4 mr-1" /> Nueva Serie
        </Button>
      </div>

      {puntosVenta.length === 0 && !loading && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4 text-amber-700 dark:text-amber-400 text-sm">
            No hay puntos de venta configurados. Primero creá al menos uno en{" "}
            <a href="/dashboard/puntos-venta" className="underline font-medium">Puntos de Venta</a>.
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["A", "B", "C", "E"].map((letra) => {
          const count = series.filter((s) => s.letraComprobante === letra && s.activo).length
          return (
            <Card key={letra}>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm text-muted-foreground">Series tipo {letra}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 flex items-center gap-2">
                <Badge className={LETRA_COLORS[letra]}>{letra}</Badge>
                <span className="text-2xl font-bold">{count}</span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filtro por PV */}
      {puntosVenta.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar por PV:</span>
          <div className="flex gap-1 flex-wrap">
            <Button
              size="sm"
              variant={filtroPV === "todos" ? "default" : "outline"}
              onClick={() => setFiltroPV("todos")}
            >
              Todos
            </Button>
            {puntosVenta.map((pv) => (
              <Button
                key={pv.id}
                size="sm"
                variant={filtroPV === String(pv.id) ? "default" : "outline"}
                onClick={() => setFiltroPV(String(pv.id))}
              >
                PV {String(pv.numero).padStart(4, "0")} — {pv.nombre}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Tabla */}
      <Card>
        <CardContent className="pt-4">
          <DataTable<Serie>
            data={seriesFiltradas}
            columns={[
              { key: "codigo", header: "Código", sortable: true, cell: (s) => <div className="flex items-center gap-2"><Hash className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-mono font-semibold">{s.codigo}</span></div> },
              { key: "nombreComprobante", header: "Tipo Comprobante", cell: (s) => <div className="flex items-center gap-2"><Badge className={LETRA_COLORS[s.letraComprobante] ?? LETRA_COLORS[""]}>{s.letraComprobante || "—"}</Badge><div><p className="font-medium text-sm">{s.nombreComprobante}</p><p className="text-xs text-muted-foreground">tipoCbte: {s.tipoCbteAfip}</p></div></div> },
              { key: "puntoVenta" as any, header: "Punto de Venta", cell: (s) => s.puntoVenta ? <span className="text-sm">PV {String(s.puntoVenta.numero).padStart(4, "0")} — {s.puntoVenta.nombre}</span> : null, exportFn: (s) => s.puntoVenta ? `PV ${s.puntoVenta.numero}` : "" },
              { key: "ultimoNumero", header: "Último Nº", sortable: true, cell: (s) => <span className="font-mono">{s.ultimoNumero.toLocaleString("es-AR")}</span> },
              { key: "activo", header: "Estado", cell: (s) => s.activo ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-400 mx-auto" /> },
              { key: "acciones" as any, header: "", cell: (s) => <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); abrirEditar(s) }}><Pencil className="h-3.5 w-3.5" /></Button> },
            ] as DataTableColumn<Serie>[]}
            rowKey="id"
            searchPlaceholder="Buscar serie..."
            searchKeys={["codigo", "nombreComprobante"]}
            exportFilename="series-comprobantes"
            loading={loading}
            emptyMessage="No hay series configuradas"
            emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin series" description="Creá tu primera serie de comprobantes." />}
            compact
          />
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Serie" : "Nueva Serie"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Punto de Venta *</Label>
              <Select
                value={form.puntoVentaId}
                onValueChange={(v) => setForm({ ...form, puntoVentaId: v })}
                disabled={!!editando}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar PV" />
                </SelectTrigger>
                <SelectContent>
                  {puntosVenta.map((pv) => (
                    <SelectItem key={pv.id} value={String(pv.id)}>
                      PV {String(pv.numero).padStart(4, "0")} — {pv.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de Comprobante AFIP *</Label>
              <Select
                value={form.tipoCbteAfip}
                onValueChange={(v) => setForm({ ...form, tipoCbteAfip: v })}
                disabled={!!editando}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {tiposCbte.map((t) => (
                    <SelectItem key={t.tipoCbte} value={String(t.tipoCbte)}>
                      <span className="font-mono text-xs mr-2 text-muted-foreground">{String(t.tipoCbte).padStart(3, "0")}</span>
                      {t.letra && <span className="font-bold mr-1">[{t.letra}]</span>}
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Código de la tabla oficial AFIP WSFE. Por ej.: 1=Fac A, 6=Fac B, 11=Fac C, 3=NC A, 8=NC B, 201=FCE A
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Código de la serie *</Label>
                <Input
                  placeholder="FA-0001"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                  disabled={!!editando}
                />
                <p className="text-xs text-muted-foreground">Se auto-genera al elegir tipo y PV</p>
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Input
                  placeholder="Ventas locales, etc."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={!form.codigo || !form.tipoCbteAfip || !form.puntoVentaId}>
              {editando ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
