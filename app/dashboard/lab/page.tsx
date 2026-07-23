"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Compass,
  Scale,
  MapPin,
  Target,
  Newspaper,
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
  ArrowRight,
  Award,
  Layers,
  BookOpen,
  HandCoins,
  Search,
  Filter,
  Flame,
  Loader2,
  ExternalLink,
  MessageCircle,
  Rocket,
  type LucideIcon,
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
import { cn } from "@/lib/utils"
import type {
  LabLeadItem,
  LabDashboardPayload,
  LabNextAction,
} from "@/lib/lab/lab-types"
import { buildWaMessage } from "@/lib/lab/lab-messages"

const ZONAS = [
  "todas",
  "Echesortu",
  "Pellegrini",
  "Pichincha",
  "Peatonal Córdoba",
  "Fisherton",
  "Arroyito",
  "Zona Sur",
] as const

const ESTADOS = [
  { value: "todos", label: "Todos" },
  { value: "frio", label: "Frío" },
  { value: "contactado", label: "Contactado" },
  { value: "demo_agendada", label: "Demo" },
  { value: "trial_activo", label: "Trial" },
  { value: "cliente", label: "Cliente" },
  { value: "perdido", label: "Perdido" },
] as const

const ESTADO_STYLE: Record<string, string> = {
  frio: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30",
  contactado: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  demo_agendada: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  trial_activo: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  cliente: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  perdido: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
}

const ESTADO_LABEL: Record<string, string> = {
  frio: "Frío",
  contactado: "Contactado",
  demo_agendada: "Demo",
  trial_activo: "Trial",
  cliente: "Cliente",
  perdido: "Perdido",
}

const QUICK_LINKS: { href: string; label: string; icon: LucideIcon; hint: string }[] = [
  {
    href: "/dashboard/documentacion",
    label: "Claver Docs",
    icon: BookOpen,
    hint: "Flujos y requisitos",
  },
  {
    href: "/dashboard/fiado",
    label: "Fiado",
    icon: HandCoins,
    hint: "Demo libreta",
  },
  {
    href: "/dashboard/empleados-digitales",
    label: "Leo",
    icon: Bot,
    hint: "Cobranza WA",
  },
  {
    href: "/dashboard/documentacion/room/flujo-fiado-leo",
    label: "Pitch fiado+Leo",
    icon: MessageCircle,
    hint: "Cómo se vende",
  },
]

function estadoHuman(estado: string) {
  return ESTADO_LABEL[estado] ?? estado.replaceAll("_", " ")
}

