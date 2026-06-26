"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Bot,
  Building2,
  CheckCircle2,
  ClipboardList,
  Loader2,
  RefreshCw,
  Store,
  User,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ChecklistItem = { paso: number; titulo: string; hecho: boolean; ejecutor: string }

type TareaRow = {
  id: string
  sku: string
  titulo: string
  descripcion: string | null
  estado: string
  prioridad: string
  tipoEjecutor: string
  asignadoA: string | null
  provisionJobId: string | null
  checklistJson: ChecklistItem[] | null
  empresa: { id: number; nombre: string; razonSocial: string; cuit: string | null }
  producto: { nombre: string; autoCertLevel: string; precioArs: number } | null
  runbook: {
    activacionCliente: string
    otorgamiento: string
    postventa: string
    ccaFase: string
    pasos: { orden: number; titulo: string; ejecutor: string; descripcion: string }[]
    escalacionSi: string[]
  }
}

type Metricas = { total: number; pendientes: number; completadas: number }

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
}

function prioridadColor(p: string) {
  if (p === "critica" || p === "alta") return "bg-red-500/10 text-red-600 border-red-300"
  if (p === "media") return "bg-amber-500/10 text-amber-700 border-amber-300"
  return "bg-slate-500/10 text-slate-600 border-slate-300"
}

function estadoColor(e: string) {
  if (e === "completada") return "bg-emerald-500/10 text-emerald-700 border-emerald-300"
  if (e === "en_curso") return "bg-blue-500/10 text-blue-700 border-blue-300"
  if (e === "escalada") return "bg-orange-500/10 text-orange-700 border-orange-300"
  return "bg-amber-500/10 text-amber-800 border-amber-300"
}

