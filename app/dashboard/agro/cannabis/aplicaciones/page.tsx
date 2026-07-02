"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import { PageShell, PageHeader } from "@/components/layout"
import { Plus, Beaker } from "lucide-react"

interface Aplicacion {
  id: number
  fecha: string
  cantidad: number
  unidad: string
  dosis: string | null
  costoTotal: number
  metodo: string | null
  operador: string | null
  insumo: { nombre: string; categoria: string }
  ciclo: { numero: string; sala: { nombre: string }; genetica: { nombre: string } }
}

interface Ciclo { id: number; numero: string; etapa: string; sala: { nombre: string } }
interface Insumo { id: number; nombre: string; unidad: string; stockActual: number }

const ARS = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)

const FMT_FECHA = (d: string) =>
  new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

export default function CannabisAplicacionesPage() {
  const { toast } = useToast()
  const { data: aplicaciones, isLoading, mutate } = useAuthFetch<Aplicacion[]>("/api/agro/cannabis/aplicaciones")
  const { data: ciclos } = useAuthFetch<Ciclo[]>("/api/agro/cannabis/ciclos?activos=true")
  const { data: insumos } = useAuthFetch<Insumo[]>("/api/agro/cannabis/insumos")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    cicloId: "",
    insumoId: "",
    cantidad: "",
    dosis: "",
    metodo: "RIEGO",
    operador: "",
    observaciones: "",
  })

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authFetch("/api/agro/cannabis/aplicaciones", {
        method: "POST",
        body: JSON.stringify({
          cicloId: Number(form.cicloId),
          insumoId: Number(form.insumoId),
          cantidad: Number(form.cantidad),
          dosis: form.dosis || undefined,
          metodo: form.metodo,
          operador: form.operador || undefined,
          observaciones: form.observaciones || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await mutate()
      setDialogOpen(false)
      setForm({ cicloId: "", insumoId: "", cantidad: "", dosis: "", metodo: "RIEGO", operador: "", observaciones: "" })
      toast({ title: "Aplicación registrada — stock y costo actualizados" })
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const insumoSel = (insumos ?? []).find((i) => String(i.id) === form.insumoId)

  return (
    <PageShell>
      <PageHeader
        title="Aplicaciones de insumos"
        description="Registro de fertilizantes, químicos y nutrientes aplicados por ciclo con trazabilidad y costo."
        actions={
          <Button onClick={() => setDialogOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Nueva aplicación
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Spinner /></div>
      ) : (aplicaciones ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-4">
            <Beaker className="h-12 w-12 opacity-20" />
            <p className="text-muted-foreground">Sin aplicaciones registradas.</p>
            <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nueva aplicación</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">Fecha</th>
                <th className="text-left p-3 font-medium">Ciclo / Sala</th>
                <th className="text-left p-3 font-medium">Insumo</th>
                <th className="text-left p-3 font-medium">Cantidad</th>
                <th className="text-left p-3 font-medium">Método</th>
                <th className="text-right p-3 font-medium">Costo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {aplicaciones?.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="p-3 text-muted-foreground">{FMT_FECHA(a.fecha)}</td>
                  <td className="p-3">
                    <p className="font-medium font-mono text-xs">{a.ciclo.numero}</p>
                    <p className="text-xs text-muted-foreground">{a.ciclo.sala.nombre}</p>
                  </td>
                  <td className="p-3">{a.insumo.nombre}</td>
                  <td className="p-3">
                    {a.cantidad} {a.unidad}
                    {a.dosis && <span className="text-xs text-muted-foreground ml-1">({a.dosis})</span>}
                  </td>
                  <td className="p-3 text-muted-foreground">{a.metodo ?? "—"}</td>
                  <td className="p-3 text-right font-medium">{ARS(a.costoTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar aplicación</DialogTitle></DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-3">
            <div>
              <Label>Ciclo activo *</Label>
              <Select value={form.cicloId} onValueChange={(v) => setForm((f) => ({ ...f, cicloId: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar ciclo..." /></SelectTrigger>
                <SelectContent>
                  {(ciclos ?? []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.numero} — {c.sala.nombre} ({c.etapa})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Insumo *</Label>
              <Select value={form.insumoId} onValueChange={(v) => setForm((f) => ({ ...f, insumoId: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar insumo..." /></SelectTrigger>
                <SelectContent>
                  {(insumos ?? []).map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.nombre} (stock: {i.stockActual} {i.unidad})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cantidad *</Label>
                <Input type="number" min="0.01" step="0.01" value={form.cantidad} onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))} />
                {insumoSel && <p className="text-xs text-muted-foreground mt-1">Unidad: {insumoSel.unidad}</p>}
              </div>
              <div>
                <Label>Dosis</Label>
                <Input value={form.dosis} onChange={(e) => setForm((f) => ({ ...f, dosis: e.target.value }))} placeholder="2 ml/L" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Método</Label>
                <Select value={form.metodo} onValueChange={(v) => setForm((f) => ({ ...f, metodo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RIEGO">Riego / fertirriego</SelectItem>
                    <SelectItem value="FOLIAR">Foliar</SelectItem>
                    <SelectItem value="SUSTRATO">Mezcla en sustrato</SelectItem>
                    <SelectItem value="PULVERIZACION">Pulverización</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Operador</Label>
                <Input value={form.operador} onChange={(e) => setForm((f) => ({ ...f, operador: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Registrar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}