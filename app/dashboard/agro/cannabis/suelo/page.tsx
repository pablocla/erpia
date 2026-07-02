"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { Plus, Layers } from "lucide-react"

interface Analisis {
  id: number
  fecha: string
  tipoMuestra: string
  ph: number | null
  ec: number | null
  nitrogeno: number | null
  fosforo: number | null
  potasio: number | null
  humedad: number | null
  costoAnalisis: number | null
  laboratorio: string | null
  sala: { nombre: string } | null
  ciclo: { numero: string; genetica: { nombre: string } } | null
}

interface Sala { id: number; nombre: string }
interface Ciclo { id: number; numero: string; sala: { nombre: string } }

const FMT_FECHA = (d: string) =>
  new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })

const TIPO_LABEL: Record<string, string> = {
  SUSTRATO: "Sustrato / tierra",
  AGUA: "Agua de riego",
  RUNOFF: "Drenaje (runoff)",
}

export default function CannabisSueloPage() {
  const { toast } = useToast()
  const { data: analisis, isLoading, mutate } = useAuthFetch<Analisis[]>("/api/agro/cannabis/suelo")
  const { data: salas } = useAuthFetch<Sala[]>("/api/agro/cannabis/salas")
  const { data: ciclos } = useAuthFetch<Ciclo[]>("/api/agro/cannabis/ciclos?activos=true")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    tipoMuestra: "SUSTRATO",
    salaId: "",
    cicloId: "",
    ph: "",
    ec: "",
    nitrogeno: "",
    fosforo: "",
    potasio: "",
    humedad: "",
    costoAnalisis: "",
    laboratorio: "",
    notas: "",
  })

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authFetch("/api/agro/cannabis/suelo", {
        method: "POST",
        body: JSON.stringify({
          tipoMuestra: form.tipoMuestra,
          salaId: form.salaId ? Number(form.salaId) : undefined,
          cicloId: form.cicloId ? Number(form.cicloId) : undefined,
          ph: form.ph ? Number(form.ph) : undefined,
          ec: form.ec ? Number(form.ec) : undefined,
          nitrogeno: form.nitrogeno ? Number(form.nitrogeno) : undefined,
          fosforo: form.fosforo ? Number(form.fosforo) : undefined,
          potasio: form.potasio ? Number(form.potasio) : undefined,
          humedad: form.humedad ? Number(form.humedad) : undefined,
          costoAnalisis: form.costoAnalisis ? Number(form.costoAnalisis) : undefined,
          laboratorio: form.laboratorio || undefined,
          notas: form.notas || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await mutate()
      setDialogOpen(false)
      toast({ title: "Análisis registrado" })
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Suelo, sustrato y agua"
        description="Análisis de pH, conductividad (EC), NPK y humedad para control de calidad del cultivo."
        actions={
          <Button onClick={() => setDialogOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Nuevo análisis
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Spinner /></div>
      ) : (analisis ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-4">
            <Layers className="h-12 w-12 opacity-20" />
            <p className="text-muted-foreground">Sin análisis registrados.</p>
            <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo análisis</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analisis?.map((a) => (
            <Card key={a.id}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{a.sala?.nombre ?? a.ciclo?.numero ?? "Muestra general"}</p>
                    <p className="text-xs text-muted-foreground">{FMT_FECHA(a.fecha)}</p>
                  </div>
                  <Badge variant="outline">{TIPO_LABEL[a.tipoMuestra] ?? a.tipoMuestra}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {a.ph != null && (
                    <div className="rounded-md bg-muted px-2 py-1 text-center">
                      <p className="text-xs text-muted-foreground">pH</p>
                      <p className="font-semibold">{a.ph}</p>
                    </div>
                  )}
                  {a.ec != null && (
                    <div className="rounded-md bg-muted px-2 py-1 text-center">
                      <p className="text-xs text-muted-foreground">EC</p>
                      <p className="font-semibold">{a.ec}</p>
                    </div>
                  )}
                  {a.humedad != null && (
                    <div className="rounded-md bg-muted px-2 py-1 text-center">
                      <p className="text-xs text-muted-foreground">Humedad</p>
                      <p className="font-semibold">{a.humedad}%</p>
                    </div>
                  )}
                </div>
                {(a.nitrogeno != null || a.fosforo != null || a.potasio != null) && (
                  <p className="text-xs text-muted-foreground">
                    NPK: {[a.nitrogeno, a.fosforo, a.potasio].filter((v) => v != null).join(" - ")}
                  </p>
                )}
                {a.laboratorio && (
                  <p className="text-xs text-muted-foreground">Lab: {a.laboratorio}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nuevo análisis</DialogTitle></DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-3">
            <div>
              <Label>Tipo de muestra</Label>
              <Select value={form.tipoMuestra} onValueChange={(v) => setForm((f) => ({ ...f, tipoMuestra: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUSTRATO">Sustrato / tierra</SelectItem>
                  <SelectItem value="AGUA">Agua de riego</SelectItem>
                  <SelectItem value="RUNOFF">Drenaje (runoff)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sala</Label>
                <Select value={form.salaId} onValueChange={(v) => setForm((f) => ({ ...f, salaId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {(salas ?? []).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ciclo</Label>
                <Select value={form.cicloId} onValueChange={(v) => setForm((f) => ({ ...f, cicloId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {(ciclos ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.numero}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>pH</Label>
                <Input type="number" step="0.1" value={form.ph} onChange={(e) => setForm((f) => ({ ...f, ph: e.target.value }))} />
              </div>
              <div>
                <Label>EC (mS/cm)</Label>
                <Input type="number" step="0.01" value={form.ec} onChange={(e) => setForm((f) => ({ ...f, ec: e.target.value }))} />
              </div>
              <div>
                <Label>Humedad (%)</Label>
                <Input type="number" step="0.1" value={form.humedad} onChange={(e) => setForm((f) => ({ ...f, humedad: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>N (ppm)</Label>
                <Input type="number" value={form.nitrogeno} onChange={(e) => setForm((f) => ({ ...f, nitrogeno: e.target.value }))} />
              </div>
              <div>
                <Label>P (ppm)</Label>
                <Input type="number" value={form.fosforo} onChange={(e) => setForm((f) => ({ ...f, fosforo: e.target.value }))} />
              </div>
              <div>
                <Label>K (ppm)</Label>
                <Input type="number" value={form.potasio} onChange={(e) => setForm((f) => ({ ...f, potasio: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Laboratorio</Label>
                <Input value={form.laboratorio} onChange={(e) => setForm((f) => ({ ...f, laboratorio: e.target.value }))} />
              </div>
              <div>
                <Label>Costo análisis (ARS)</Label>
                <Input type="number" min="0" value={form.costoAnalisis} onChange={(e) => setForm((f) => ({ ...f, costoAnalisis: e.target.value }))} />
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