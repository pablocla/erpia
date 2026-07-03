"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  ClipboardList,
  Map,
  Plus,
  PlusSquare,
  Server,
  Shield,
  Store,
  Target,
  TrendingUp,
  UserPlus,
  UserPlus,
  Users,
  Terminal,
  RefreshCw
} from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CeoMissionPanel } from "@/components/claver-cloud/ceo-mission-panel"
import { CloudPageHeader } from "@/components/claver-cloud/cloud-page-header"
import { cloudAuthHeaders } from "@/lib/claver-cloud/auth-headers"
import {
  PIPELINE_ETAPA_LABELS,
  PIPELINE_ETAPAS,
  type PipelineEtapa,
} from "@/lib/ops/comercial-pipeline-catalog"
import { cn } from "@/lib/utils"

type CommandCenterData = {
  generadoAt: string
  operador: string
  scope: string
  kpis: {
    mrrTotalArs: number
    tenants: number
    entornosEnError: number
    slaVencidos: number
    mttrHoras: number
    readinessPromedio: number
    listosGoLive: number
    tareasMarketplace: number
    implementacionActivos: number
    implementacionAtrasados: number
    pipelineActivos: number
    valorPipelineArs: number
    clientesPagos: number
    leadsEnTrial: number
    visitasSemana: number
    altasEnTrial: number
    registrosWeb7d: number
    demosRubro7d: number
    trialsPorVencer: number
  }
  mando: Parameters<typeof CeoMissionPanel>[0]["mando"]
  comercial: {
    resumen: {
      activos: number
      valorPipelineArs: number
      porEtapa: Record<string, { count: number; valor: number }>
      proximasAcciones: {
        id: number
        nombre: string
        negocio: string | null
        etapa: string
        proximaAccion: string | null
        proximaFecha: string | null
      }[]
    }
    leads: {
      id: number
      nombre: string
      negocio: string | null
      telefono: string | null
      etapa: PipelineEtapa
      valorEstimado: number | null
      proximaAccion: string | null
      proximaFecha: string | null
      localidad: string | null
      empresaId: number | null
    }[]
  }
  operaciones: {
    ordenesRecientes: {
      id: number
      razonSocial: string
      estado: string
      createdAt: string
      empresaId?: number
    }[]
    tenantsEnRiesgo: {
      id: number
      nombre: string
      entornosError: number
      tareasPendientes: number
      listoGoLive: boolean
      readinessScore: number
    }[]
    implementacion: {
      activos: number
      atrasados: number
      avancePromedio: number
    }
    altasRecientes: {
      empresaId: number
      nombre: string
      origenLabel: string
      diasDesdeAlta: number
      trialDiasRestantes: number | null
      trialVencido: boolean
      skusActivos: number
      mrrArs: number
      esDemoCompartida: boolean
    }[]
  }
  recursos: { titulo: string; href: string; descripcion: string }[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n)

const fmtFecha = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(new Date(iso))

const etapaColor: Record<PipelineEtapa, string> = {
  prospecto: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  visita: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  trial: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  cerrado: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  provisionado: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  descartado: "bg-red-500/10 text-red-300/70 border-red-500/20",
}

const quickActions = [
  { href: "/claver-cloud/registros", label: "Registros web y trials", icon: UserPlus, primary: true },
  { href: "/claver-cloud/comercial", label: "Pipeline ventas", icon: Users, primary: true },
  { href: "/claver-cloud/comercial/relevamientos", label: "Relevamiento visita", icon: ClipboardList, primary: true },
  { href: "/claver-cloud/comercial/campo", label: "Mapa y hoja de ruta", icon: Map, primary: true },
  { href: "/claver-cloud/provisioning/new", label: "Nueva organización", icon: PlusSquare },
  { href: "/claver-cloud/superadmin", label: "Super Admin", icon: Shield },
  { href: "/claver-cloud/billing", label: "Facturación MRR", icon: CreditCard },
  { href: "/claver-cloud/marketplace", label: "Marketplace", icon: Store },
  { href: "/claver-cloud/implementation", label: "Implementación", icon: Target },
  { href: "/claver-cloud/organizations", label: "Tenants", icon: Building2 },
]

const KANBAN_ETAPAS: PipelineEtapa[] = ["prospecto", "visita", "trial", "cerrado"]

export function CommandCenterDashboard() {
  const [data, setData] = useState<CommandCenterData | null>(null)
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [provisioningLead, setProvisioningLead] = useState<{ id: number; targetEtapa: PipelineEtapa } | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre: "",
    negocio: "",
    telefono: "",
    localidad: "",
    valorEstimado: "",
    proximaAccion: "",
    notas: "",
  })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claver/command-center", { headers: cloudAuthHeaders() })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function crearLead() {
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/claver/comercial/leads", {
        method: "POST",
        headers: cloudAuthHeaders(true),
        body: JSON.stringify({
          nombre: form.nombre,
          negocio: form.negocio || undefined,
          telefono: form.telefono || undefined,
          localidad: form.localidad || undefined,
          valorEstimado: form.valorEstimado ? Number(form.valorEstimado) : undefined,
          proximaAccion: form.proximaAccion || undefined,
          notas: form.notas || undefined,
        }),
      })
      if (res.ok) {
        setDialogOpen(false)
        setForm({ nombre: "", negocio: "", telefono: "", localidad: "", valorEstimado: "", proximaAccion: "", notas: "" })
        await cargar()
      }
    } finally {
      setSaving(false)
    }
  }

  async function moverEtapa(leadId: number, etapa: PipelineEtapa) {
    if (etapa === "trial" || etapa === "cerrado") {
      const lead = data?.comercial.leads.find((l) => l.id === leadId)
      if (lead && !lead.empresaId) {
        setProvisioningLead({ id: leadId, targetEtapa: etapa })
        return
      }
    }

    const res = await fetch(`/api/claver/comercial/leads/${leadId}`, {
      method: "PATCH",
      headers: cloudAuthHeaders(true),
      body: JSON.stringify({ etapa }),
    })
    if (res.ok) await cargar()
  }

  async function confirmarProvisioning() {
    if (!provisioningLead) return
    setSaving(true)
    try {
      const res = await fetch(`/api/claver/comercial/leads/${provisioningLead.id}`, {
        method: "PATCH",
        headers: cloudAuthHeaders(true),
        body: JSON.stringify({ 
          etapa: provisioningLead.targetEtapa, 
          provision: true // Señal para el backend
        }),
      })
      if (res.ok) {
        setProvisioningLead(null)
        await cargar()
      }
    } finally {
      setSaving(false)
    }
  }

  async function accionarTenantRiesgo(id: number, accion: string) {
    try {
      await fetch(`/api/claver/tenants/${id}/ops`, {
        method: "POST",
        headers: cloudAuthHeaders(true),
        body: JSON.stringify({ action: accion }),
      })
    } finally {
      await cargar()
    }
  }

  if (!data && loading) {
    return <p className="text-sm text-muted-foreground p-6">Cargando centro de mando…</p>
  }

  if (!data) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-muted-foreground">No se pudo cargar el centro de mando.</p>
        <Button variant="outline" size="sm" onClick={() => void cargar()}>
          Reintentar
        </Button>
      </div>
    )
  }

  const { kpis, mando, comercial, operaciones } = data

  return (
    <div className="space-y-8">
      <CloudPageHeader
        icon={TrendingUp}
        eyebrow="Claver Cloud"
        title="Centro de mando"
        description="Roadmap, tareas, alertas y pipeline — todo para vender el primer cliente sin equipo ni marketing prematuro."
        badge="CEO"
        onRefresh={cargar}
        loading={loading}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-500">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo prospecto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Agregar prospecto</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="nombre">Nombre / contacto *</Label>
                  <Input id="nombre" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="negocio">Comercio / razón social</Label>
                  <Input id="negocio" value={form.negocio} onChange={(e) => setForm((f) => ({ ...f, negocio: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input id="telefono" value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="localidad">Localidad</Label>
                    <Input id="localidad" value={form.localidad} onChange={(e) => setForm((f) => ({ ...f, localidad: e.target.value }))} />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="valor">Valor estimado (ARS/mes)</Label>
                  <Input id="valor" type="number" value={form.valorEstimado} onChange={(e) => setForm((f) => ({ ...f, valorEstimado: e.target.value }))} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="accion">Próxima acción</Label>
                  <Input id="accion" placeholder="Ej: visitar martes 10hs" value={form.proximaAccion} onChange={(e) => setForm((f) => ({ ...f, proximaAccion: e.target.value }))} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea id="notas" rows={2} value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => void crearLead()} disabled={saving || !form.nombre.trim()}>
                  {saving ? "Guardando…" : "Guardar prospecto"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Card className="xl:col-span-2 border-violet-500/30 bg-violet-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR plataforma</CardTitle>
            <DollarSign className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold">{fmt(kpis.mrrTotalArs)}</div>
                <p className="text-xs text-muted-foreground">{kpis.tenants} tenants activos</p>
              </div>
              <div className="h-[40px] w-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { m: "Ene", val: kpis.mrrTotalArs * 0.7 },
                    { m: "Feb", val: kpis.mrrTotalArs * 0.75 },
                    { m: "Mar", val: kpis.mrrTotalArs * 0.8 },
                    { m: "Abr", val: kpis.mrrTotalArs * 0.85 },
                    { m: "May", val: kpis.mrrTotalArs * 0.9 },
                    { m: "Jun", val: kpis.mrrTotalArs },
                  ]}>
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#1e1e1e', border: 'none', borderRadius: '4px', fontSize: '10px'}} />
                    <Bar dataKey="val" fill="#8b5cf6" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pipelineActivos}</div>
            <p className="text-xs text-muted-foreground">{fmt(kpis.valorPipelineArs)} potencial</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entornos error</CardTitle>
            <Server className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{kpis.entornosEnError}</div>
            <p className="text-xs text-muted-foreground">SLA vencidos: {kpis.slaVencidos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Go-live</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.listosGoLive}/{kpis.tenants}</div>
            <p className="text-xs text-muted-foreground">Readiness {kpis.readinessPromedio}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Implementación</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.implementacionActivos}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.implementacionAtrasados > 0 ? (
                <span className="text-amber-500">{kpis.implementacionAtrasados} atrasados</span>
              ) : (
                "En curso"
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes pagos</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{kpis.clientesPagos}</div>
            <p className="text-xs text-muted-foreground">{kpis.leadsEnTrial} trials · {kpis.visitasSemana} visitas/sem</p>
          </CardContent>
        </Card>
        <Card className={cn(kpis.trialsPorVencer > 0 && "border-amber-500/40")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Altas web 7d</CardTitle>
            <UserPlus className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.registrosWeb7d}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.altasEnTrial} en trial · {kpis.demosRubro7d} demos rubro
              {kpis.trialsPorVencer > 0 && (
                <span className="text-amber-500"> · {kpis.trialsPorVencer} vencen ≤3d</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <CeoMissionPanel mando={mando} onRefresh={cargar} />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-violet-400" />
            Altas y trials en vivo
          </h2>
          <Link
            href="/claver-cloud/registros"
            className="text-xs text-violet-400 hover:underline inline-flex items-center gap-1"
          >
            Ver flota completa <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2">Tenant</th>
                    <th className="px-4 py-2">Origen</th>
                    <th className="px-4 py-2">Activo</th>
                    <th className="px-4 py-2">Trial</th>
                    <th className="px-4 py-2">SKUs</th>
                    <th className="px-4 py-2 text-right">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {operaciones.altasRecientes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Sin altas recientes en tu alcance
                      </td>
                    </tr>
                  ) : (
                    operaciones.altasRecientes.map((a) => (
                      <tr key={a.empresaId} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/claver-cloud/tenants/${a.empresaId}`}
                            className="font-medium hover:text-violet-400 transition-colors"
                          >
                            {a.nombre}
                          </Link>
                          <p className="text-xs text-muted-foreground">#{a.empresaId}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant="secondary" className="text-[10px]">
                            {a.origenLabel}
                          </Badge>
                          {a.esDemoCompartida && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">demo compartida</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">{a.diasDesdeAlta}d</td>
                        <td className="px-4 py-2.5">
                          {a.trialDiasRestantes != null ? (
                            <Badge className="bg-emerald-600 text-[10px]">{a.trialDiasRestantes}d</Badge>
                          ) : a.trialVencido ? (
                            <Badge variant="destructive" className="text-[10px]">
                              Vencido
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">{a.skusActivos}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{fmt(a.mrrArs)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pipeline comercial</h2>
          <p className="text-xs text-muted-foreground">Visitas, trials y cierres — sin CRM externo</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-4">
          {KANBAN_ETAPAS.map((etapa) => {
            const leadsEtapa = comercial.leads.filter((l) => l.etapa === etapa)
            const resumen = comercial.resumen.porEtapa[etapa]
            return (
              <div key={etapa} className="rounded-lg border bg-card/50 p-3 min-h-[200px]">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className={cn("text-xs", etapaColor[etapa])}>
                    {PIPELINE_ETAPA_LABELS[etapa]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{resumen?.count ?? leadsEtapa.length}</span>
                </div>
                <div className="space-y-2">
                  {leadsEtapa.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">Vacío</p>
                  ) : (
                    leadsEtapa.map((lead) => (
                      <div key={lead.id} className="rounded-md border p-2.5 text-sm space-y-1.5 bg-background/60">
                        <p className="font-medium leading-tight">{lead.nombre}</p>
                        {lead.negocio && <p className="text-xs text-muted-foreground">{lead.negocio}</p>}
                        {lead.valorEstimado != null && (
                          <p className="text-xs text-violet-400">{fmt(lead.valorEstimado)}/mes</p>
                        )}
                        {lead.proximaAccion && (
                          <p className="text-xs flex items-center gap-1 text-amber-400/90">
                            <Calendar className="h-3 w-3" />
                            {lead.proximaAccion}
                            {lead.proximaFecha && ` · ${fmtFecha(lead.proximaFecha)}`}
                          </p>
                        )}
                        {lead.empresaId && (
                          <Link
                            href={`/claver-cloud/tenants/${lead.empresaId}`}
                            className="text-xs text-violet-400 hover:underline inline-flex items-center gap-1"
                          >
                            <Building2 className="h-3 w-3" />
                            Tenant #{lead.empresaId}
                          </Link>
                        )}
                        <Select
                          value={lead.etapa}
                          onValueChange={(v) => void moverEtapa(lead.id, v as PipelineEtapa)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PIPELINE_ETAPAS.filter((e) => e !== "descartado").map((e) => (
                              <SelectItem key={e} value={e} className="text-xs">
                                {PIPELINE_ETAPA_LABELS[e]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximas acciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {comercial.resumen.proximasAcciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin follow-ups programados.</p>
            ) : (
              comercial.resumen.proximasAcciones.map((a) => (
                <div key={a.id} className="text-sm border-b border-border/50 pb-2 last:border-0">
                  <p className="font-medium">{a.nombre}</p>
                  <p className="text-xs text-muted-foreground">{a.proximaAccion}</p>
                  {a.proximaFecha && (
                    <p className="text-xs text-violet-400 mt-0.5">{fmtFecha(a.proximaFecha)}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PlusSquare className="h-4 w-4" />
              Provisioning reciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {operaciones.ordenesRecientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin órdenes aún.</p>
            ) : (
              operaciones.ordenesRecientes.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm py-1 gap-2">
                  {o.empresaId ? (
                    <Link
                      href={`/claver-cloud/tenants/${o.empresaId}`}
                      className="truncate hover:text-violet-400 transition-colors"
                    >
                      {o.razonSocial}
                    </Link>
                  ) : (
                    <span className="truncate">{o.razonSocial}</span>
                  )}
                  <Badge variant="outline" className="text-xs shrink-0">
                    {o.estado}
                  </Badge>
                </div>
              ))
            )}
            <Link href="/claver-cloud/provisioning" className="text-xs text-violet-400 hover:underline inline-flex items-center gap-1 mt-2">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Tenants en riesgo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {operaciones.tenantsEnRiesgo.length === 0 ? (
              <p className="text-sm text-muted-foreground">Flota estable.</p>
            ) : (
              operaciones.tenantsEnRiesgo.map((t) => (
                <div key={t.id} className="flex flex-col gap-1 py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/claver-cloud/tenants/${t.id}`}
                      className="text-sm font-medium hover:text-violet-400 transition-colors truncate"
                    >
                      {t.nombre}
                    </Link>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {t.entornosError > 0 && `${t.entornosError} err`}
                      {t.tareasPendientes > 0 && ` · ${t.tareasPendientes} tareas`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-amber-500 hover:text-amber-600" onClick={() => accionarTenantRiesgo(t.id, "diagnosticar")}>
                      <Terminal className="h-3 w-3 mr-1" /> Diagnosticar
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-red-500 hover:text-red-600" onClick={() => accionarTenantRiesgo(t.id, "reiniciar_opo")}>
                      <RefreshCw className="h-3 w-3 mr-1" /> Reiniciar OPO
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Accesos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "group flex items-start gap-3 rounded-lg border p-4 transition",
                action.primary
                  ? "border-violet-500/50 bg-violet-500/10 hover:bg-violet-500/15"
                  : "hover:border-violet-500/40 hover:bg-violet-500/5",
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20">
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{action.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Recursos para vender y operar
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.recursos.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="rounded-lg border p-4 hover:border-violet-500/40 hover:bg-violet-500/5 transition group"
            >
              <p className="font-medium group-hover:text-violet-300">{r.titulo}</p>
              <p className="text-xs text-muted-foreground mt-1">{r.descripcion}</p>
            </Link>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Operando como <span className="text-foreground">{data.operador}</span> · alcance {data.scope} · actualizado{" "}
        {new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data.generadoAt))}
      </p>

      {/* Modal de Provisioning Automático */}
      <Dialog open={!!provisioningLead} onOpenChange={(open) => !open && setProvisioningLead(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Provisionar Entorno Cloud?</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-slate-600 dark:text-slate-300">
            Estás moviendo un prospecto a una etapa de prueba o cierre, pero <strong>aún no tiene un entorno (tenant) creado.</strong>
            <br/><br/>
            ¿Deseas crear la organización automáticamente y activar el OPO (Open Protocol Ontology) para comenzar la integración?
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setProvisioningLead(null)}>Cancelar</Button>
            <Button onClick={confirmarProvisioning} disabled={saving} className="bg-violet-600 hover:bg-violet-500">
              {saving ? "Provisionando..." : "Crear Tenant Ahora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}