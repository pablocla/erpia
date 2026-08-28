"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dumbbell, Plus, Users, CheckCircle2, XCircle, CreditCard, Filter, MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DataTable, type DataTableColumn } from "@/components/data-table"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { PageSkeleton } from "@/components/layout/page-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { AppExperienceHeader } from "@/components/app-experience/app-experience-header"
import { getCuotaExperience } from "@/lib/comercial/app-experience"
import { isCuotaProductShell } from "@/lib/comercial/product-shell"
import { useDashboardShell } from "@/hooks/use-dashboard-shell"
import { useToast } from "@/hooks/use-toast"
import { buildWaMeUrl, messageCuotaVencida } from "@/lib/comercial/whatsapp-copy"
import { CobrarDialog, type CobrarDialogDeudor } from "@/components/prestamos/cobrar-dialog"
import type { MedioCobro } from "@/lib/prestamos/prestamos-meta"

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
  cliente: { id: number; nombre: string; email: string | null; telefono?: string | null }
  saldoDeuda?: number // Opcional, para manejar pagos parciales
}

const PLAN_COLORS = [
  "bg-[var(--status-info)]",
  "bg-[var(--status-success)]",
  "bg-[var(--status-warning)]",
  "bg-primary",
  "bg-[var(--status-error)]",
]

const ESTADO_VARIANT: Record<string, "success" | "warning" | "error" | "neutral" | "info"> = {
  activa: "success",
  por_vencer: "warning",
  vencida: "error",
  parcial: "info", // Violeta/Primario
  suspendida: "neutral",
}

const ESTADO_LABEL: Record<string, string> = {
  activa: "Activa / Al día",
  por_vencer: "Vence hoy",
  vencida: "Vencida",
  parcial: "Pago parcial",
  suspendida: "Suspendida",
}

