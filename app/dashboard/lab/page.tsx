"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Compass,
  Scale,
  MapPin,
  Target,
  Newspaper,
  ShieldAlert,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Circle,
  Plus,
  Copy,
  Check,
  Bot,
  Users,
  Sparkles,
  Zap,
  Building2,
  Phone,
  Flame,
  ArrowRight,
  RefreshCw,
  Award,
  Layers,
  ChevronRight,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageShell, PageHeader, KpiStrip } from "@/components/layout"
import { useToast } from "@/hooks/use-toast"
import { formatARS } from "@/lib/format/currency"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores"
import type {
  LabLeadItem,
  LabMissionItem,
  LabRegulationItem,
  LabMilestoneItem,
} from "@/lib/lab/lab-service"

export default function ClaverLabPage() {
  const { toast } = useToast()
  const [selectedZona, setSelectedZona] = useState<string>("todas")
  const [copiadoId, setCopiadoId] = useState<string | null>(null)
  const [aiInsight, setAiInsight] = useState<string>("")
  const [loadingAi, setLoadingAi] = useState<boolean>(false)
  const [dialogAddLeadOpen, setDialogAddLeadOpen] = useState<boolean>(false)

  // Remote / local state
  const { data, mutate } = useAuthFetch<{
    ok: boolean
    metricas: {
      mrrActual: number
      pipelinePotencial: number
      leadsTotal: number
      demosActivas: number
      metaMes: number
      progresoMeta: number
      burnRate: number
      runwayMeses: string
    }
    leads: LabLeadItem[]
    misiones: LabMissionItem[]
    regulaciones: LabRegulationItem[]
    hitoss: LabMilestoneItem[]
  }>("/api/lab")

  const [newLeadForm, setNewLeadForm] = useState({
    nombre: "",
    direccion: "",
    zona: "Echesortu",
    rubro: "Almacén",
    productoTarget: "Fiado + Leo Cobranza",
    mrrEstimado: "19900",
    telefono: "",
  })

  // Handlers
  const handleToggleMision = async (missionId: string) => {
    try {
      const res = await authFetch("/api/lab", {
        method: "POST",
        body: JSON.stringify({ action: "toggle_mission", missionId }),
      })
      if (res.ok) {
        mutate()
        toast({ title: "Misión actualizada", description: "Estado guardado correctamente" })
      }
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar la misión", variant: "destructive" })
    }
  }

  const handleUpdateLeadStatus = async (leadId: string, estado: string) => {
    try {
      const res = await authFetch("/api/lab", {
        method: "POST",
        body: JSON.stringify({ action: "update_lead_status", leadId, estado }),
      })
      if (res.ok) {
        mutate()
        toast({ title: "Lead actualizado", description: `Estado cambiado a ${estado}` })
      }
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar el lead", variant: "destructive" })
    }
  }

  const handleAddLead = async () => {
    if (!newLeadForm.nombre) {
      toast({ title: "Atención", description: "Ingresá al menos el nombre del comercio", variant: "destructive" })
      return
    }
    try {
      const res = await authFetch("/api/lab", {
        method: "POST",
        body: JSON.stringify({ action: "add_lead", lead: newLeadForm }),
      })
      if (res.ok) {
        mutate()
        setDialogAddLeadOpen(false)
        setNewLeadForm({
          nombre: "",
          direccion: "",
          zona: "Echesortu",
          rubro: "Almacén",
          productoTarget: "Fiado + Leo Cobranza",
          mrrEstimado: "19900",
          telefono: "",
        })
        toast({ title: "Prospecto agregado", description: "Lead incorporado al mapa comercial" })
      }
    } catch {
      toast({ title: "Error", description: "No se pudo agregar el lead", variant: "destructive" })
    }
  }

  const handleCopiarArgumento = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto)
    setCopiadoId(id)
    toast({ title: "Argumento copiado", description: "Listo para enviar por WhatsApp o decir en la reunión" })
    setTimeout(() => setCopiadoId(null), 2000)
  }

  const handleConsultarGemini = async () => {
    setLoadingAi(true)
    try {
      const res = await authFetch("/api/lab", {
        method: "POST",
        body: JSON.stringify({ action: "generate_ai_insight" }),
      })
      if (res.ok) {
        const json = await res.json()
        setAiInsight(json.insight)
      }
    } catch {
      toast({ title: "Error", description: "No se pudo conectar con Gemini API", variant: "destructive" })
    } finally {
      setLoadingAi(false)
    }
  }

  const metricas = data?.metricas || {
    mrrActual: 0,
    pipelinePotencial: 124600,
    leadsTotal: 6,
    demosActivas: 3,
    metaMes: 60000,
    progresoMeta: 0,
    burnRate: 0,
    runwayMeses: "Infinito",
  }

  const leads = data?.leads || []
  const misiones = data?.misiones || []
  const regulaciones = data?.regulaciones || []
  const hitos = data?.hitoss || []

  const leadsFiltrados = selectedZona === "todas" ? leads : leads.filter((l) => l.zona === selectedZona)
  const misionesCompletadas = misiones.filter((m) => m.completada).length

  return (
    <PageShell>
      <PageHeader
        variant="surface"
        title="Claver Lab — Centro de Inteligencia Operativa"
        description="Tablero estratégico del fundador: radar comercial de Rosario, regulaciones y misiones diarias"
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400">
            <Compass className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "12s" }} />
            Founder Command Center
          </span>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleConsultarGemini} disabled={loadingAi}>
              <Sparkles className="h-4 w-4 mr-2 text-violet-400" />
              {loadingAi ? "Analizando..." : "Diagnóstico Gemini"}
            </Button>
            <Dialog open={dialogAddLeadOpen} onOpenChange={setDialogAddLeadOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Prospecto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Agregar Lead al Mapa de Rosario</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lead-nombre">Nombre del Comercio *</Label>
                    <Input
                      id="lead-nombre"
                      placeholder="Ej: Kiosco La Esquina"
                      value={newLeadForm.nombre}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, nombre: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lead-direccion">Dirección</Label>
                    <Input
                      id="lead-direccion"
                      placeholder="Ej: Bv. Oroño 1240"
                      value={newLeadForm.direccion}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, direccion: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Zona Rosario</Label>
                      <Select
                        value={newLeadForm.zona}
                        onValueChange={(val) => setNewLeadForm({ ...newLeadForm, zona: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Echesortu">Echesortu</SelectItem>
                          <SelectItem value="Pellegrini">Pellegrini</SelectItem>
                          <SelectItem value="Pichincha">Pichincha</SelectItem>
                          <SelectItem value="Peatonal Córdoba">Peatonal Córdoba</SelectItem>
                          <SelectItem value="Fisherton">Fisherton</SelectItem>
                          <SelectItem value="Arroyito">Arroyito</SelectItem>
                          <SelectItem value="Zona Sur">Zona Sur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Rubro</Label>
                      <Select
                        value={newLeadForm.rubro}
                        onValueChange={(val) => setNewLeadForm({ ...newLeadForm, rubro: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Almacén">Almacén</SelectItem>
                          <SelectItem value="Kiosco">Kiosco</SelectItem>
                          <SelectItem value="Gastronomía">Gastronomía</SelectItem>
                          <SelectItem value="Indumentaria">Indumentaria</SelectItem>
                          <SelectItem value="Servicios">Servicios</SelectItem>
                          <SelectItem value="Autoservicio">Autoservicio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="lead-mrr">MRR ARS/mes</Label>
                      <Input
                        id="lead-mrr"
                        type="number"
                        value={newLeadForm.mrrEstimado}
                        onChange={(e) => setNewLeadForm({ ...newLeadForm, mrrEstimado: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lead-tel">Teléfono / WA</Label>
                      <Input
                        id="lead-tel"
                        placeholder="341..."
                        value={newLeadForm.telefono}
                        onChange={(e) => setNewLeadForm({ ...newLeadForm, telefono: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={handleAddLead} className="w-full bg-emerald-600 hover:bg-emerald-500">
                  Guardar en el Mapa
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* KPI Strip Principal */}
      <KpiStrip
        items={[
          { label: "MRR Recurrente", value: formatARS(metricas.mrrActual), icon: DollarSign },
          { label: "Pipeline Potencial", value: formatARS(metricas.pipelinePotencial), icon: TrendingUp },
          { label: "Demos / Trials Activos", value: metricas.demosActivas, icon: Zap },
          { label: "Misiones del Día", value: `${misionesCompletadas}/${misiones.length}`, icon: Target },
        ]}
      />

      {/* Cerebro Gemini Banner si hay respuesta */}
      <AnimatePresence>
        {aiInsight && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-transparent p-4"
          >
            <div className="flex items-start gap-3">
              <Bot className="h-5 w-5 text-violet-400 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm space-y-1">
                <h4 className="font-semibold text-violet-300 flex items-center gap-2">
                  Recomendación Inteligente — Cerebro Gemini
                </h4>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{aiInsight}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAiInsight("")} className="text-xs">
                Cerrar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Principal de Mosaicos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Mosaico 1: Misiones Diarias del CEO */}
        <Card className="lg:col-span-1 border-emerald-500/20 bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-500" />
                Misiones del Día (CEO Daily Quests)
              </CardTitle>
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                {misionesCompletadas}/{misiones.length} hechas
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Acciones tácticas de alto impacto para mover la aguja hoy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {misiones.map((mision) => (
              <div
                key={mision.id}
                onClick={() => handleToggleMision(mision.id)}
                className={`flex items-start gap-3 rounded-lg border p-2.5 transition-all cursor-pointer hover:border-emerald-500/40 ${
                  mision.completada ? "bg-muted/40 opacity-70" : "bg-background"
                }`}
              >
                {mision.completada ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium ${mision.completada ? "line-through text-muted-foreground" : ""}`}
                    >
                      {mision.titulo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {mision.categoria}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{mision.impacto}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Mosaico 2: Mapa & Prospectos Rosario */}
        <Card className="lg:col-span-2 border-sky-500/20 bg-card">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sky-500" />
                  Mapa de Prospectos & Leads (Rosario)
                </CardTitle>
                <CardDescription className="text-xs">
                  {leadsFiltrados.length} comercios detectados en radar comercial
                </CardDescription>
              </div>
              <Select value={selectedZona} onValueChange={setSelectedZona}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Zona Rosario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las Zonas</SelectItem>
                  <SelectItem value="Echesortu">Echesortu</SelectItem>
                  <SelectItem value="Pellegrini">Pellegrini</SelectItem>
                  <SelectItem value="Peatonal Córdoba">Peatonal Córdoba</SelectItem>
                  <SelectItem value="Fisherton">Fisherton</SelectItem>
                  <SelectItem value="Arroyito">Arroyito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {leadsFiltrados.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-lg border bg-background p-3 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-medium text-xs flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {lead.nombre}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">{lead.direccion}</p>
                    </div>
                    <Badge
                      className={
                        lead.estado === "cliente"
                          ? "bg-emerald-600 text-white"
                          : lead.estado === "demo_agendada" || lead.estado === "trial_activo"
                          ? "bg-amber-600 text-white"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {lead.estado.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-muted/50">
                    <span className="font-medium text-sky-400">{lead.productoTarget}</span>
                    <span className="font-semibold text-emerald-400">{formatARS(lead.mrrEstimado)}/mes</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Select
                      value={lead.estado}
                      onValueChange={(val) => handleUpdateLeadStatus(lead.id, val)}
                    >
                      <SelectTrigger className="h-7 text-[10px] w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="frio">Frío</SelectItem>
                        <SelectItem value="contactado">Contactado</SelectItem>
                        <SelectItem value="demo_agendada">Demo Agendada</SelectItem>
                        <SelectItem value="trial_activo">Trial Activo</SelectItem>
                        <SelectItem value="cliente">Cliente Pago</SelectItem>
                        <SelectItem value="perdido">Perdido</SelectItem>
                      </SelectContent>
                    </Select>

                    {lead.telefono && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <a
                          href={`https://wa.me/549${lead.telefono}?text=${encodeURIComponent(
                            `Hola ${lead.nombre}, te contacto de Claver para mostrarte ${lead.productoTarget}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          WhatsApp
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mosaico 3: Radar Regulatorio & Argumentos de Venta */}
        <Card className="lg:col-span-2 border-amber-500/20 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Scale className="h-4 w-4 text-amber-500" />
              Radar Regulatorio & Argumentos de Venta (Compliance AFIP / Rosario)
            </CardTitle>
            <CardDescription className="text-xs">
              Normativas oficiales convertidas en razones de compra inmediata para el cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {regulaciones.map((reg) => (
              <div key={reg.id} className="rounded-lg border bg-background p-3 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
                      {reg.jurisdiccion}
                    </Badge>
                    <span className="text-[10px] font-mono text-muted-foreground">{reg.queExige.slice(0, 30)}...</span>
                  </div>
                  <h4 className="font-semibold text-xs text-amber-300">{reg.normativa}</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{reg.queExige}</p>
                </div>
                <div className="rounded bg-muted/50 p-2 text-[11px] space-y-1 border border-muted">
                  <p className="font-medium text-emerald-400">💡 Argumento de venta:</p>
                  <p className="text-muted-foreground italic">"{reg.argumentoVenta}"</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] w-full mt-1 text-sky-400 hover:text-sky-300"
                    onClick={() => handleCopiarArgumento(reg.id, reg.argumentoVenta)}
                  >
                    {copiadoId === reg.id ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-emerald-400" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" /> Copiar texto de venta
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Mosaico 4: Roadmap Estratégico & Hitos */}
        <Card className="lg:col-span-1 border-purple-500/20 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              Roadmap Estratégico & Hitos
            </CardTitle>
            <CardDescription className="text-xs">
              Evolución del negocio paso a paso hacia la escala
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hitos.map((hito) => (
              <div
                key={hito.id}
                className={`rounded-lg border p-2.5 space-y-1 text-xs ${
                  hito.completado
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : hito.id === "fase-1"
                    ? "border-purple-500/40 bg-purple-500/10"
                    : "bg-background opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">{hito.fase}: {hito.titulo}</span>
                  {hito.completado ? (
                    <Badge className="bg-emerald-600 text-[10px]">Completado</Badge>
                  ) : hito.id === "fase-1" ? (
                    <Badge className="bg-purple-600 text-[10px]">En Curso</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Pendiente</Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{hito.descripcion}</p>
                <div className="pt-1 text-[10px] text-purple-400 font-mono">
                  ★ Hito: {hito.hitoSalida}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Mosaico 5: Panel de Equipo & Hiring Readiness */}
        <Card className="lg:col-span-1 border-rose-500/20 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-rose-500" />
              Cerebro de Equipo & Hiring Readiness
            </CardTitle>
            <CardDescription className="text-xs">
              Umbrales objetivos para decidir contrataciones sin intuición
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="rounded-lg border bg-background p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">1er Vendedor Part-time</span>
                <Badge variant="outline" className="text-[10px] text-emerald-400">Solo Founder (Óptimo)</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Disparador: Pipeline &gt; 30 leads fríos acumulados sin contactar.
              </p>
              <Progress value={20} className="h-1.5 bg-muted" />
            </div>

            <div className="rounded-lg border bg-background p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">Soporte L1 Part-time</span>
                <Badge variant="outline" className="text-[10px] text-emerald-400">No Requerido</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Disparador: &gt; 15 tickets semanales sin resolver en 24hs.
              </p>
              <Progress value={5} className="h-1.5 bg-muted" />
            </div>
          </CardContent>
        </Card>

        {/* Mosaico 6: Contexto Local & Señales Rosario */}
        <Card className="lg:col-span-2 border-indigo-500/20 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-indigo-500" />
              Contexto Comercial & Señales del Mercado (Rosario)
            </CardTitle>
            <CardDescription className="text-xs">
              Indicadores locales y coyuntura para adaptar la estrategia de ventas
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-lg border bg-background p-3 space-y-1">
              <span className="text-muted-foreground text-[10px]">IPC Rosario (Junio)</span>
              <p className="text-lg font-bold text-indigo-400">+2.1%</p>
              <p className="text-[10px] text-muted-foreground">
                Incentiva el uso del actualizador de listas de precio.
              </p>
            </div>

            <div className="rounded-lg border bg-background p-3 space-y-1">
              <span className="text-muted-foreground text-[10px]">Evento Local Próximo</span>
              <p className="text-sm font-semibold text-indigo-300">Noche de Peatonales</p>
              <p className="text-[10px] text-muted-foreground">
                15 de Agosto · Oportunidad para prospectar comercios del centro.
              </p>
            </div>

            <div className="rounded-lg border bg-background p-3 space-y-1">
              <span className="text-muted-foreground text-[10px]">Densidad de Mercado</span>
              <p className="text-sm font-semibold text-emerald-400">340 Almacenes s/Soft</p>
              <p className="text-[10px] text-muted-foreground">
                Estimado en Echesortu, Barrio Martin y Pellegrini.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
