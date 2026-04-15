"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Wrench, Plus, RefreshCw, Calendar, AlertTriangle,
  CheckCircle, Clock, Settings, Play,
} from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

interface Plan {
  id: number
  nombre: string
  descripcion: string | null
  frecuencia: string
  proximaEjecucion: string
  equipo: string | null
  responsable: string | null
  costoEstimado: number | null
  activo: boolean
  ordenesTrabajo: OrdenTrabajo[]
}

interface OrdenTrabajo {
  id: number
  numero: string
  tipo: string
  descripcion: string
  estado: string
  prioridad: string
  fechaProgramada: string
  fechaInicio: string | null
  fechaFin: string | null
  tecnicoAsignado: string | null
  costoManoObra: number | null
  costoRepuestos: number | null
  plan?: { nombre: string; equipo: string | null } | null
}

interface Resumen {
  pendientes: number
  enProceso: number
  completadas: number
  planesActivos: number
  proximas: OrdenTrabajo[]
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-amber-500/15 text-amber-600",
  en_proceso: "bg-blue-500/15 text-blue-600",
  completada: "bg-emerald-500/15 text-emerald-600",
  cancelada: "bg-gray-500/15 text-gray-600",
}

const PRIORIDAD_COLORS: Record<string, string> = {
  baja: "bg-gray-500/15 text-gray-600",
  media: "bg-blue-500/15 text-blue-600",
  alta: "bg-amber-500/15 text-amber-600",
  urgente: "bg-red-500/15 text-red-600",
}

