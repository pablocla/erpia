"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Users, UserPlus, Phone, Mail, Calendar,
  DollarSign, TrendingUp, Target, ArrowRight,
  MessageSquare, Plus, RefreshCw, Award, Sparkles,
} from "lucide-react"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { PageShell, PageHeader, KpiStrip, StatusBadge } from "@/components/layout"
import { leadEstadoVariant, leadEstadoLabel } from "@/lib/ui/status-map"

interface Lead {
  id: number
  nombre: string
  empresa: string | null
  email: string | null
  telefono: string | null
  origen: string
  estado: string
  valorEstimado: number | null
  createdAt: string
}

interface Oportunidad {
  id: number
  nombre: string
  etapa: string
  probabilidad: number
  montoEstimado: number
  fechaCierreEstimada: string | null
  createdAt: string
}

interface PipelineData {
  etapas: Array<{
    etapa: string
    cantidad: number
    montoTotal: number
    montoPonderado: number
  }>
  totalPipeline: number
  totalPonderado: number
}

interface Metricas {
  leadsNuevos: number
  oportunidadesAbiertas: number
  ganadasMes: number
  perdidasMes: number
  montoGanado: number
  winRate: number
}

const ETAPA_COLORS: Record<string, string> = {
  prospecto: "bg-blue-500",
  propuesta: "bg-amber-500",
  negociacion: "bg-purple-500",
  cierre: "bg-green-500",
}

const ORIGEN_LABELS: Record<string, string> = {
  manual: "Manual",
  web: "Web",
  referido: "Referido",
  mercadolibre: "Mercado Libre",
  tiendanube: "Tienda Nube",
  whatsapp: "WhatsApp",
  feria: "Feria/Evento",
}

function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
}

export default function CRMPage() {
  const [pipeline, setPipeline] = useState<PipelineData | null>(null)
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewLead, setShowNewLead] = useState(false)

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, mRes, lRes, oRes] = await Promise.all([
        fetch("/api/crm?vista=pipeline", { headers }),
        fetch("/api/crm?vista=metricas", { headers }),
        fetch("/api/crm?vista=leads", { headers }),
        fetch("/api/crm?vista=oportunidades", { headers }),
      ])
      const [pData, mData, lData, oData] = await Promise.all([pRes.json(), mRes.json(), lRes.json(), oRes.json()])
      if (pData.success) setPipeline(pData.data)
      if (mData.success) setMetricas(mData.data)
      if (lData.success) setLeads(lData.data)
      if (oData.success) setOportunidades(oData.data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useKeyboardShortcuts(erpShortcuts({ onRefresh: fetchAll, onNew: () => setShowNewLead(true) }))

  const crearLead = async (formData: FormData) => {
    const body = {
      accion: "crear_lead",
      nombre: formData.get("nombre"),
      empresa: formData.get("empresa") || undefined,
      email: formData.get("email") || undefined,
      telefono: formData.get("telefono") || undefined,
      origen: formData.get("origen") || "manual",
      valorEstimado: formData.get("valorEstimado") ? Number(formData.get("valorEstimado")) : undefined,
    }
    await fetch("/api/crm", { method: "POST", headers, body: JSON.stringify(body) })
    setShowNewLead(false)
    fetchAll()
  }

  const kpiItems = metricas ? [
    { label: "Leads nuevos (30d)", value: metricas.leadsNuevos, icon: UserPlus },
    { label: "Oportunidades abiertas", value: metricas.oportunidadesAbiertas, icon: Target },
    { label: "Ganadas (30d)", value: metricas.ganadasMes, icon: Award, iconClassName: "text-[var(--status-success)]" },
    { label: "Perdidas (30d)", value: metricas.perdidasMes, icon: TrendingUp, iconClassName: "text-[var(--status-error)]" },
    { label: "Win Rate", value: `${metricas.winRate}%`, icon: TrendingUp, iconClassName: "text-[var(--status-info)]" },
    { label: "Monto ganado", value: formatARS(metricas.montoGanado), icon: DollarSign, iconClassName: "text-[var(--status-success)]" },
  ] : []

  return (
    <PageShell>
      <PageHeader
        title="CRM — Pipeline Comercial"
        description="Gestión de leads y oportunidades de venta"
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <Target className="h-3.5 w-3.5" />
            Ventas y Prospectos
          </span>
        }
        actions={
          <div className="flex gap-2">
            <Dialog open={showNewLead} onOpenChange={setShowNewLead}>
              <DialogTrigger asChild>
                <Button size="sm"><UserPlus className="h-4 w-4 mr-1" /> Nuevo Lead</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Lead</DialogTitle>
                  <DialogDescription>Registrar un nuevo prospecto comercial</DialogDescription>
                </DialogHeader>
                <form action={crearLead} className="space-y-3">
                  <div><Label>Nombre *</Label><Input name="nombre" required /></div>
                  <div><Label>Empresa</Label><Input name="empresa" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Email</Label><Input name="email" type="email" /></div>
                    <div><Label>Teléfono</Label><Input name="telefono" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Origen</Label>
                      <select name="origen" className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                        {Object.entries(ORIGEN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div><Label>Valor estimado</Label><Input name="valorEstimado" type="number" placeholder="$" /></div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Crear Lead</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {/* Métricas rápidas */}
      {metricas && (
        <KpiStrip items={kpiItems} className="grid-cols-2 md:grid-cols-3 xl:grid-cols-6" />
      )}

      {/* Pipeline visual Kanban */}
      {pipeline && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Pipeline — {formatARS(pipeline.totalPipeline)} total ({formatARS(pipeline.totalPonderado)} ponderado)</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {pipeline.etapas.map((e) => (
              <Card key={e.etapa} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${ETAPA_COLORS[e.etapa] ?? "bg-gray-500"}`} />
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-medium capitalize flex items-center justify-between">
                    {e.etapa}
                    <Badge variant="secondary" className="text-xs">{e.cantidad}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-lg font-bold">{formatARS(e.montoTotal)}</p>
                  <p className="text-xs text-muted-foreground">Ponderado: {formatARS(e.montoPonderado)}</p>
                  {/* Mini list of opportunities in this stage */}
                  <div className="pt-2 space-y-1.5">
                    {oportunidades
                      .filter(o => o.etapa === e.etapa)
                      .slice(0, 5)
                      .map(o => (
                        <div key={o.id} className="text-xs p-2 rounded bg-muted/50 flex items-center justify-between">
                          <span className="truncate flex-1">{o.nombre}</span>
                          <span className="font-medium ml-2 shrink-0">{formatARS(o.montoEstimado)}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Leads recientes */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Leads recientes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {leads.slice(0, 12).map(lead => (
            <Card key={lead.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{lead.nombre}</p>
                  {lead.empresa && <p className="text-xs text-muted-foreground">{lead.empresa}</p>}
                </div>
                <StatusBadge 
                  variant={leadEstadoVariant(lead.estado)} 
                  label={leadEstadoLabel(lead.estado)} 
                />
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                {lead.telefono && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.telefono}</span>}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {ORIGEN_LABELS[lead.origen] ?? lead.origen} · {new Date(lead.createdAt).toLocaleDateString("es-AR")}
                </span>
                {lead.valorEstimado != null && (
                  <span className="text-xs font-medium">{formatARS(lead.valorEstimado)}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
