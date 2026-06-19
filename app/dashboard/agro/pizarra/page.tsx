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
import { BarChart3, TrendingUp, TrendingDown, Plus, RefreshCcw } from "lucide-react"

interface PizarraItem {
  granoId: number
  nombre: string
  codigo: string
  precio: number | null
  moneda: string
  fuente: string | null
  variacion: number | null
  fechaData: string | null
}

interface Grano { id: number; nombre: string; codigo: string }

const ARS = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v)
const NUM = (v: number, d = 2) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)
const FECHA = (s: string) => new Date(s).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

const FUENTE_COLOR: Record<string, string> = {
  BCR: "bg-blue-100 text-blue-800",
  "MATBA-ROFEX": "bg-purple-100 text-purple-800",
  CME: "bg-orange-100 text-orange-800",
  manual: "bg-gray-100 text-gray-800",
}

export default function PizarraPage() {
  const { toast } = useToast()
  const { data: pizarra, isLoading, mutate } = useAuthFetch<PizarraItem[]>("/api/agro/pizarra", { refreshInterval: 300000 })
  const { data: granos } = useAuthFetch<Grano[]>("/api/agro/granos")
  const [refreshing, setRefreshing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    granoId: "",
    posicion: "Disponible",
    precio: "",
    moneda: "ARS",
    fuente: "manual",
    variacion: "",
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleRefresh() {
    setRefreshing(true)
    await mutate()
    setRefreshing(false)
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.granoId || !form.precio) {
      toast({ title: "Grano y precio son requeridos", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await authFetch("/api/agro/pizarra", {
        method: "POST",
        body: JSON.stringify({
          granoId: Number(form.granoId),
          posicion: form.posicion,
          precio: Number(form.precio),
          moneda: form.moneda,
          fuente: form.fuente,
          variacion: form.variacion ? Number(form.variacion) : undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await mutate()
      setDialogOpen(false)
      setForm({ granoId: "", posicion: "Disponible", precio: "", moneda: "ARS", fuente: "manual", variacion: "" })
      toast({ title: "Precio actualizado" })
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
          <h1 className="text-2xl font-semibold">Pizarra de precios</h1>
          <p className="text-sm text-muted-foreground">BCR · MATBA-ROFEX · Chicago CME · Actualización automática c/5 min</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw className={`mr-1 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Cargar precio
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Spinner /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(pizarra ?? []).map(p => (
            <Card key={p.granoId} className={!p.precio ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.nombre}</CardTitle>
                  {p.fuente && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${FUENTE_COLOR[p.fuente] ?? "bg-gray-100 text-gray-800"}`}>
                      {p.fuente}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {p.precio
                    ? p.moneda === "USD"
                      ? `USD ${NUM(p.precio, 2)}`
                      : ARS(p.precio)
                    : "—"
                  }
                </p>
                {p.variacion != null && (
                  <div className={`flex items-center gap-1 text-sm mt-1 ${p.variacion >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {p.variacion >= 0
                      ? <TrendingUp className="h-3.5 w-3.5" />
                      : <TrendingDown className="h-3.5 w-3.5" />
                    }
                    <span>{p.variacion >= 0 ? "+" : ""}{NUM(p.variacion, 2)} vs. cierre anterior</span>
                  </div>
                )}
                {p.fechaData && (
                  <p className="text-xs text-muted-foreground mt-2">Actualizado: {FECHA(p.fechaData)}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(pizarra ?? []).length === 0 && !isLoading && (
        <Card className="py-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">Sin precios cargados</p>
          <p className="text-sm text-muted-foreground mb-4">Cargue los primeros precios de pizarra manualmente</p>
          <Button onClick={() => setDialogOpen(true)}><Plus className="mr-1 h-4 w-4" /> Cargar precio</Button>
        </Card>
      )}

      {/* Dialog carga manual */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargar precio de pizarra</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGuardar} className="space-y-4">
            <div>
              <Label>Grano *</Label>
              <Select value={form.granoId} onValueChange={v => set("granoId", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {(granos ?? []).map(g => <SelectItem key={g.id} value={String(g.id)}>{g.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Posición</Label>
                <Input placeholder="Disponible" value={form.posicion} onChange={e => set("posicion", e.target.value)} />
              </div>
              <div>
                <Label>Fuente</Label>
                <Select value={form.fuente} onValueChange={v => set("fuente", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BCR">BCR</SelectItem>
                    <SelectItem value="MATBA-ROFEX">MATBA-ROFEX</SelectItem>
                    <SelectItem value="CME">CME (Chicago)</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Precio *</Label>
                <Input type="number" min="0" step="0.01" placeholder="450000" value={form.precio} onChange={e => set("precio", e.target.value)} />
              </div>
              <div>
                <Label>Moneda</Label>
                <Select value={form.moneda} onValueChange={v => set("moneda", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Variación vs. cierre (opcional)</Label>
              <Input type="number" step="0.01" placeholder="1500" value={form.variacion} onChange={e => set("variacion", e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