export default function MantenimientoPage() {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogPlan, setDialogPlan] = useState(false)
  const [dialogOT, setDialogOT] = useState(false)

  const headers = { Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}` }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [planRes, otRes, resRes] = await Promise.all([
        fetch("/api/mantenimiento", { headers }),
        fetch("/api/mantenimiento?vista=ordenes", { headers }),
        fetch("/api/mantenimiento?vista=resumen", { headers }),
      ])
      if (planRes.ok) setPlanes(await planRes.json())
      if (otRes.ok) setOrdenes(await otRes.json())
      if (resRes.ok) setResumen(await resRes.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: fetchData,
  }))

  async function handleCrearPlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await fetch("/api/mantenimiento", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "plan",
        nombre: fd.get("nombre"),
        descripcion: fd.get("descripcion"),
        frecuencia: fd.get("frecuencia"),
        proximaEjecucion: fd.get("proximaEjecucion"),
        equipo: fd.get("equipo"),
        responsable: fd.get("responsable"),
        costoEstimado: fd.get("costoEstimado") ? Number(fd.get("costoEstimado")) : undefined,
      }),
    })
    setDialogPlan(false)
    fetchData()
  }

  async function handleCrearOT(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await fetch("/api/mantenimiento", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "orden",
        descripcion: fd.get("descripcion"),
        tipo: fd.get("tipo"),
        prioridad: fd.get("prioridad"),
        fechaProgramada: fd.get("fechaProgramada"),
        tecnicoAsignado: fd.get("tecnicoAsignado"),
      }),
    })
    setDialogOT(false)
    fetchData()
  }

  async function handleGenerarPreventivas() {
    await fetch("/api/mantenimiento", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "generar_preventivas" }),
    })
    fetchData()
  }

  async function handleCambiarEstado(id: number, estado: string) {
    await fetch("/api/mantenimiento", {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        estado,
        ...(estado === "en_proceso" ? { fechaInicio: new Date().toISOString() } : {}),
        ...(estado === "completada" ? { fechaFin: new Date().toISOString() } : {}),
      }),
    })
    fetchData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mantenimiento Preventivo</h1>
          <p className="text-muted-foreground">Planes, órdenes de trabajo y tracking de activos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerarPreventivas}>
            <Play className="mr-2 h-4 w-4" /> Generar OTs preventivas
          </Button>
          <Dialog open={dialogOT} onOpenChange={setDialogOT}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Nueva OT</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva Orden de Trabajo</DialogTitle></DialogHeader>
              <form onSubmit={handleCrearOT} className="space-y-4">
                <div><Label>Descripción *</Label><Textarea name="descripcion" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select name="tipo"><SelectTrigger><SelectValue placeholder="Preventivo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventivo">Preventivo</SelectItem>
                        <SelectItem value="correctivo">Correctivo</SelectItem>
                        <SelectItem value="predictivo">Predictivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridad</Label>
                    <Select name="prioridad"><SelectTrigger><SelectValue placeholder="Media" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Fecha programada *</Label><Input name="fechaProgramada" type="date" required /></div>
                <div><Label>Técnico asignado</Label><Input name="tecnicoAsignado" /></div>
                <DialogFooter><Button type="submit">Crear OT</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogPlan} onOpenChange={setDialogPlan}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Nuevo Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo Plan de Mantenimiento</DialogTitle></DialogHeader>
              <form onSubmit={handleCrearPlan} className="space-y-4">
                <div><Label>Nombre *</Label><Input name="nombre" placeholder="Ej: Servicio anual compresor" required /></div>
                <div><Label>Descripción</Label><Textarea name="descripcion" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Frecuencia *</Label>
                    <Select name="frecuencia" required><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensual">Mensual</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Próxima ejecución *</Label><Input name="proximaEjecucion" type="date" required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Equipo / máquina</Label><Input name="equipo" /></div>
                  <div><Label>Responsable</Label><Input name="responsable" /></div>
                </div>
                <div><Label>Costo estimado</Label><Input name="costoEstimado" type="number" step="0.01" /></div>
                <DialogFooter><Button type="submit">Crear plan</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2"><Clock className="h-5 w-5 text-amber-500" /></div>
            <div><p className="text-2xl font-bold">{resumen.pendientes}</p><p className="text-xs text-muted-foreground">Pendientes</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2"><Wrench className="h-5 w-5 text-blue-500" /></div>
            <div><p className="text-2xl font-bold">{resumen.enProceso}</p><p className="text-xs text-muted-foreground">En proceso</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2"><CheckCircle className="h-5 w-5 text-emerald-500" /></div>
            <div><p className="text-2xl font-bold">{resumen.completadas}</p><p className="text-xs text-muted-foreground">Completadas</p></div>
          </CardContent></Card>
          <Card><CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-lg bg-violet-500/10 p-2"><Settings className="h-5 w-5 text-violet-500" /></div>
            <div><p className="text-2xl font-bold">{resumen.planesActivos}</p><p className="text-xs text-muted-foreground">Planes activos</p></div>
          </CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="ordenes">
        <TabsList>
          <TabsTrigger value="ordenes">Órdenes de Trabajo</TabsTrigger>
          <TabsTrigger value="planes">Planes Preventivos</TabsTrigger>
        </TabsList>

        <TabsContent value="ordenes" className="space-y-3">
          {ordenes.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">
              No hay órdenes de trabajo
            </CardContent></Card>
          ) : (
            ordenes.map((ot) => (
              <Card key={ot.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{ot.numero}</p>
                        <Badge className={ESTADO_COLORS[ot.estado] ?? ""}>{ot.estado.replace("_", " ")}</Badge>
                        <Badge className={PRIORIDAD_COLORS[ot.prioridad] ?? ""}>{ot.prioridad}</Badge>
                        <Badge variant="outline">{ot.tipo}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{ot.descripcion}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {ot.tecnicoAsignado && <span>Técnico: {ot.tecnicoAsignado}</span>}
                        {ot.plan && <span>Plan: {ot.plan.nombre}</span>}
                        <span>Programada: {new Date(ot.fechaProgramada).toLocaleDateString("es-AR")}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {ot.estado === "pendiente" && (
                        <Button size="sm" variant="outline" onClick={() => handleCambiarEstado(ot.id, "en_proceso")}>
                          Iniciar
                        </Button>
                      )}
                      {ot.estado === "en_proceso" && (
                        <Button size="sm" onClick={() => handleCambiarEstado(ot.id, "completada")}>
                          Completar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="planes" className="space-y-3">
          {planes.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">
              No hay planes de mantenimiento configurados
            </CardContent></Card>
          ) : (
            planes.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{plan.nombre}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Badge variant="outline">{plan.frecuencia}</Badge>
                        {plan.equipo && <span>Equipo: {plan.equipo}</span>}
                        {plan.responsable && <span>Resp: {plan.responsable}</span>}
                        <span>Próxima: {new Date(plan.proximaEjecucion).toLocaleDateString("es-AR")}</span>
                      </div>
                    </div>
                    {plan.costoEstimado && (
                      <p className="text-sm font-mono text-muted-foreground">
                        Est: {Number(plan.costoEstimado).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
