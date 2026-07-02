"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { Plus, Sprout, ChevronRight } from "lucide-react"
import { ETAPAS_CICLO } from "@/lib/agro/cannabis-service"

interface Sala { id: number; nombre: string; tipo: string }
interface Genetica { id: number; nombre: string; tipo: string }
interface Ciclo {
  id: number
  numero: string
  etapa: string
  plantasIniciales: number
  plantasActuales: number
  costoAcumulado: number
  fechaInicio: string
  sala: { nombre: string; tipo: string }
  genetica: { nombre: string; tipo: string }
  _count: { aplicaciones: number; cosechas: number }
}

const ETAPA_LABEL: Record<string, string> = {
  GERMINACION: "Germinación",
  VEGETATIVO: "Vegetativo",
  FLORACION: "Floración",
  SECADO: "Secado",
  CURADO: "Curado",
  FINALIZADO: "Finalizado",
}

const ETAPA_VARIANT: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
  GERMINACION: "info",
  VEGETATIVO: "neutral",
  FLORACION: "warning",
  SECADO: "info",
  CURADO: "success",
  FINALIZADO: "success",
}

const ARS = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)

function siguienteEtapa(etapa: string): string | null {
  const idx = ETAPAS_CICLO.indexOf(etapa as typeof ETAPAS_CICLO[number])
  if (idx < 0 || idx >= ETAPAS_CICLO.length - 1) return null
  return ETAPAS_CICLO[idx + 1]
}

