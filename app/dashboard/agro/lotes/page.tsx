"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Plus, Wheat } from "lucide-react"

interface Lote {
  id: number
  nombre: string
  superficieHa: number
  cultivoActual: string | null
  campana: string | null
  renspaProductor: string | null
  proveedor: { nombre: string } | null
  lat: number | null
  lon: number | null
  activo: boolean
}

interface Proveedor { id: number; nombre: string }

const NUM = (v: number, d = 1) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)

const CULTIVO_COLOR: Record<string, string> = {
  Soja: "bg-green-100 text-green-800",
  Maíz: "bg-yellow-100 text-yellow-800",
  Trigo: "bg-amber-100 text-amber-800",
  Girasol: "bg-orange-100 text-orange-800",
  Barbecho: "bg-gray-100 text-gray-700",
}

export default function LotesPage() {
  const { toast } = useToast()
  const { data: lotes, isLoading, mutate } = useAuthFetch<Lote[]>("/api/agro/lotes")
  const { data: proveedores } = useAuthFetch<{ proveedores: Proveedor[] }>("/api/proveedores?limit=200")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre: "",
    superficieHa: "",
    cultivoActual: "",
    campana: "2025/26",
    renspaProductor: "",
    proveedorId: "",
    lat: "",
    lon: "",
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const totalHa = (lotes ?? []).reduce((s, l) => s + l.superficieHa, 0)

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.superficieHa) {
      toast({ title: "Nombre y superficie son requeridos", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await authFetch("/api/agro/lotes", {
        method: "POST",
        body: JSON.stringify({
          nombre: form.nombre,
          superficieHa: Number(form.superficieHa),
          cultivoActual: form.cultivoActual || undefined,
          campana: form.campana || undefined,
          renspaProductor: form.renspaProductor || undefined,
          proveedorId: form.proveedorId ? Number(form.proveedorId) : undefined,
          lat: form.lat ? Number(form.lat) : undefined,
          lon: form.lon ? Number(form.lon) : undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await mutate()
      setDialogOpen(false)
      setForm({ nombre: "", superficieHa: "", cultivoActual: "", campana: "2025/26", renspaProductor: "", proveedorId: "", lat: "", lon: "" })
      toast({ title: "Lote registrado" })
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lotes / Campos</h1>
          <p className="text-sm text-muted-foreground">
            {(lotes ?? []).length} lotes · {NUM(totalHa)} ha totales
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Nuevo lote
        </Button>
      </div>

      {/* Mapa placeholder — integrar Mapbox GL JS */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <MapPin className="h-12 w-12 opacity-20 mb-4" />
          <p className="font-medium">Mapa interactivo</p>
          <p className="text-sm max-w-xs">
            Integrar Mapbox GL JS con mapbox-gl-draw para dibujar polígonos y calcular hectáreas automáticamente.
          </p>
          <p className="text-xs mt-2 font-mono text-muted-foreground/60">
            NEXT_PUBLIC_MAPBOX_TOKEN requerido en .env.local
          </p>
        </CardContent>
      </Card>

      {/* Lista de lotes */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Spinner /></div>
      ) : (lotes ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center text-muted-foreground gap-4">
            <Wheat className="h-12 w-12 opacity-20" />
            <div>
              <p className="font-medium">Sin lotes registrados</p>
              <p className="text-sm">Registre los campos de sus productores</p>
            </div>
            <Button onClick={() => setDialogOpen(true)}><Plus className="mr-1 h-4 w-4" /> Nuevo lote</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lotes?.map(l => (
            <Card key={l.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{l.nombre}</CardTitle>
                  {l.cultivoActual && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CULTIVO_COLOR[l.cultivoActual] ?? "bg-gray-100 text-gray-800"}`}>
                      {l.cultivoActual}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="text-lg font-bold">{NUM(l.superficieHa)} ha</p>
                {l.proveedor && <p className="text-muted-foreground">{l.proveedor.nombre}</p>}
                {l.campana && <p className="text-muted-foreground">Campaña: {l.campana}</p>}
                {l.renspaProductor && (
                  <p className="font-mono text-xs text-muted-foreground">RENSPA: {l.renspaProductor}</p>
                )}
                {l.lat && l.lon && (
                  <p className="text-xs text-muted-foreground">
                    <MapPin className="inline h-3 w-3 mr-0.5" />
                    {NUM(l.lat, 4)}, {NUM(l.lon, 4)}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog nuevo lote */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo lote / campo</DialogTitle></DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Nombre del lote *</Label>
                <Input placeholder="Lote Norte" value={form.nombre} onChange={e => set("nombre", e.target.value)} />
              </div>
              <div>
                <Label>Superficie (ha) *</Label>
                <Input type="number" min="0" step="0.01" placeholder="100" value={form.superficieHa} onChange={e => set("superficieHa", e.target.value)} />
              </div>
              <div>
                <Label>Cultivo actual</Label>
                <Select value={form.cultivoActual} onValueChange={v => set("cultivoActual", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Soja">Soja</SelectItem>
                    <SelectItem value="Maíz">Maíz</SelectItem>
                    <SelectItem value="Trigo">Trigo</SelectItem>
                    <SelectItem value="Girasol">Girasol</SelectItem>
                    <SelectItem value="Cebada">Cebada</SelectItem>
                    <SelectItem value="Sorgo">Sorgo</SelectItem>
                    <SelectItem value="Barbecho">Barbecho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Campaña</Label>
                <Input placeholder="2025/26" value={form.campana} onChange={e => set("campana", e.target.value)} />
              </div>
              <div>
                <Label>Productor</Label>
                <Select value={form.proveedorId} onValueChange={v => set("proveedorId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {(proveedores?.proveedores ?? []).map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>RENSPA del productor</Label>
                <Input placeholder="XX.XXX.X.XXXXX/XX" value={form.renspaProductor} onChange={e => set("renspaProductor", e.target.value)} className="font-mono" />
              </div>
              <div>
                <Label>Latitud (GPS)</Label>
                <Input type="number" step="any" placeholder="-34.6037" value={form.lat} onChange={e => set("lat", e.target.value)} />
              </div>
              <div>
                <Label>Longitud (GPS)</Label>
                <Input type="number" step="any" placeholder="-58.3816" value={form.lon} onChange={e => set("lon", e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar lote"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