export default function ClaverMarketplacePage() {
  const [tareas, setTareas] = useState<TareaRow[]>([])
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [loading, setLoading] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState("activas")
  const [selected, setSelected] = useState<TareaRow | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [notas, setNotas] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado === "pendiente") params.set("estado", "pendiente")
      if (filtroEstado === "en_curso") params.set("estado", "en_curso")
      if (filtroEstado === "completada") params.set("estado", "completada")

      const res = await fetch(`/api/claver/marketplace/tareas?${params}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        let rows: TareaRow[] = data.data ?? []
        if (filtroEstado === "activas") {
          rows = rows.filter((t) => t.estado === "pendiente" || t.estado === "en_curso" || t.estado === "escalada")
        }
        setTareas(rows)
        setMetricas(data.metricas ?? null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void cargar()
  }, [filtroEstado])

  function abrirTarea(t: TareaRow) {
    setSelected(t)
    setChecklist(Array.isArray(t.checklistJson) ? [...t.checklistJson] : [])
    setNotas("")
  }

  async function ejecutarAccion(accion: "iniciar" | "completar" | "escalar") {
    if (!selected) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/claver/marketplace/tareas/${selected.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ accion, notas: notas || undefined, checklistJson: checklist }),
      })
      if (res.ok) {
        setSelected(null)
        await cargar()
      }
    } finally {
      setActionLoading(false)
    }
  }

  function toggleChecklist(paso: number) {
    setChecklist((prev) =>
      prev.map((c) => (c.paso === paso ? { ...c, hecho: !c.hecho } : c)),
    )
  }

  const checklistCompleto = checklist.length > 0 && checklist.every((c) => c.hecho)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Store className="h-5 w-5" />
            <span className="text-sm font-medium">Torre de analistas</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace — Activaciones</h1>
          <p className="text-muted-foreground mt-1">
            Cada producto tiene su runbook. Acá ves qué pidió el cliente, cómo activarlo y cómo otorgar el servicio.
          </p>
        </div>
        <Button variant="outline" onClick={() => void cargar()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {metricas && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pendientes</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{metricas.pendientes}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Completadas</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{metricas.completadas}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total en cola</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{metricas.total}</CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(["activas", "pendiente", "en_curso", "completada"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filtroEstado === f ? "default" : "outline"}
            onClick={() => setFiltroEstado(f)}
          >
            {f === "activas" ? "Activas" : f.charAt(0).toUpperCase() + f.slice(1).replace("_", " ")}
          </Button>
        ))}
      </div>

      {loading && tareas.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tareas.length === 0 ? (
        <Card className="py-16 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
          <p className="text-lg font-medium">Sin tareas en esta vista</p>
          <p className="text-muted-foreground text-sm mt-1">
            Las activaciones SEMI_AUTO y HUMAN_GATE aparecen acá automáticamente.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tareas.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => abrirTarea(t)}
            >
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline" className={prioridadColor(t.prioridad)}>
                      {t.prioridad}
                    </Badge>
                    <Badge variant="outline" className={estadoColor(t.estado)}>
                      {t.estado}
                    </Badge>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {t.sku}
                    </Badge>
                    {t.tipoEjecutor === "ia" || t.asignadoA === "clav-ai" ? (
                      <Badge variant="outline" className="gap-1">
                        <Bot className="h-3 w-3" /> ClavAI
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <User className="h-3 w-3" /> {t.asignadoA ?? "Sin asignar"}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg truncate">{t.titulo}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {t.empresa.nombre} — CUIT {t.empresa.cuit ?? "s/d"}
                    </span>
                    <Link
                      href={`/claver-cloud/tenants/${t.empresa.id}`}
                      className="text-primary hover:underline shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Admin
                    </Link>
                    <Link
                      href={`/claver-cloud/operations/${t.empresa.id}`}
                      className="text-primary hover:underline shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ops
                    </Link>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <ClipboardList className="h-4 w-4" />
                    {t.runbook.ccaFase}
                  </div>
                  <p className="mt-1 max-w-xs truncate">{t.runbook.activacionCliente}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.titulo}</DialogTitle>
              </DialogHeader>

              <div className="space-y-5 text-sm">
                <section>
                  <h4 className="font-semibold mb-1">Cliente</h4>
                  <p>
                    {selected.empresa.razonSocial} ({selected.empresa.nombre}) — empresa #{selected.empresa.id}
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold mb-1">Qué pidió el cliente</h4>
                  <p className="text-muted-foreground">{selected.runbook.activacionCliente}</p>
                </section>

                <section>
                  <h4 className="font-semibold mb-1">Cómo otorgar el servicio</h4>
                  <p className="text-muted-foreground">{selected.descripcion ?? selected.runbook.otorgamiento}</p>
                </section>

                <section>
                  <h4 className="font-semibold mb-2">Runbook — pasos</h4>
                  <ol className="space-y-2 list-decimal list-inside">
                    {selected.runbook.pasos.map((p) => (
                      <li key={p.orden} className="text-muted-foreground">
                        <span className="font-medium text-foreground">{p.titulo}</span>
                        <span className="ml-1 text-xs">({p.ejecutor})</span>
                        — {p.descripcion}
                      </li>
                    ))}
                  </ol>
                </section>

                {checklist.length > 0 && (
                  <section>
                    <h4 className="font-semibold mb-2">Checklist analista</h4>
                    <div className="space-y-2">
                      {checklist.map((c) => (
                        <label key={c.paso} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={c.hecho}
                            onCheckedChange={() => toggleChecklist(c.paso)}
                            disabled={selected.estado === "completada"}
                          />
                          <span className={cn(c.hecho && "line-through text-muted-foreground")}>
                            {c.titulo} ({c.ejecutor})
                          </span>
                        </label>
                      ))}
                    </div>
                  </section>
                )}

                {selected.runbook.escalacionSi.length > 0 && (
                  <section>
                    <h4 className="font-semibold mb-1 text-amber-700">Escalar si</h4>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {selected.runbook.escalacionSi.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </section>
                )}

                <section>
                  <h4 className="font-semibold mb-1">Postventa</h4>
                  <p className="text-muted-foreground">{selected.runbook.postventa}</p>
                </section>

                {selected.estado !== "completada" && (
                  <section>
                    <h4 className="font-semibold mb-1">Notas</h4>
                    <Textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Observaciones al completar o escalar..."
                      rows={3}
                    />
                  </section>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {selected.estado === "pendiente" && (
                    <Button onClick={() => void ejecutarAccion("iniciar")} disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tomar tarea"}
                    </Button>
                  )}
                  {(selected.estado === "en_curso" || selected.estado === "pendiente") && (
                    <Button
                      onClick={() => void ejecutarAccion("completar")}
                      disabled={actionLoading || (checklist.length > 0 && !checklistCompleto)}
                    >
                      Completar y activar SKU
                    </Button>
                  )}
                  {selected.estado !== "completada" && selected.estado !== "escalada" && (
                    <Button variant="outline" onClick={() => void ejecutarAccion("escalar")} disabled={actionLoading}>
                      Escalar
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}