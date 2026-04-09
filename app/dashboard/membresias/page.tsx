"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Dumbbell, Search, Plus, Users, CheckCircle2, XCircle, Clock,
  TrendingUp, CreditCard, Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Plan {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  periodicidad: string
  duracionDias: number
  activo: boolean
  _count: { membresias: number }
}

interface Membresia {
  id: number
  fechaInicio: string
  fechaFin: string
  estado: string
  notas: string | null
  plan: { id: number; nombre: string; precio: number; periodicidad: string }
  cliente: { id: number; nombre: string; email: string | null }
}

const PLAN_COLORS = ["bg-slate-500", "bg-blue-500", "bg-green-500", "bg-amber-500", "bg-purple-500", "bg-pink-500"]

const ESTADO_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  activa: { label: "Activa", variant: "default", color: "text-green-600" },
  por_vencer: { label: "Por vencer", variant: "secondary", color: "text-amber-600" },
  vencida: { label: "Vencida", variant: "destructive", color: "text-red-600" },
  suspendida: { label: "Suspendida", variant: "outline", color: "text-slate-500" },
}

export default function MembresiasPage() {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [resumen, setResumen] = useState({ totalPlanes: 0, totalMembresias: 0, activas: 0, vencidas: 0, ingresoMensual: 0 })
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [modalNuevo, setModalNuevo] = useState(false)
  const [formPlan, setFormPlan] = useState({ nombre: "", descripcion: "", precio: "", periodicidad: "mensual", duracionDias: "30" })

  const cargarDatos = useCallback(async () => {
    try {
      const res = await fetch("/api/membresias")
      if (!res.ok) return
      const data = await res.json()
      setPlanes(data.planes ?? [])
      setMembresias(data.membresias ?? [])
      setResumen(data.resumen ?? { totalPlanes: 0, totalMembresias: 0, activas: 0, vencidas: 0, ingresoMensual: 0 })
    } catch { /* silently fail */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  const guardarPlan = async () => {
    if (!formPlan.nombre || !formPlan.precio) return
    try {
      const res = await fetch("/api/membresias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "plan", nombre: formPlan.nombre, descripcion: formPlan.descripcion || undefined, precio: Number(formPlan.precio), periodicidad: formPlan.periodicidad, duracionDias: Number(formPlan.duracionDias) }),
      })
      if (res.ok) { setModalNuevo(false); cargarDatos() }
    } catch { /* silently fail */ }
  }

  const membresiasFiltradas = membresias.filter(m => {
    const matchBusqueda = m.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchEstado = filtroEstado === "todos" || m.estado === filtroEstado
    return matchBusqueda && matchEstado
  })

  if (loading) return <div className="flex items-center justify-center h-96"><Spinner className="h-8 w-8" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold">Membresias</h1>
            <p className="text-sm text-muted-foreground">Gestion de socios y abonos</p>
          </div>
        </div>
        <Button onClick={() => setModalNuevo(true)}>
          <Plus className="h-4 w-4 mr-2" />Nuevo Plan
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Total socios</p></div><p className="text-2xl font-bold">{resumen.totalMembresias}</p></CardContent></Card>
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><CheckCircle2 className="h-4 w-4 text-green-600" /><p className="text-xs text-muted-foreground">Activas</p></div><p className="text-2xl font-bold text-green-700">{resumen.activas}</p></CardContent></Card>
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><XCircle className="h-4 w-4 text-red-600" /><p className="text-xs text-muted-foreground">Vencidas</p></div><p className="text-2xl font-bold text-red-700">{resumen.vencidas}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><CreditCard className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Planes</p></div><p className="text-2xl font-bold">{resumen.totalPlanes}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Ingresos est. mes</p></div><p className="text-2xl font-bold text-primary">${resumen.ingresoMensual.toLocaleString("es-AR")}</p></CardContent></Card>
      </div>

      {/* Planes */}
      {planes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Planes activos</h2>
          <div className="grid grid-cols-4 gap-3">
            {planes.filter(p => p.activo).map((plan, idx) => (
              <Card key={plan.id} className="overflow-hidden">
                <div className={cn("h-1.5 w-full", PLAN_COLORS[idx % PLAN_COLORS.length])} />
                <CardContent className="p-4">
                  <p className="font-semibold text-sm">{plan.nombre}</p>
                  <p className="text-2xl font-bold mt-1">${Number(plan.precio).toLocaleString("es-AR")}</p>
                  {plan.descripcion && <p className="text-xs text-muted-foreground">{plan.descripcion}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">{plan.duracionDias} dias</Badge>
                    <span className="text-xs text-muted-foreground">{plan._count.membresias} socios</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de socios */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Socios</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar socio..." className="pl-9 h-9 w-56 text-sm" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="h-9 w-36"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activa">Activos</SelectItem>
                  <SelectItem value="vencida">Vencidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Socio</th>
                  <th className="text-left p-3 font-medium">Plan</th>
                  <th className="text-left p-3 font-medium">Inicio</th>
                  <th className="text-left p-3 font-medium">Vencimiento</th>
                  <th className="text-left p-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {membresiasFiltradas.map(m => {
                  const cfg = ESTADO_CONFIG[m.estado] ?? ESTADO_CONFIG.activa
                  return (
                    <tr key={m.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <p className="font-medium">{m.cliente.nombre}</p>
                        {m.cliente.email && <p className="text-xs text-muted-foreground">{m.cliente.email}</p>}
                      </td>
                      <td className="p-3">{m.plan.nombre}</td>
                      <td className="p-3 text-muted-foreground">{new Date(m.fechaInicio).toLocaleDateString("es-AR")}</td>
                      <td className="p-3 text-muted-foreground">{new Date(m.fechaFin).toLocaleDateString("es-AR")}</td>
                      <td className="p-3"><Badge variant={cfg.variant}>{cfg.label}</Badge></td>
                    </tr>
                  )
                })}
                {membresiasFiltradas.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No se encontraron membresias</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal nuevo plan */}
      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Plan de Membresia</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Nombre *</Label><Input value={formPlan.nombre} onChange={e => setFormPlan({ ...formPlan, nombre: e.target.value })} placeholder="Mensual Plus" /></div>
              <div className="space-y-1.5"><Label>Precio *</Label><Input type="number" value={formPlan.precio} onChange={e => setFormPlan({ ...formPlan, precio: e.target.value })} placeholder="15000" /></div>
            </div>
            <div className="space-y-1.5"><Label>Descripcion</Label><Input value={formPlan.descripcion} onChange={e => setFormPlan({ ...formPlan, descripcion: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Periodicidad</Label>
                <Select value={formPlan.periodicidad} onValueChange={v => setFormPlan({ ...formPlan, periodicidad: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem><SelectItem value="trimestral">Trimestral</SelectItem><SelectItem value="semestral">Semestral</SelectItem><SelectItem value="anual">Anual</SelectItem>
                </SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Duracion (dias)</Label><Input type="number" value={formPlan.duracionDias} onChange={e => setFormPlan({ ...formPlan, duracionDias: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNuevo(false)}>Cancelar</Button>
            <Button onClick={guardarPlan} disabled={!formPlan.nombre || !formPlan.precio}>Guardar Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
