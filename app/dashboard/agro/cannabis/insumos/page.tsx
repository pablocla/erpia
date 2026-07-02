"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import { PageShell, PageHeader } from "@/components/layout"
import { Plus, FlaskConical, AlertTriangle } from "lucide-react"
import { CATEGORIAS_INSUMO } from "@/lib/agro/cannabis-service"

interface Insumo {
  id: number
  codigo: string
  nombre: string
  categoria: string
  unidad: string
  stockActual: number
  stockMinimo: number
  costoUnitario: number
  composicion: string | null
  proveedor: { nombre: string } | null
}

const CATEGORIA_LABEL: Record<string, string> = {
  FERTILIZANTE: "Fertilizante",
  QUIMICO: "Químico",
  SUSTRATO: "Sustrato / tierra",
  SEMILLA: "Semilla",
  NUTRIENTE: "Nutriente",
  OTRO: "Otro",
}

const ARS = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(v)

export default function CannabisInsumosPage() {
  const { toast } = useToast()
  const { data: insumos, isLoading, mutate } = useAuthFetch<Insumo[]>("/api/agro/cannabis/insumos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState("TODOS")
  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    categoria: "FERTILIZANTE",
    unidad: "L",
    stockActual: "",
    stockMinimo: "",
    costoUnitario: "",
    composicion: "",
  })

  const filtrados = (insumos ?? []).filter((i) => filtro === "TODOS" || i.categoria === filtro)

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authFetch("/api/agro/cannabis/insumos", {
        method: "POST",
        body: JSON.stringify({
          codigo: form.codigo,
          nombre: form.nombre,
          categoria: form.categoria,
          unidad: form.unidad,
          stockActual: form.stockActual ? Number(form.stockActual) : 0,
          stockMinimo: form.stockMinimo ? Number(form.stockMinimo) : 0,
          costoUnitario: form.costoUnitario ? Number(form.costoUnitario) : 0,
          composicion: form.composicion || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await mutate()
      setDialogOpen(false)
      setForm({ codigo: "", nombre: "", categoria: "FERTILIZANTE", unidad: "L", stockActual: "", stockMinimo: "", costoUnitario: "", composicion: "" })
      toast({ title: "Insumo registrado" })
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Insumos y stock"
        description="Catálogo de fertilizantes, químicos, sustrato y nutrientes con control de stock y costos."
        actions={
          <Button onClick={() => setDialogOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Nuevo insumo
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button variant={filtro === "TODOS" ? "default" : "outline"} size="sm" onClick={() => setFiltro("TODOS")}>Todos</Button>
        {CATEGORIAS_INSUMO.map((c) => (
          <Button key={c} variant={filtro === c ? "default" : "outline"} size="sm" onClick={() => setFiltro(c)}>
            {CATEGORIA_LABEL[c]}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Spinner /></div>
      ) : filtrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-4">
            <FlaskConical className="h-12 w-12 opacity-20" />
            <p className="text-muted-foreground">Sin insumos registrados.</p>
            <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo insumo</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((i) => {
            const bajoMinimo = i.stockMinimo > 0 && i.stockActual <= i.stockMinimo
            return (
              <Card key={i.id} className={bajoMinimo ? "border-amber-300" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{i.nombre}</CardTitle>
                      <p className="text-xs font-mono text-muted-foreground">{i.codigo}</p>
                    </div>
                    <Badge variant="outline">{CATEGORIA_LABEL[i.categoria] ?? i.categoria}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock</span>
                    <span className={`font-semibold ${bajoMinimo ? "text-amber-600" : ""}`}>
                      {i.stockActual} {i.unidad}
                      {bajoMinimo && <AlertTriangle className="inline h-3.5 w-3.5 ml-1" />}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Costo unitario</span>
                    <span>{ARS(i.costoUnitario)}</span>
                  </div>
                  {i.composicion && (
                    <p className="text-xs text-muted-foreground">Composición: {i.composicion}</p>
                  )}
                  {i.proveedor && (
                    <p className="text-xs text-muted-foreground">Proveedor: {i.proveedor.nombre}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo insumo</DialogTitle></DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Código *</Label>
                <Input className="font-mono" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} placeholder="FERT-001" />
              </div>
              <div>
                <Label>Categoría *</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_INSUMO.map((c) => (
                      <SelectItem key={c} value={c}>{CATEGORIA_LABEL[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Unidad</Label>
                <Select value={form.unidad} onValueChange={(v) => setForm((f) => ({ ...f, unidad: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Litros</SelectItem>
                    <SelectItem value="kg">Kilogramos</SelectItem>
                    <SelectItem value="g">Gramos</SelectItem>
                    <SelectItem value="unidad">Unidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stock inicial</Label>
                <Input type="number" min="0" step="0.01" value={form.stockActual} onChange={(e) => setForm((f) => ({ ...f, stockActual: e.target.value }))} />
              </div>
              <div>
                <Label>Stock mínimo</Label>
                <Input type="number" min="0" step="0.01" value={form.stockMinimo} onChange={(e) => setForm((f) => ({ ...f, stockMinimo: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Costo unitario (ARS)</Label>
              <Input type="number" min="0" step="0.01" value={form.costoUnitario} onChange={(e) => setForm((f) => ({ ...f, costoUnitario: e.target.value }))} />
            </div>
            <div>
              <Label>Composición (NPK, activos, etc.)</Label>
              <Input value={form.composicion} onChange={(e) => setForm((f) => ({ ...f, composicion: e.target.value }))} placeholder="N-P-K 10-5-20" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}