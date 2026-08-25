"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { mantenimientoEstadoLabel, mantenimientoEstadoVariant, prioridadLabel, prioridadVariant } from "@/lib/ui/status-map"
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
  CheckCircle, Clock, Settings, Play, MessageSquare, Car, ShieldCheck,
} from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { normalizePatente, getWhatsAppShareUrl } from "@/lib/utils/formatters-ar"

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
  repuestoTraidoPorCliente?: boolean
  patenteVehiculo?: string | null
  plan?: { nombre: string; equipo: string | null } | null
}

interface Resumen {
  pendientes: number
  enProceso: number
  completadas: number
  planesActivos: number
  proximas: OrdenTrabajo[]
}

export default function MantenimientoPage() {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogPlan, setDialogPlan] = useState(false)
  const [dialogOT, setDialogOT] = useState(false)
  const [repuestoCliente, setRepuestoCliente] = useState(false)
  const [patenteInput, setPatenteInput] = useState("")

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
    const patenteNorm = normalizePatente(patenteInput)

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
        repuestoTraidoPorCliente: repuestoCliente,
        costoRepuestos: repuestoCliente ? 0 : (fd.get("costoRepuestos") ? Number(fd.get("costoRepuestos")) : 0),
        patenteVehiculo: patenteNorm,
      }),
    })
    setDialogOT(false)
    setPatenteInput("")
    setRepuestoCliente(false)
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
    <PageShell>
      <PageHeader
        title="Mantenimiento y Taller de Servicio"
        description="Planes, órdenes de trabajo, vehículos/patentes e insumos del cliente"
        actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerarPreventivas}>
            <Play className="mr-2 h-4 w-4" /> Generar OTs preventivas
          </Button>
          <Dialog open={dialogOT} onOpenChange={setDialogOT}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" /> Nueva OT / Taller</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Nueva Orden de Trabajo / Servicio Taller</DialogTitle></DialogHeader>
              <form onSubmit={handleCrearOT} className="space-y-4 text-sm">
                <div><Label>Descripción del trabajo o falla *</Label><Textarea name="descripcion" required placeholder="Ej: Cambio de aceite y filtros de vehículo" /></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Patente del Vehículo / Equipo</Label>
                    <Input
                      value={patenteInput}
                      onChange={(e) => setPatenteInput(e.target.value)}
                      onBlur={() => setPatenteInput(normalizePatente(patenteInput))}
                      placeholder="Ej. AAA 123 o AA 123 BB"
                    />
                    {patenteInput && <span className="text-[11px] text-muted-foreground font-mono">Formateado: {normalizePatente(patenteInput)}</span>}
                  </div>
                  <div>
                    <Label>Tipo de Servicio</Label>
                    <Select name="tipo"><SelectTrigger><SelectValue placeholder="Preventivo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventivo">Preventivo</SelectItem>
                        <SelectItem value="correctivo">Correctivo / Reparación</SelectItem>
                        <SelectItem value="predictivo">Predictivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-xs text-amber-900 dark:text-amber-200">Repuestos / Insumos traídos por el cliente</p>
                    <p className="text-[11px] text-muted-foreground">Si se activa, el costo de repuestos propios es $0 y no descuenta de tu stock.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={repuestoCliente}
                    onChange={(e) => setRepuestoCliente(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <div><Label>Fecha programada *</Label><Input name="fechaProgramada" type="date" required /></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Técnico asignado</Label><Input name="tecnicoAsignado" placeholder="Mecánico / Operario" /></div>
                  <div><Label>Costo estimado repuestos ($)</Label><Input name="costoRepuestos" type="number" disabled={repuestoCliente} placeholder={repuestoCliente ? "$0 (Traído por cliente)" : "0.00"} /></div>
                </div>

                <DialogFooter><Button type="submit">Crear OT / Ficha Taller</Button></DialogFooter>
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
        }
      />

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
            <div className="rounded-lg bg-purple-500/10 p-2"><Settings className="h-5 w-5 text-purple-500" /></div>
            <div><p className="text-2xl font-bold">{resumen.planesActivos}</p><p className="text-xs text-muted-foreground">Planes activos</p></div>
          </CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="ordenes">
        <TabsList>
          <TabsTrigger value="ordenes" className="gap-2"><Wrench className="h-4 w-4" />Órdenes de Trabajo</TabsTrigger>
          <TabsTrigger value="planes" className="gap-2"><Calendar className="h-4 w-4" />Planes de Mantenimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="ordenes" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Órdenes de Trabajo Registradas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ordenes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No hay órdenes de trabajo cargadas</p>
                ) : (
                  ordenes.map((ot) => (
                    <div key={ot.id} className="flex flex-wrap items-center justify-between gap-3 p-3 border rounded-lg hover:border-border transition-colors text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs">{ot.numero}</span>
                          <StatusBadge variant={mantenimientoEstadoVariant(ot.estado)} label={mantenimientoEstadoLabel(ot.estado)} />
                          <StatusBadge variant={prioridadVariant(ot.prioridad)} label={prioridadLabel(ot.prioridad)} />
                          {ot.repuestoTraidoPorCliente && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 border-amber-300 text-[10px]">
                              Insumo del Cliente ($0 stock)
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium">{ot.descripcion}</p>
                        <p className="text-xs text-muted-foreground">
                          {ot.tecnicoAsignado ? `Técnico: ${ot.tecnicoAsignado} · ` : ""}
                          Prog: {new Date(ot.fechaProgramada).toLocaleDateString("es-AR")}
                          {ot.patenteVehiculo ? ` · Patente: ${ot.patenteVehiculo}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white border-green-700 font-medium"
                          onClick={() => {
                            const msg = `Hola! Te informamos sobre el estado de la Orden OT #${ot.numero}: se encuentra ${mantenimientoEstadoLabel(ot.estado)}.`
                            window.open(getWhatsAppShareUrl("", msg), "_blank")
                          }}
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1" />
                          Notificar WA
                        </Button>
                        {ot.estado === "pendiente" && (
                          <Button size="sm" variant="outline" onClick={() => handleCambiarEstado(ot.id, "en_proceso")}>
                            Iniciar
                          </Button>
                        )}
                        {ot.estado === "en_proceso" && (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleCambiarEstado(ot.id, "completada")}>
                            Finalizar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planes">
          <Card>
            <CardHeader><CardTitle className="text-sm">Planes de Mantenimiento Preventivo</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {planes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No hay planes registrados</p>
                ) : (
                  planes.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-3 border rounded-lg text-sm">
                      <div>
                        <p className="font-semibold">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">{p.descripcion || "Sin descripción"}</p>
                        <p className="text-xs text-muted-foreground mt-1">Frecuencia: {p.frecuencia} · Próxima: {new Date(p.proximaEjecucion).toLocaleDateString("es-AR")}</p>
                      </div>
                      <StatusBadge variant={p.activo ? "success" : "neutral"} label={p.activo ? "Activo" : "Inactivo"} />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