export default function MembresiasPage() {
  const { modoLite, productosSku, demoIndustryId } = useDashboardShell()
  const isCuota = isCuotaProductShell(modoLite, productosSku)
  const cuotaGuide = getCuotaExperience()
  const { toast } = useToast()

  const labelSujeto = ["escuela_barrio"].includes(demoIndustryId || "") ? "Alumno" : 
                      ["colonia_verano"].includes(demoIndustryId || "") ? "Colono" : 
                      ["pena_folklore"].includes(demoIndustryId || "") ? "Peñero" : 
                      ["cooperativa_cuotas"].includes(demoIndustryId || "") ? "Asociado" : "Socio"

  const [planes, setPlanes] = useState<Plan[]>([])
  const [membresias, setMembresias] = useState<Membresia[]>([])
  const [resumen, setResumen] = useState({
    totalPlanes: 0,
    totalMembresias: 0,
    activas: 0,
    vencidas: 0,
    ingresoMensual: 0,
  })
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [modalNuevo, setModalNuevo] = useState(false)
  const [formPlan, setFormPlan] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    periodicidad: "mensual",
    duracionDias: "30",
  })

  const [deudorActivo, setDeudorActivo] = useState<CobrarDialogDeudor | null>(null)
  const [cobrando, setCobrando] = useState(false)

  const cargarDatos = useCallback(async () => {
    try {
      const res = await fetch("/api/membresias")
      if (!res.ok) return
      const data = await res.json()
      setPlanes(data.planes ?? [])
      setMembresias(data.membresias ?? [])
      setResumen(
        data.resumen ?? {
          totalPlanes: 0,
          totalMembresias: 0,
          activas: 0,
          vencidas: 0,
          ingresoMensual: 0,
        },
      )
    } catch {
      /* silently fail */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  useKeyboardShortcuts(
    erpShortcuts({
      onRefresh: cargarDatos,
      onNew: () => setModalNuevo(true),
    }),
  )

  const guardarPlan = async () => {
    if (!formPlan.nombre || !formPlan.precio) return
    try {
      const res = await fetch("/api/membresias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "plan",
          nombre: formPlan.nombre,
          descripcion: formPlan.descripcion || undefined,
          precio: Number(formPlan.precio),
          periodicidad: formPlan.periodicidad,
          duracionDias: Number(formPlan.duracionDias),
        }),
      })
      if (res.ok) {
        setModalNuevo(false)
        setFormPlan({ nombre: "", descripcion: "", precio: "", periodicidad: "mensual", duracionDias: "30" })
        toast({ title: "Plan creado", description: "Ya podés asociar socios a este plan." })
        cargarDatos()
      }
    } catch {
      toast({ title: "Error", description: "No se pudo crear el plan", variant: "destructive" })
    }
  }

  const avisarCuota = async (m: Membresia) => {
    const texto = messageCuotaVencida({
      nombre: m.cliente.nombre,
      plan: m.plan.nombre,
      fechaFin: m.fechaFin,
    })
    const wa = buildWaMeUrl(m.cliente.telefono, texto)
    try {
      await navigator.clipboard.writeText(texto)
      if (wa) {
        window.open(wa, "_blank", "noopener,noreferrer")
        toast({ title: "WhatsApp abierto", description: "Mensaje de cuota listo para enviar." })
      } else {
        toast({
          title: "Mensaje copiado",
          description: "Sin teléfono en el socio: pegalo en WhatsApp a mano.",
        })
      }
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" })
    }
  }

  const avisarRecibo = async (m: Membresia, monto: number) => {
    const texto = `Hola ${m.cliente.nombre}, recibimos tu pago de $${monto.toLocaleString("es-AR")}. Ya estás al día, ¡gracias!`
    const wa = buildWaMeUrl(m.cliente.telefono, texto)
    try {
      if (wa) window.open(wa, "_blank", "noopener,noreferrer")
    } catch {
      // ignore
    }
  }

  const handleCobrar = async (payload: { monto: number; medio: MedioCobro }) => {
    if (!deudorActivo) return
    setCobrando(true)
    try {
      // Simular pegada al backend para cobrar
      await new Promise((r) => setTimeout(r, 600))
      toast({ title: "¡Cobro registrado!", description: "La cuota quedó al día." })
      setDeudorActivo(null)
      
      // Simular cambio de estado localmente para wow-moment
      const mToUpdate = membresias.find(m => m.id === deudorActivo.id)
      setMembresias(prev => prev.map(m => m.id === deudorActivo.id ? { ...m, estado: payload.monto < deudorActivo.total ? "parcial" : "activa", saldoDeuda: deudorActivo.total - payload.monto } : m))
      
      if (mToUpdate && payload.monto >= deudorActivo.total) {
        void avisarRecibo(mToUpdate, payload.monto)
      }
    } finally {
      setCobrando(false)
    }
  }

  const membresiasFiltradas = membresias.filter((m) => {
    const matchBusqueda = m.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const matchEstado = filtroEstado === "todos" || m.estado === filtroEstado
    return matchBusqueda && matchEstado
  })

  if (loading) return <PageSkeleton kpis={5} tableRows={8} tableCols={5} />

  return (
    <PageShell>
      <AppExperienceHeader
        guide={cuotaGuide}
        onPrimaryClick={() => setModalNuevo(true)}
        className="mb-2"
      />

      <PageHeader
        variant="surface"
        title={isCuota ? `${labelSujeto}s y cuotas` : "Membresías"}
        description={
          isCuota
            ? `Planes, ${labelSujeto.toLowerCase()}s al día y morosos. Avisá por WhatsApp cuando vence la cuota.`
            : "Gestión de socios, planes y vencimientos"
        }
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Dumbbell className="h-3.5 w-3.5" />
            {isCuota ? "Claver Cuota" : "Membresías"}
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[40px]"
              id="filtro-vencidos"
              onClick={() => {
                setFiltroEstado("vencida")
                document.getElementById("tabla-socios")?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Solo vencidos
            </Button>
            <Button onClick={() => setModalNuevo(true)} className="min-h-[40px]" id="nuevo-plan">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo plan
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total {labelSujeto.toLowerCase()}s</p>
            </div>
            <p className="text-2xl font-bold">{resumen.totalMembresias}</p>
          </CardContent>
        </Card>
        <Card className="border-[var(--status-success-border)] bg-[var(--status-success-muted)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-[var(--status-success)]" />
              <p className="text-xs text-muted-foreground">Activas</p>
            </div>
            <p className="text-2xl font-bold text-[var(--status-success-foreground)]">{resumen.activas}</p>
          </CardContent>
        </Card>
        <Card className="border-[var(--status-error-border)] bg-[var(--status-error-muted)]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-[var(--status-error)]" />
              <p className="text-xs text-muted-foreground">Vencidas</p>
            </div>
            <p className="text-2xl font-bold text-[var(--status-error-foreground)]">{resumen.vencidas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Planes</p>
            </div>
            <p className="text-2xl font-bold">{resumen.totalPlanes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Ingresos est. mes</p>
            <p className="text-2xl font-bold text-primary">
              ${resumen.ingresoMensual.toLocaleString("es-AR")}
            </p>
          </CardContent>
        </Card>
      </div>

      {planes.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Creá tu primer plan"
          description={`Mensual, trimestral o anual. Después asociás ${labelSujeto.toLowerCase()}s y cobrás cuotas.`}
          actionLabel="Nuevo plan"
          onAction={() => setModalNuevo(true)}
        />
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Planes activos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {planes
              .filter((p) => p.activo)
              .map((plan, idx) => (
                <Card key={plan.id} className="overflow-hidden">
                  <div className={cn("h-1.5 w-full", PLAN_COLORS[idx % PLAN_COLORS.length])} />
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm">{plan.nombre}</p>
                    <p className="text-2xl font-bold mt-1">
                      ${Number(plan.precio).toLocaleString("es-AR")}
                    </p>
                    {plan.descripcion && (
                      <p className="text-xs text-muted-foreground">{plan.descripcion}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {plan.duracionDias} días
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {plan._count.membresias} socios
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      <Card id="tabla-socios">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">{labelSujeto}s</CardTitle>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="h-9 w-40">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activa">Activos</SelectItem>
                <SelectItem value="por_vencer">Por vencer</SelectItem>
                <SelectItem value="vencida">Vencidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTable<Membresia>
            data={membresiasFiltradas}
            columns={[
              {
                key: "cliente" as any,
                header: labelSujeto,
                cell: (m) => (
                  <div>
                    <p className="font-medium">{m.cliente.nombre}</p>
                    {m.cliente.email && (
                      <p className="text-xs text-muted-foreground">{m.cliente.email}</p>
                    )}
                  </div>
                ),
                exportFn: (m) => m.cliente.nombre,
              },
              {
                key: "plan" as any,
                header: "Plan",
                cell: (m) => m.plan.nombre,
                exportFn: (m) => m.plan.nombre,
              },
              {
                key: "fechaInicio",
                header: "Inicio",
                sortable: true,
                cell: (m) => (
                  <span className="text-muted-foreground">
                    {new Date(m.fechaInicio).toLocaleDateString("es-AR")}
                  </span>
                ),
              },
              {
                key: "fechaFin",
                header: "Vencimiento",
                sortable: true,
                cell: (m) => (
                  <span className="text-muted-foreground">
                    {new Date(m.fechaFin).toLocaleDateString("es-AR")}
                  </span>
                ),
              },
              {
                key: "estado",
                header: "Estado",
                cell: (m) => (
                  <StatusBadge
                    variant={ESTADO_VARIANT[m.estado] ?? "neutral"}
                    label={ESTADO_LABEL[m.estado] ?? m.estado}
                  />
                ),
              },
              {
                key: "acciones" as any,
                header: "",
                cell: (m) => (
                  <div className="flex items-center gap-2 justify-end">
                    {(m.estado === "vencida" || m.estado === "por_vencer" || m.estado === "parcial") && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 text-xs min-h-[36px]"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeudorActivo({
                            id: m.id,
                            cliente: m.cliente.nombre,
                            total: m.saldoDeuda ?? m.plan.precio,
                            telefono: m.cliente.telefono || undefined,
                          })
                        }}
                      >
                        <CreditCard className="h-3.5 w-3.5 mr-1" />
                        Cobrar
                      </Button>
                    )}
                    {(m.estado === "vencida" || m.estado === "parcial") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs min-h-[36px]"
                        onClick={(e) => {
                          e.stopPropagation()
                          void avisarCuota(m)
                        }}
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1" />
                        Avisar
                      </Button>
                    )}
                  </div>
                ),
              },
            ] as DataTableColumn<Membresia>[]}
            rowKey="id"
            searchPlaceholder="Buscar socio…"
            searchKeys={["estado"]}
            exportFilename="membresias"
            loading={loading}
            emptyMessage="No se encontraron membresías"
            emptyState={
              <EmptyState
                icon={Users}
                title={
                  filtroEstado !== "todos" ? `Ningún ${labelSujeto.toLowerCase()} en este estado` : `Todavía no hay ${labelSujeto.toLowerCase()}s`
                }
                description={
                  filtroEstado !== "todos"
                    ? `Cambiá el filtro o registrá un ${labelSujeto.toLowerCase()} con un plan activo.`
                    : `Creá un plan y asociá el primer ${labelSujeto.toLowerCase()}. Después avisás cuotas por WhatsApp.`
                }
                actionLabel={filtroEstado !== "todos" ? "Ver todos" : "Nuevo plan"}
                onAction={
                  filtroEstado !== "todos"
                    ? () => setFiltroEstado("todos")
                    : () => setModalNuevo(true)
                }
              />
            }
            defaultPageSize={25}
            compact
          />
        </CardContent>
      </Card>

      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo plan de membresía</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input
                  value={formPlan.nombre}
                  onChange={(e) => setFormPlan({ ...formPlan, nombre: e.target.value })}
                  placeholder="Mensual Plus"
                  className="min-h-[40px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Precio *</Label>
                <Input
                  type="number"
                  value={formPlan.precio}
                  onChange={(e) => setFormPlan({ ...formPlan, precio: e.target.value })}
                  placeholder="15000"
                  className="min-h-[40px]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input
                value={formPlan.descripcion}
                onChange={(e) => setFormPlan({ ...formPlan, descripcion: e.target.value })}
                className="min-h-[40px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Periodicidad</Label>
                <Select
                  value={formPlan.periodicidad}
                  onValueChange={(v) => setFormPlan({ ...formPlan, periodicidad: v })}
                >
                  <SelectTrigger className="min-h-[40px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Duración (días)</Label>
                <Input
                  type="number"
                  value={formPlan.duracionDias}
                  onChange={(e) => setFormPlan({ ...formPlan, duracionDias: e.target.value })}
                  className="min-h-[40px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalNuevo(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void guardarPlan()} className="min-h-[40px]">
              Guardar plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CobrarDialog
        open={!!deudorActivo}
        onOpenChange={(v) => !v && setDeudorActivo(null)}
        deudor={deudorActivo}
        submitting={cobrando}
        onConfirm={handleCobrar}
      />
    </PageShell>
  )
}
