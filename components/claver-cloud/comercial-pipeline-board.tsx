"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, ClipboardList, Map, Plus, RefreshCw } from "lucide-react"
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
import { cloudAuthHeaders } from "@/lib/claver-cloud/auth-headers"
import {
  PIPELINE_ETAPA_LABELS,
  PIPELINE_ETAPAS,
  type PipelineEtapa,
} from "@/lib/ops/comercial-pipeline-catalog"
import { cn } from "@/lib/utils"

type Lead = {
  id: number
  nombre: string
  negocio: string | null
  telefono: string | null
  email: string | null
  localidad: string | null
  rubro: string | null
  origen: string
  etapa: PipelineEtapa
  valorEstimado: number | null
  proximaAccion: string | null
  proximaFecha: string | null
  empresaId?: number | null
  createdAt?: string
}

const KANBAN_ETAPAS: PipelineEtapa[] = ["prospecto", "visita", "trial", "cerrado"]

const etapaColor: Record<PipelineEtapa, string> = {
  prospecto: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  visita: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  trial: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  cerrado: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  provisionado: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  descartado: "bg-red-500/10 text-red-300/70 border-red-500/20",
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n)

const fmtFecha = (iso: string) =>
  new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(new Date(iso))

const emptyForm = {
  nombre: "",
  negocio: "",
  telefono: "",
  localidad: "",
  rubro: "",
  valorEstimado: "",
  proximaAccion: "",
  notas: "",
}

export function ComercialPipelineBoard({ showHeader = true }: { showHeader?: boolean }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [provisioningLead, setProvisioningLead] = useState<{
    id: number
    targetEtapa: PipelineEtapa
  } | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/claver/comercial/leads", { headers: cloudAuthHeaders() })
      if (res.ok) setLeads(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function moverEtapa(id: number, etapa: PipelineEtapa) {
    const lead = leads.find((l) => l.id === id)
    if (lead && !lead.empresaId && (etapa === "trial" || etapa === "cerrado")) {
      setProvisioningLead({ id, targetEtapa: etapa })
      return
    }

    const res = await fetch(`/api/claver/comercial/leads/${id}`, {
      method: "PATCH",
      headers: cloudAuthHeaders(true),
      body: JSON.stringify({ etapa }),
    })
    if (res.ok) void cargar()
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
          provision: true,
        }),
      })
      if (res.ok) {
        setProvisioningLead(null)
        void cargar()
      }
    } finally {
      setSaving(false)
    }
  }

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
          rubro: form.rubro || undefined,
          valorEstimado: form.valorEstimado ? Number(form.valorEstimado) : undefined,
          proximaAccion: form.proximaAccion || undefined,
          notas: form.notas || undefined,
        }),
      })
      if (res.ok) {
        setDialogOpen(false)
        setForm(emptyForm)
        void cargar()
      }
    } finally {
      setSaving(false)
    }
  }

  const activos = leads.filter((l) => !["descartado", "provisionado"].includes(l.etapa))
  const consultasWeb = leads.filter((l) =>
    ["web", "web_register", "industry_demo"].includes(l.origen),
  )
  const valorPipeline = activos.reduce((s, l) => s + (l.valorEstimado ?? 0), 0)

  const porEtapa = KANBAN_ETAPAS.reduce(
    (acc, e) => {
      acc[e] = leads.filter((l) => l.etapa === e)
      return acc
    },
    {} as Record<PipelineEtapa, Lead[]>,
  )

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Pipeline comercial</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activos.length} leads activos · {consultasWeb.length} desde web · {fmt(valorPipeline)}{" "}
              potencial MRR
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void cargar()} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/claver-cloud/comercial/upgrades-arca">
                <Calendar className="mr-2 h-4 w-4" />
                Certificados ARCA
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/claver-cloud/comercial/relevamientos">
                <ClipboardList className="mr-2 h-4 w-4" />
                Relevamiento
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/claver-cloud/comercial/campo">
                <Map className="mr-2 h-4 w-4" />
                Mapa y ruta
              </Link>
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar prospecto</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid gap-1.5">
                    <Label>Nombre / contacto *</Label>
                    <Input
                      value={form.nombre}
                      onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                      placeholder="Dueño del negocio"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Negocio</Label>
                    <Input
                      value={form.negocio}
                      onChange={(e) => setForm((f) => ({ ...f, negocio: e.target.value }))}
                      placeholder="Almacén Don Pedro"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label>Teléfono</Label>
                      <Input
                        value={form.telefono}
                        onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Localidad</Label>
                      <Input
                        value={form.localidad}
                        onChange={(e) => setForm((f) => ({ ...f, localidad: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label>Rubro</Label>
                      <Input
                        value={form.rubro}
                        onChange={(e) => setForm((f) => ({ ...f, rubro: e.target.value }))}
                        placeholder="almacen"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Valor estimado ARS/mes</Label>
                      <Input
                        type="number"
                        value={form.valorEstimado}
                        onChange={(e) => setForm((f) => ({ ...f, valorEstimado: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Próxima acción</Label>
                    <Input
                      value={form.proximaAccion}
                      onChange={(e) => setForm((f) => ({ ...f, proximaAccion: e.target.value }))}
                      placeholder="Llamar el martes"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Notas</Label>
                    <Textarea
                      value={form.notas}
                      onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => void crearLead()} disabled={saving || !form.nombre.trim()}>
                    {saving ? "Guardando…" : "Crear lead"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-4">
        {KANBAN_ETAPAS.map((etapa) => {
          const leadsEtapa = porEtapa[etapa] ?? []
          return (
            <Card key={etapa} className="min-h-[280px] bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <Badge variant="outline" className={cn("text-xs", etapaColor[etapa])}>
                    {PIPELINE_ETAPA_LABELS[etapa]}
                  </Badge>
                  <span className="text-xs font-normal text-muted-foreground">{leadsEtapa.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leadsEtapa.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">Vacío</p>
                ) : (
                  leadsEtapa.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-md border p-2.5 text-sm space-y-1.5 bg-background/60"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-tight">{lead.nombre}</p>
                        {["web", "web_register", "industry_demo"].includes(lead.origen) && (
                          <Badge variant="outline" className="text-[10px] shrink-0 border-blue-500/30 text-blue-400">
                            {lead.origen === "web_register"
                              ? "Trial"
                              : lead.origen === "industry_demo"
                                ? "Demo"
                                : "Web"}
                          </Badge>
                        )}
                        {lead.origen === "upgrade-arca-wsp" && (
                          <Badge variant="outline" className="text-[10px] shrink-0 border-amber-500/40 text-amber-300">
                            Upgrade ARCA
                          </Badge>
                        )}
                      </div>
                      {lead.negocio && <p className="text-xs text-muted-foreground">{lead.negocio}</p>}
                      {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                      {lead.localidad && (
                        <p className="text-xs text-muted-foreground">{lead.localidad}</p>
                      )}
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
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!provisioningLead} onOpenChange={(open) => !open && setProvisioningLead(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Provisionar tenant desde lead</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Este prospecto no tiene tenant. Se creará la organización con los datos del lead, pack
            según rubro y trial 14 días.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setProvisioningLead(null)}>
              Cancelar
            </Button>
            <Button onClick={() => void confirmarProvisioning()} disabled={saving}>
              {saving ? "Provisionando…" : "Crear tenant ahora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}