export default function ClaverLabPage() {
  const { toast } = useToast()
  const [selectedZona, setSelectedZona] = useState<string>("todas")
  const [selectedEstado, setSelectedEstado] = useState<string>("todos")
  const [searchLead, setSearchLead] = useState("")
  const [copiadoId, setCopiadoId] = useState<string | null>(null)
  const [aiInsight, setAiInsight] = useState("")
  const [loadingAi, setLoadingAi] = useState(false)
  const [dialogAddLeadOpen, setDialogAddLeadOpen] = useState(false)
  const [busyMission, setBusyMission] = useState<string | null>(null)

  const { data, mutate, isLoading, error } = useAuthFetch<LabDashboardPayload>("/api/lab")
  const [waVariant, setWaVariant] = useState<"A" | "B">("A")

  const [newLeadForm, setNewLeadForm] = useState({
    nombre: "",
    direccion: "",
    zona: "Echesortu",
    rubro: "Almacén",
    productoTarget: "Fiado + Leo Cobranza",
    mrrEstimado: "19900",
    telefono: "",
  })

  const metricas = data?.metricas ?? {
    mrrActual: 0,
    pipelinePotencial: 0,
    leadsTotal: 0,
    demosActivas: 0,
    metaMes: 60000,
    progresoMeta: 0,
    burnRate: 0,
    runwayMeses: "—",
    scorePromedio: 0,
    clientes: 0,
    frios: 0,
  }

  const leads = data?.leads ?? []
  const misiones = data?.misiones ?? []
  const hitos = data?.hitoss ?? []
  const funnel = data?.funnel ?? []
  const pitchPacks = data?.pitchPacks ?? []
  const productSignals = data?.productSignals
  const eventos = data?.eventos ?? []
  const waLogs = data?.waLogs ?? []
  const serverNext: LabNextAction | null = data?.nextAction ?? null

  const misionesCompletadas = misiones.filter((m) => m.completada).length
  const misionesPct = misiones.length ? Math.round((misionesCompletadas / misiones.length) * 100) : 0

  const leadsFiltrados = useMemo(() => {
    const q = searchLead.trim().toLowerCase()
    return leads
      .filter((l) => selectedZona === "todas" || l.zona === selectedZona)
      .filter((l) => selectedEstado === "todos" || l.estado === selectedEstado)
      .filter(
        (l) =>
          !q ||
          l.nombre.toLowerCase().includes(q) ||
          l.direccion.toLowerCase().includes(q) ||
          l.productoTarget.toLowerCase().includes(q) ||
          l.rubro.toLowerCase().includes(q),
      )
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  }, [leads, selectedZona, selectedEstado, searchLead])

  const nextLead = serverNext?.leadId
    ? leads.find((l) => l.id === serverNext.leadId) ?? null
    : null

  const nextAction = {
    title: serverNext?.title ?? "Cargando…",
    detail: serverNext?.detail ?? "",
    lead: nextLead,
  }

  const friosSinContactar = leads.filter((l) => l.estado === "frio").length
  const hiringVendedor = {
    ready: friosSinContactar >= 8,
    pct: Math.min(100, Math.round((friosSinContactar / 30) * 100)),
    label:
      friosSinContactar >= 30
        ? "Listo para contratar"
        : friosSinContactar >= 8
          ? "Casi: seguí calentando pipeline"
          : "Todavía founder-only",
  }
  const clientes = leads.filter((l) => l.estado === "cliente").length
  const hiringSoporte = {
    ready: clientes >= 15,
    pct: Math.min(100, Math.round((clientes / 15) * 100)),
    label: clientes >= 15 ? "Considerá L1" : "Aún no hace falta",
  }

  const handleToggleMision = async (missionId: string) => {
    setBusyMission(missionId)
    try {
      const res = await authFetch("/api/lab", {
        method: "POST",
        body: JSON.stringify({ action: "toggle_mission", missionId }),
      })
      if (res.ok) {
        mutate()
        toast({ title: "Misión actualizada", description: "Guardado" })
      }
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar la misión", variant: "destructive" })
    } finally {
      setBusyMission(null)
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
        toast({ title: "Lead actualizado", description: `Ahora: ${estadoHuman(estado)}` })
      }
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar el lead", variant: "destructive" })
    }
  }

  const handleAddLead = async () => {
    if (!newLeadForm.nombre.trim()) {
      toast({
        title: "Falta el nombre",
        description: "Poné al menos el nombre del comercio",
        variant: "destructive",
      })
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
        toast({ title: "Prospecto agregado", description: "Ya está en el mapa" })
      }
    } catch {
      toast({ title: "Error", description: "No se pudo agregar el lead", variant: "destructive" })
    }
  }

  const handleCopiarArgumento = async (packId: string, variant: "A" | "B", texto: string) => {
    void navigator.clipboard.writeText(texto)
    setCopiadoId(`${packId}:${variant}`)
    toast({ title: "Copiado", description: `Variante ${variant} lista para pegar` })
    try {
      await authFetch("/api/lab", {
        method: "POST",
        body: JSON.stringify({ action: "track_copy", packId, variant }),
      })
      mutate()
    } catch {
      /* offline copy still ok */
    }
    setTimeout(() => setCopiadoId(null), 2000)
  }

  const handleWaClick = async (lead: LabLeadItem, variant: "A" | "B" = "A") => {
    try {
      await authFetch("/api/lab", {
        method: "POST",
        body: JSON.stringify({ action: "log_wa_click", leadId: lead.id, variant }),
      })
      mutate()
    } catch {
      /* still open WA */
    }
  }

  const openWhatsApp = (lead: LabLeadItem, variant: "A" | "B" = waVariant) => {
    const text = buildWaMessage(lead, variant)
    const phone = (lead.telefono ?? "").replace(/\D/g, "")
    void handleWaClick(lead, variant)
    window.open(`https://wa.me/549${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer")
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
      toast({
        title: "No se pudo generar el insight",
        description: "Reintentá en un rato",
        variant: "destructive",
      })
    } finally {
      setLoadingAi(false)
    }
  }

  const AddLeadDialog = (
    <Dialog open={dialogAddLeadOpen} onOpenChange={setDialogAddLeadOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5">
          <Plus className="h-4 w-4" />
          Nuevo prospecto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Sumar comercio al mapa</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="lead-nombre">Nombre del comercio *</Label>
            <Input
              id="lead-nombre"
              className="rounded-xl"
              placeholder="Ej: Kiosco La Esquina"
              value={newLeadForm.nombre}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, nombre: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lead-direccion">Dirección</Label>
            <Input
              id="lead-direccion"
              className="rounded-xl"
              placeholder="Ej: Bv. Oroño 1240"
              value={newLeadForm.direccion}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, direccion: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Zona</Label>
              <Select
                value={newLeadForm.zona}
                onValueChange={(val) => setNewLeadForm({ ...newLeadForm, zona: val })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZONAS.filter((z) => z !== "todas").map((z) => (
                    <SelectItem key={z} value={z}>
                      {z}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Rubro</Label>
              <Select
                value={newLeadForm.rubro}
                onValueChange={(val) => setNewLeadForm({ ...newLeadForm, rubro: val })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Almacén", "Kiosco", "Gastronomía", "Indumentaria", "Servicios", "Autoservicio"].map(
                    (r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Producto a ofrecer</Label>
            <Select
              value={newLeadForm.productoTarget}
              onValueChange={(val) => setNewLeadForm({ ...newLeadForm, productoTarget: val })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "Fiado + Leo Cobranza",
                  "Fiado Digital",
                  "POS + Comandas + KDS",
                  "Turnos + Sofía Confirmá",
                  "Stock + Facturación AFIP",
                  "Pack Almacén + Balanza",
                ].map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="lead-mrr">MRR estimado</Label>
              <Input
                id="lead-mrr"
                type="number"
                className="rounded-xl"
                value={newLeadForm.mrrEstimado}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, mrrEstimado: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lead-tel">Tel / WhatsApp</Label>
              <Input
                id="lead-tel"
                className="rounded-xl"
                placeholder="341..."
                value={newLeadForm.telefono}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, telefono: e.target.value })}
              />
            </div>
          </div>
        </div>
        <Button onClick={handleAddLead} className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500">
          Guardar en el mapa
        </Button>
      </DialogContent>
    </Dialog>
  )

  return (
    <PageShell>
      <PageHeader
        variant="surface"
        title="Claver Lab"
        description="Tu tablero de fundador: qué hacer hoy, pipeline de Rosario y argumentos de venta"
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Compass className="h-3.5 w-3.5" />
            Centro de mando
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5"
              onClick={handleConsultarGemini}
              disabled={loadingAi}
            >
              {loadingAi ? (
                <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
              ) : (
                <Sparkles className="h-4 w-4 text-violet-500" />
              )}
              {loadingAi ? "Pensando…" : "Insight IA"}
            </Button>
            {AddLeadDialog}
          </div>
        }
      />

      {/* Atajos de producto */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border bg-card/80 px-3 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/15">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{link.label}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{link.hint}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {isLoading && (
        <div className="rounded-2xl border bg-muted/30 p-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando Lab…
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-600 dark:text-rose-300">
          No se pudo cargar el Lab. Revisá la sesión e intentá recargar.
        </div>
      )}

      <KpiStrip
        items={[
          { label: "MRR cobrado", value: formatARS(metricas.mrrActual), icon: DollarSign },
          { label: "Pipeline caliente", value: formatARS(metricas.pipelinePotencial), icon: TrendingUp },
          { label: "Demos / trials", value: metricas.demosActivas, icon: Zap },
          {
            label: "Misiones hoy",
            value: `${misionesCompletadas}/${misiones.length || 0}`,
            icon: Target,
          },
        ]}
      />

      {/* Meta del mes */}
      <Card className="rounded-2xl border-primary/15 overflow-hidden">
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                <Rocket className="h-4 w-4 text-primary" />
                Meta MRR del mes
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatARS(metricas.mrrActual)} de {formatARS(metricas.metaMes)}
              </p>
            </div>
            <Badge variant="secondary" className="rounded-lg w-fit">
              {metricas.progresoMeta}%
            </Badge>
          </div>
          <Progress value={metricas.progresoMeta} className="h-2.5" />
        </CardContent>
      </Card>

      {/* Próxima acción */}
      <Card className="rounded-2xl border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-card to-card">
        <CardContent className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Flame className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Hacé esto ahora
            </p>
            <p className="font-semibold text-foreground mt-0.5">{nextAction.title}</p>
            <p className="text-sm text-muted-foreground">{nextAction.detail}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {nextAction.lead?.telefono && (
              <>
                <Select value={waVariant} onValueChange={(v) => setWaVariant(v as "A" | "B")}>
                  <SelectTrigger className="w-[100px] h-9 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">WA var A</SelectItem>
                    <SelectItem value="B">WA var B</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-500"
                  onClick={() => nextAction.lead && openWhatsApp(nextAction.lead, waVariant)}
                >
                  <Phone className="h-4 w-4" />
                  WhatsApp
                </Button>
              </>
            )}
            {serverNext?.kind === "product" && (
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <Link href="/dashboard/empleados-digitales">Ir a Leo</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Señales del producto (vivo, sin cron) */}
      {productSignals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="rounded-2xl border bg-card p-3">
            <p className="text-[11px] text-muted-foreground">Deudores fiado (tenant)</p>
            <p className="text-xl font-bold">{productSignals.deudoresFiado}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatARS(productSignals.deudaTotalAbs)} en cartera
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-3">
            <p className="text-[11px] text-muted-foreground">Leo</p>
            <p className="text-xl font-bold">{productSignals.leoActivo ? "ON" : "OFF"}</p>
            <p className="text-[10px] text-muted-foreground">
              {productSignals.empleadosDigitales} empleado(s) dig.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-3">
            <p className="text-[11px] text-muted-foreground">SKUs activos</p>
            <p className="text-xl font-bold">{productSignals.suscripcionesActivas}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {productSignals.skusActivos.slice(0, 2).join(", ") || "—"}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-3">
            <p className="text-[11px] text-muted-foreground">Score prom. leads</p>
            <p className="text-xl font-bold">{metricas.scorePromedio ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">
              {metricas.frios ?? 0} fríos · {metricas.clientes ?? 0} clientes
            </p>
          </div>
        </div>
      )}

      {/* Cerebro Gemini Banner si hay respuesta */}
      <AnimatePresence>
        {aiInsight && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-transparent p-4"
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

      <Tabs defaultValue="hoy" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-muted/60 rounded-xl w-full h-auto">
          <TabsTrigger value="hoy" className="rounded-lg text-xs sm:text-sm font-medium py-2">
            Hoy
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="rounded-lg text-xs sm:text-sm font-medium py-2">
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="argumentos" className="rounded-lg text-xs sm:text-sm font-medium py-2">
            Argumentos
          </TabsTrigger>
          <TabsTrigger value="escala" className="rounded-lg text-xs sm:text-sm font-medium py-2">
            Roadmap & equipo
          </TabsTrigger>
        </TabsList>

        {/* ——— HOY ——— */}
        <TabsContent value="hoy" className="space-y-4 mt-0">
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-2 rounded-2xl border-emerald-500/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    Misiones del día
                  </CardTitle>
                  <Badge variant="outline" className="rounded-lg text-[10px]">
                    {misionesCompletadas}/{misiones.length}
                  </Badge>
                </div>
                <CardDescription className="text-xs">Tocá para marcar hecha · {misionesPct}%</CardDescription>
                <Progress value={misionesPct} className="h-1.5 mt-1" />
              </CardHeader>
              <CardContent className="space-y-2">
                {misiones.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">No hay misiones cargadas.</p>
                )}
                {misiones.map((mision) => (
                  <button
                    key={mision.id}
                    type="button"
                    onClick={() => handleToggleMision(mision.id)}
                    disabled={busyMission === mision.id}
                    className={cn(
                      "w-full text-left flex items-start gap-3 rounded-xl border p-3 transition-all",
                      mision.completada
                        ? "bg-muted/40 opacity-75"
                        : "bg-background hover:border-emerald-500/40 hover:shadow-sm",
                    )}
                  >
                    {busyMission === mision.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0 mt-0.5" />
                    ) : mision.completada ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <p
                        className={cn(
                          "text-sm font-medium leading-snug",
                          mision.completada && "line-through text-muted-foreground",
                        )}
                      >
                        {mision.titulo}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] rounded-md">
                          {mision.categoria}
                        </Badge>
                        {mision.prioridad === "alta" && (
                          <Badge className="text-[10px] rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-300 border-0">
                            Alta
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{mision.impacto}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 rounded-2xl border-sky-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-sky-500" />
                  Embudo del pipeline
                </CardTitle>
                <CardDescription className="text-xs">
                  Cuántos comercios hay en cada etapa y el MRR potencial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {funnel.map((step) => (
                    <button
                      key={step.estado}
                      type="button"
                      onClick={() => {
                        setSelectedEstado(step.estado)
                      }}
                      className={cn(
                        "rounded-xl border p-3 text-left hover:shadow-sm transition-all",
                        ESTADO_STYLE[step.estado],
                      )}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                        {step.label}
                      </p>
                      <p className="text-2xl font-extrabold mt-1">{step.count}</p>
                      <p className="text-[10px] opacity-80 mt-0.5">{formatARS(step.mrr)}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Tocá una etapa para filtrar el pipeline (pestaña Pipeline)
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-indigo-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-indigo-500" />
                Señales de mercado (Rosario)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
              <div className="rounded-xl border bg-background p-3">
                <p className="text-[11px] text-muted-foreground">IPC / precios</p>
                <p className="text-lg font-bold text-indigo-500">+ inflación</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pitch: reexpresión de precios en un click.
                </p>
              </div>
              <div className="rounded-xl border bg-background p-3">
                <p className="text-[11px] text-muted-foreground">Calle caliente</p>
                <p className="text-lg font-bold">Echesortu · Pellegrini</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Más almacenes sin software → fiado + Leo.
                </p>
              </div>
              <div className="rounded-xl border bg-background p-3">
                <p className="text-[11px] text-muted-foreground">Canal</p>
                <p className="text-lg font-bold">Contadores</p>
                <p className="text-xs text-muted-foreground mt-1">
                  1 contador = N comercios. Link partner.
                </p>
                <Link
                  href="/dashboard/partner-portal"
                  className="text-xs text-primary font-medium inline-flex items-center gap-1 mt-2"
                >
                  Portal partner <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ——— PIPELINE ——— */}
        <TabsContent value="pipeline" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-sky-500/20">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-sky-500" />
                      Mapa de prospectos
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {leadsFiltrados.length} de {leads.length} comercios
                    </CardDescription>
                  </div>
                  {AddLeadDialog}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchLead}
                      onChange={(e) => setSearchLead(e.target.value)}
                      placeholder="Buscar nombre, zona, producto…"
                      className="pl-9 rounded-xl h-9"
                    />
                  </div>
                  <Select value={selectedZona} onValueChange={setSelectedZona}>
                    <SelectTrigger className="w-full sm:w-[160px] h-9 rounded-xl text-xs">
                      <SelectValue placeholder="Zona" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONAS.map((z) => (
                        <SelectItem key={z} value={z}>
                          {z === "todas" ? "Todas las zonas" : z}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                    <SelectTrigger className="w-full sm:w-[140px] h-9 rounded-xl text-xs">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {leadsFiltrados.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Building2 className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">Nada con ese filtro</p>
                  <p className="text-xs text-muted-foreground">Probá otra zona o limpiá la búsqueda.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl mt-2"
                    onClick={() => {
                      setSearchLead("")
                      setSelectedZona("todas")
                      setSelectedEstado("todos")
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {leadsFiltrados.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-2xl border bg-background p-3.5 flex flex-col gap-2.5 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm flex items-center gap-1.5 truncate">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {lead.nombre}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{lead.direccion}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {lead.zona} · {lead.rubro}
                            {lead.ultimoContacto ? ` · últ. ${lead.ultimoContacto}` : ""}
                            {(lead.waEnviados ?? 0) > 0 ? ` · ${lead.waEnviados} WA` : ""}
                          </p>
                          {lead.scoreReasons && lead.scoreReasons.length > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                              {lead.scoreReasons.join(" · ")}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge
                            variant="outline"
                            className={cn("rounded-lg text-[10px] border", ESTADO_STYLE[lead.estado])}
                          >
                            {estadoHuman(lead.estado)}
                          </Badge>
                          <span className="text-[11px] font-bold text-primary">
                            Score {lead.score ?? "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                        <span className="font-medium text-sky-600 dark:text-sky-400 truncate max-w-[55%]">
                          {lead.productoTarget}
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatARS(lead.mrrEstimado)}
                          <span className="font-normal text-muted-foreground">/mes</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Select
                          value={lead.estado}
                          onValueChange={(val) => handleUpdateLeadStatus(lead.id, val)}
                        >
                          <SelectTrigger className="h-8 text-[11px] w-[130px] rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS.filter((e) => e.value !== "todos").map((e) => (
                              <SelectItem key={e.value} value={e.value}>
                                {e.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {lead.telefono ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-[11px] rounded-lg border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              onClick={() => openWhatsApp(lead, "A")}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              WA A
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-[11px] rounded-lg"
                              onClick={() => openWhatsApp(lead, "B")}
                            >
                              WA B
                            </Button>
                          </>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Sin teléfono</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ——— ARGUMENTOS ——— */}
        <TabsContent value="argumentos" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-amber-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-4 w-4 text-amber-500" />
                Argumentos A/B (sin costo)
              </CardTitle>
              <CardDescription className="text-xs">
                Misma norma, dos frases. Medimos copias locales para ver qué usás más.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {pitchPacks.map((pack) => (
                <div
                  key={pack.id}
                  className="rounded-2xl border bg-background p-4 space-y-3 flex flex-col"
                >
                  <div>
                    <h4 className="font-semibold text-sm leading-snug">{pack.titulo}</h4>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{pack.contexto}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Variante A
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {pack.stats.copiesA} copias
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">“{pack.variantA}”</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs w-full rounded-lg"
                      onClick={() => handleCopiarArgumento(pack.id, "A", pack.variantA)}
                    >
                      {copiadoId === `${pack.id}:A` ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> Copiado A
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar A
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="rounded-xl bg-sky-500/5 border border-sky-500/20 p-3 space-y-2 mt-auto">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                        Variante B
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {pack.stats.copiesB} copias
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">“{pack.variantB}”</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs w-full rounded-lg"
                      onClick={() => handleCopiarArgumento(pack.id, "B", pack.variantB)}
                    >
                      {copiadoId === `${pack.id}:B` ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> Copiado B
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar B
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {(eventos.length > 0 || waLogs.length > 0) && (
            <div className="grid gap-3 md:grid-cols-2">
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Actividad reciente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 max-h-48 overflow-y-auto">
                  {eventos.slice(0, 12).map((ev) => (
                    <div key={ev.id} className="text-xs border-b border-border/40 pb-1.5">
                      <span className="text-muted-foreground">{ev.createdAt.slice(0, 16).replace("T", " ")}</span>
                      <p className="text-foreground/90">{ev.mensaje}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Clicks WhatsApp (log local)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 max-h-48 overflow-y-auto">
                  {waLogs.length === 0 && (
                    <p className="text-xs text-muted-foreground">Todavía no registraste un WA.</p>
                  )}
                  {waLogs.map((w) => (
                    <div key={w.id} className="text-xs border-b border-border/40 pb-1.5">
                      <span className="font-medium">{w.leadNombre}</span>
                      <span className="text-muted-foreground"> · var {w.variant}</span>
                      <p className="text-muted-foreground line-clamp-2">{w.preview}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="rounded-2xl">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <p className="font-semibold text-sm">¿Querés el pitch completo de fiado + Leo?</p>
                <p className="text-xs text-muted-foreground">Está en Claver Docs, con diagrama y frases.</p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5 shrink-0">
                <Link href="/dashboard/documentacion/room/flujo-fiado-leo">
                  Abrir en Docs <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ——— ESCALA ——— */}
        <TabsContent value="escala" className="space-y-4 mt-0">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-500" />
                  Roadmap del negocio
                </CardTitle>
                <CardDescription className="text-xs">Fases hacia escala regional</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {hitos.map((hito, idx) => {
                  const isCurrent = !hito.completado && (idx === 0 || hitos[idx - 1]?.completado)
                  return (
                    <div
                      key={hito.id}
                      className={cn(
                        "rounded-xl border p-3 space-y-1",
                        hito.completado && "border-emerald-500/30 bg-emerald-500/5",
                        isCurrent && "border-purple-500/40 bg-purple-500/10",
                        !hito.completado && !isCurrent && "opacity-60",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold">
                          {hito.fase}: {hito.titulo}
                        </span>
                        {hito.completado ? (
                          <Badge className="bg-emerald-600 text-[10px] rounded-md">Hecho</Badge>
                        ) : isCurrent ? (
                          <Badge className="bg-purple-600 text-[10px] rounded-md">En curso</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] rounded-md">
                            Pendiente
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{hito.descripcion}</p>
                      <p className="text-[11px] text-purple-600 dark:text-purple-300 font-medium pt-0.5">
                        Salida: {hito.hitoSalida}
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-rose-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-rose-500" />
                  ¿Ya contratar?
                </CardTitle>
                <CardDescription className="text-xs">
                  Umbrales objetivos según tu pipeline real (no intuición)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border bg-background p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">Vendedor part-time</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] rounded-md",
                        hiringVendedor.ready
                          ? "text-amber-600 border-amber-500/40"
                          : "text-emerald-600 border-emerald-500/40",
                      )}
                    >
                      {hiringVendedor.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Disparador: ~30 leads fríos sin contactar. Hoy:{" "}
                    <strong>{friosSinContactar}</strong> fríos.
                  </p>
                  <Progress value={hiringVendedor.pct} className="h-1.5" />
                </div>

                <div className="rounded-xl border bg-background p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">Soporte L1</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] rounded-md",
                        hiringSoporte.ready
                          ? "text-amber-600 border-amber-500/40"
                          : "text-emerald-600 border-emerald-500/40",
                      )}
                    >
                      {hiringSoporte.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Disparador orientativo: ~15 clientes pagos. Hoy: <strong>{clientes}</strong>.
                  </p>
                  <Progress value={hiringSoporte.pct} className="h-1.5" />
                </div>

                <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
                  Mientras seas founder-only: usá misiones del día + WhatsApp desde el pipeline. El Lab
                  es tu CRM liviano de Rosario.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  )
}