export default function CannabisCiclosPage() {
  const { toast } = useToast()
  const { data: ciclos, isLoading, mutate } = useAuthFetch<Ciclo[]>("/api/agro/cannabis/ciclos")
  const { data: salas, mutate: mutateSalas } = useAuthFetch<Sala[]>("/api/agro/cannabis/salas")
  const { data: geneticas, mutate: mutateGeneticas } = useAuthFetch<Genetica[]>("/api/agro/cannabis/geneticas")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [salaDialog, setSalaDialog] = useState(false)
  const [genDialog, setGenDialog] = useState(false)
  const [cosechaDialog, setCosechaDialog] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ salaId: "", geneticaId: "", plantasIniciales: "", observaciones: "" })
  const [salaForm, setSalaForm] = useState({ nombre: "", tipo: "INDOOR", superficieM2: "", capacidadPlantas: "" })
  const [genForm, setGenForm] = useState({ nombre: "", tipo: "CBD", thcMaxPct: "", cbdMaxPct: "" })
  const [cosechaForm, setCosechaForm] = useState({ plantasCosechadas: "", pesoSecoKg: "", pesoHumedoKg: "", loteTrazabilidad: "" })

  async function crearCiclo(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authFetch("/api/agro/cannabis/ciclos", {
        method: "POST",
        body: JSON.stringify({
          salaId: Number(form.salaId),
          geneticaId: Number(form.geneticaId),
          plantasIniciales: Number(form.plantasIniciales),
          observaciones: form.observaciones || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await mutate()
      setDialogOpen(false)
      setForm({ salaId: "", geneticaId: "", plantasIniciales: "", observaciones: "" })
      toast({ title: "Ciclo iniciado" })
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function crearSala(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authFetch("/api/agro/cannabis/salas", {
        method: "POST",
        body: JSON.stringify({
          nombre: salaForm.nombre,
          tipo: salaForm.tipo,
          superficieM2: salaForm.superficieM2 ? Number(salaForm.superficieM2) : undefined,
          capacidadPlantas: salaForm.capacidadPlantas ? Number(salaForm.capacidadPlantas) : undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await mutateSalas()
      setSalaDialog(false)
      toast({ title: "Sala creada" })
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function crearGenetica(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authFetch("/api/agro/cannabis/geneticas", {
        method: "POST",
        body: JSON.stringify({
          nombre: genForm.nombre,
          tipo: genForm.tipo,
          thcMaxPct: genForm.thcMaxPct ? Number(genForm.thcMaxPct) : undefined,
          cbdMaxPct: genForm.cbdMaxPct ? Number(genForm.cbdMaxPct) : undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await mutateGeneticas()
      setGenDialog(false)
      toast({ title: "Genética registrada" })
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function avanzarEtapa(ciclo: Ciclo) {
    const next = siguienteEtapa(ciclo.etapa)
    if (!next) return
    try {
      const res = await authFetch(`/api/agro/cannabis/ciclos/${ciclo.id}/etapa`, {
        method: "PATCH",
        body: JSON.stringify({ etapa: next }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await mutate()
      toast({ title: `Ciclo avanzado a ${ETAPA_LABEL[next]}` })
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" })
    }
  }

  async function registrarCosecha(e: React.FormEvent) {
    e.preventDefault()
    if (!cosechaDialog) return
    setSaving(true)
    try {
      const res = await authFetch("/api/agro/cannabis/cosechas", {
        method: "POST",
        body: JSON.stringify({
          cicloId: cosechaDialog,
          plantasCosechadas: Number(cosechaForm.plantasCosechadas),
          pesoSecoKg: cosechaForm.pesoSecoKg ? Number(cosechaForm.pesoSecoKg) : undefined,
          pesoHumedoKg: cosechaForm.pesoHumedoKg ? Number(cosechaForm.pesoHumedoKg) : undefined,
          loteTrazabilidad: cosechaForm.loteTrazabilidad || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await mutate()
      setCosechaDialog(null)
      setCosechaForm({ plantasCosechadas: "", pesoSecoKg: "", pesoHumedoKg: "", loteTrazabilidad: "" })
      toast({ title: "Cosecha registrada — ciclo finalizado" })
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Ciclos de cultivo"
        description="Seguimiento del proceso completo: germinación, vegetativo, floración, secado y cosecha."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSalaDialog(true)}>Nueva sala</Button>
            <Button variant="outline" size="sm" onClick={() => setGenDialog(true)}>Nueva genética</Button>
            <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" /> Nuevo ciclo
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Spinner /></div>
      ) : (ciclos ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center gap-4">
            <Sprout className="h-12 w-12 opacity-20" />
            <p className="text-muted-foreground">Sin ciclos. Cree una sala, una genética y luego inicie el primer ciclo.</p>
            <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo ciclo</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {ciclos?.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-mono">{c.numero}</CardTitle>
                    <p className="text-sm text-muted-foreground">{c.sala.nombre} · {c.genetica.nombre}</p>
                  </div>
                  <StatusBadge variant={ETAPA_VARIANT[c.etapa] ?? "neutral"} label={ETAPA_LABEL[c.etapa] ?? c.etapa} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-muted-foreground text-xs">Plantas</p>
                    <p className="font-semibold">{c.plantasActuales}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Aplicaciones</p>
                    <p className="font-semibold">{c._count.aplicaciones}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Costo acum.</p>
                    <p className="font-semibold">{ARS(c.costoAcumulado)}</p>
                  </div>
                </div>
                {c.etapa !== "FINALIZADO" && (
                  <div className="flex gap-2">
                    {siguienteEtapa(c.etapa) && c.etapa !== "CURADO" && (
                      <Button size="sm" variant="outline" onClick={() => avanzarEtapa(c)} className="gap-1">
                        Avanzar <ChevronRight className="h-3 w-3" />
                      </Button>
                    )}
                    {(c.etapa === "CURADO" || c.etapa === "SECADO") && (
                      <Button size="sm" onClick={() => setCosechaDialog(c.id)}>Registrar cosecha</Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog nuevo ciclo */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo ciclo de cultivo</DialogTitle></DialogHeader>
          <form onSubmit={crearCiclo} className="space-y-3">
            <div>
              <Label>Sala / invernadero *</Label>
              <Select value={form.salaId} onValueChange={(v) => setForm((f) => ({ ...f, salaId: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar sala..." /></SelectTrigger>
                <SelectContent>
                  {(salas ?? []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.nombre} ({s.tipo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Genética autorizada *</Label>
              <Select value={form.geneticaId} onValueChange={(v) => setForm((f) => ({ ...f, geneticaId: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar genética..." /></SelectTrigger>
                <SelectContent>
                  {(geneticas ?? []).map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.nombre} ({g.tipo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plantas iniciales *</Label>
              <Input type="number" min="1" value={form.plantasIniciales} onChange={(e) => setForm((f) => ({ ...f, plantasIniciales: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Iniciar ciclo"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog sala */}
      <Dialog open={salaDialog} onOpenChange={setSalaDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva sala de cultivo</DialogTitle></DialogHeader>
          <form onSubmit={crearSala} className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={salaForm.nombre} onChange={(e) => setSalaForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Invernadero A" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={salaForm.tipo} onValueChange={(v) => setSalaForm((f) => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDOOR">Indoor</SelectItem>
                  <SelectItem value="INVERNADERO">Invernadero</SelectItem>
                  <SelectItem value="OUTDOOR">Outdoor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Superficie (m²)</Label>
                <Input type="number" min="0" value={salaForm.superficieM2} onChange={(e) => setSalaForm((f) => ({ ...f, superficieM2: e.target.value }))} />
              </div>
              <div>
                <Label>Capacidad plantas</Label>
                <Input type="number" min="0" value={salaForm.capacidadPlantas} onChange={(e) => setSalaForm((f) => ({ ...f, capacidadPlantas: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={saving}>Crear sala</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog genética */}
      <Dialog open={genDialog} onOpenChange={setGenDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva genética</DialogTitle></DialogHeader>
          <form onSubmit={crearGenetica} className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input value={genForm.nombre} onChange={(e) => setGenForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={genForm.tipo} onValueChange={(v) => setGenForm((f) => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CBD">CBD</SelectItem>
                  <SelectItem value="THC">THC</SelectItem>
                  <SelectItem value="MIXTO">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>THC máx (%)</Label>
                <Input type="number" step="0.1" value={genForm.thcMaxPct} onChange={(e) => setGenForm((f) => ({ ...f, thcMaxPct: e.target.value }))} />
              </div>
              <div>
                <Label>CBD máx (%)</Label>
                <Input type="number" step="0.1" value={genForm.cbdMaxPct} onChange={(e) => setGenForm((f) => ({ ...f, cbdMaxPct: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={saving}>Registrar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog cosecha */}
      <Dialog open={cosechaDialog != null} onOpenChange={(o) => !o && setCosechaDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar cosecha</DialogTitle></DialogHeader>
          <form onSubmit={registrarCosecha} className="space-y-3">
            <div>
              <Label>Plantas cosechadas *</Label>
              <Input type="number" min="1" value={cosechaForm.plantasCosechadas} onChange={(e) => setCosechaForm((f) => ({ ...f, plantasCosechadas: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Peso húmedo (kg)</Label>
                <Input type="number" step="0.01" value={cosechaForm.pesoHumedoKg} onChange={(e) => setCosechaForm((f) => ({ ...f, pesoHumedoKg: e.target.value }))} />
              </div>
              <div>
                <Label>Peso seco (kg)</Label>
                <Input type="number" step="0.01" value={cosechaForm.pesoSecoKg} onChange={(e) => setCosechaForm((f) => ({ ...f, pesoSecoKg: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Lote trazabilidad REPROCANN</Label>
              <Input className="font-mono" value={cosechaForm.loteTrazabilidad} onChange={(e) => setCosechaForm((f) => ({ ...f, loteTrazabilidad: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={saving}>Finalizar ciclo</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}