"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Store, Star, CheckCircle, XCircle } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { EmptyStateIllustration } from "@/components/empty-state-illustration"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface PuntoVenta {
  id: number
  numero: number
  nombre: string
  descripcion?: string
  tipo: string
  activo: boolean
  esDefault: boolean
  empresaId: number
  empresa?: { id: number; razonSocial: string; cuit: string }
  series?: { id: number; codigo: string; tipoCbteAfip: number; nombreComprobante: string; ultimoNumero: number }[]
}

const TIPOS_PV = [
  { value: "electronico",     label: "Electrónico (WSFE)" },
  { value: "manual",          label: "Manual (talonario)" },
  { value: "web",             label: "Web / E-commerce" },
  { value: "factura_credito", label: "Factura de Crédito Electrónica (FCE)" },
]

export default function PuntosVentaPage() {
  const [items, setItems] = useState<PuntoVenta[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<PuntoVenta | null>(null)
  const [form, setForm] = useState({
    numero: "",
    nombre: "",
    descripcion: "",
    tipo: "electronico",
    esDefault: false,
    empresaId: "1",
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/puntos-venta?activo=false")
      if (res.ok) setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: cargar,
    onNew: () => { setEditando(null); setForm({ numero: "", nombre: "", descripcion: "", tipo: "electronico", esDefault: false, empresaId: "1" }); setDialogOpen(true) },
  }))

  function abrirNuevo() {
    setEditando(null)
    setForm({ numero: "", nombre: "", descripcion: "", tipo: "electronico", esDefault: false, empresaId: "1" })
    setDialogOpen(true)
  }

  function abrirEditar(pv: PuntoVenta) {
    setEditando(pv)
    setForm({
      numero: String(pv.numero),
      nombre: pv.nombre,
      descripcion: pv.descripcion ?? "",
      tipo: pv.tipo,
      esDefault: pv.esDefault,
      empresaId: String(pv.empresaId),
    })
    setDialogOpen(true)
  }

  async function guardar() {
    const payload = {
      numero: Number(form.numero),
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
      tipo: form.tipo,
      esDefault: form.esDefault,
      empresaId: Number(form.empresaId),
    }

    const url    = editando ? `/api/puntos-venta/${editando.id}` : "/api/puntos-venta"
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

  async function toggleActivo(pv: PuntoVenta) {
    await fetch(`/api/puntos-venta/${pv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !pv.activo }),
    })
    cargar()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Puntos de Venta</h1>
          <p className="text-muted-foreground text-sm">
            Maestro de puntos de venta habilitados ante AFIP (números 1–9999)
          </p>
        </div>
        <Button onClick={abrirNuevo}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo Punto de Venta
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm text-muted-foreground">Activos</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-green-600">{items.filter((i) => i.activo).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm text-muted-foreground">Electrónicos</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-blue-600">{items.filter((i) => i.tipo === "electronico").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm text-muted-foreground">Series activas</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-violet-600">{items.reduce((s, p) => s + (p.series?.length ?? 0), 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="pt-4">
          <DataTable<PuntoVenta>
            data={items}
            columns={[
              { key: "numero", header: "Nº PV", sortable: true, cell: (pv) => <span className="font-mono font-bold text-lg">{String(pv.numero).padStart(4, "0")}</span> },
              { key: "nombre", header: "Nombre", cell: (pv) => <div className="flex items-center gap-2"><Store className="h-4 w-4 text-muted-foreground shrink-0" /><div><p className="font-medium">{pv.nombre}</p>{pv.descripcion && <p className="text-xs text-muted-foreground">{pv.descripcion}</p>}</div></div> },
              { key: "tipo", header: "Tipo", cell: (pv) => <Badge variant="secondary">{TIPOS_PV.find((t) => t.value === pv.tipo)?.label ?? pv.tipo}</Badge> },
              { key: "series" as any, header: "Series", cell: (pv) => <div className="flex flex-wrap gap-1">{pv.series?.map((s) => <Badge key={s.id} variant="outline" className="text-xs">{s.codigo}</Badge>)}{(!pv.series || pv.series.length === 0) && <span className="text-xs text-muted-foreground">Sin series</span>}</div> },
              { key: "esDefault", header: "Default", cell: (pv) => pv.esDefault ? <Star className="h-4 w-4 text-amber-500 mx-auto" /> : null },
              { key: "activo", header: "Activo", cell: (pv) => pv.activo ? <CheckCircle className="h-4 w-4 text-green-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-400 mx-auto" /> },
              { key: "acciones" as any, header: "", cell: (pv) => <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); abrirEditar(pv) }}><Pencil className="h-3.5 w-3.5" /></Button> },
            ] as DataTableColumn<PuntoVenta>[]}
            rowKey="id"
            searchPlaceholder="Buscar punto de venta..."
            searchKeys={["nombre", "tipo"]}
            exportFilename="puntos-venta"
            loading={loading}
            emptyMessage="No hay puntos de venta configurados"
            emptyIcon={<EmptyStateIllustration type="generico" compact title="Sin puntos de venta" description="Configurá tu primer punto de venta." />}
            compact
          />
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Punto de Venta" : "Nuevo Punto de Venta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Número AFIP *</Label>
                <Input
                  type="number"
                  min={1}
                  max={9999}
                  placeholder="1"
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  disabled={!!editando}
                />
                <p className="text-xs text-muted-foreground">1–9999, habilitado ante AFIP</p>
              </div>
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Casa Central"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input
                placeholder="Sucursal principal, dirección, etc."
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Punto de Venta</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PV.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 rounded-md border px-3 py-2.5">
              <Switch
                checked={form.esDefault}
                onCheckedChange={(v) => setForm({ ...form, esDefault: v })}
              />
              <div>
                <Label className="cursor-pointer">Punto de venta por defecto</Label>
                <p className="text-xs text-muted-foreground">Se usará al emitir comprobantes sin especificar PV</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={!form.numero || !form.nombre}>
              {editando ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
