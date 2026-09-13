"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { authFetch } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, ArrowLeft, ArrowRight } from "lucide-react"
import { WORKS_STATUS_LABEL, nextStatus } from "@/lib/works/fsm"
import type { WorksProjectStatus } from "@prisma/client"

type Milestone = {
  id: string
  nombre: string
  estado: string
  monto?: string | number | null
  pct?: string | number | null
}

type Partner = { id: string; empresa: string; zona?: string | null; rcVigente: boolean }

type Project = {
  id: string
  segmento: string
  status: WorksProjectStatus
  titulo: string
  moneda: string
  montoPresupuesto?: string | number | null
  montoSena?: string | number | null
  comisionPct: string | number
  senaPagada: boolean
  presupuestoSoftUrl?: string | null
  checklist?: Record<string, boolean> | null
  partner?: Partner | null
  partnerAssignedBy?: string | null
  partnerAssignedAt?: string | null
  lead?: {
    id: string
    nombre: string
    email?: string | null
    telefono?: string | null
    zona?: string | null
    payload?: Record<string, unknown> | null
  } | null
  milestones: Milestone[]
  notas?: string | null
}

export default function WorksProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [project, setProject] = useState<Project | null>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [partnerId, setPartnerId] = useState("")
  const [senaMonto, setSenaMonto] = useState("")
  const [comisionPct, setComisionPct] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [adminOverride, setAdminOverride] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [pr, pa] = await Promise.all([
        authFetch(`/api/works/projects/${id}`),
        authFetch("/api/works/partners?ensureMock=1&activo=1"),
      ])
      const pdata = await pr.json()
      const adata = await pa.json()
      if (!pr.ok) throw new Error(pdata.error ?? "Error proyecto")
      if (!pa.ok) throw new Error(adata.error ?? "Error partners")
      setProject(pdata.project)
      setPartners(adata.partners ?? [])
      setComisionPct(String(pdata.project?.comisionPct ?? "20"))
      if (pdata.project?.partnerId) setPartnerId(pdata.project.partnerId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError("")
    try {
      await fn()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setBusy(false)
    }
  }

  async function advance() {
    if (!project) return
    const to = nextStatus(project.status)
    if (!to) throw new Error("Sin siguiente estado")
    const res = await authFetch(`/api/works/projects/${id}/transition`, {
      method: "POST",
      body: JSON.stringify({ to, adminOverride }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Error transición")
  }

  async function markSena() {
    const res = await authFetch(`/api/works/projects/${id}/sena`, {
      method: "POST",
      body: JSON.stringify({
        monto: senaMonto ? Number(senaMonto) : undefined,
        nota: "seña manual Cloud",
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Error seña")
  }

  async function assign() {
    if (!partnerId) throw new Error("Elegí partner")
    const res = await authFetch(`/api/works/projects/${id}/partner`, {
      method: "POST",
      body: JSON.stringify({ partnerId }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Error assign")
  }

  async function saveComision() {
    const res = await authFetch(`/api/works/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ comisionPct: Number(comisionPct) }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Error comisión")
  }

  async function markHitoCobrado(milestoneId: string) {
    const res = await authFetch(`/api/works/projects/${id}/milestones`, {
      method: "PATCH",
      body: JSON.stringify({ milestoneId, estado: "cobrado" }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Error hito")
  }

  async function toggleChecklist(key: string, value: boolean) {
    if (!project) return
    const checklist = { ...(project.checklist ?? {}), [key]: value }
    const res = await authFetch(`/api/works/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ checklist }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Error checklist")
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
      </div>
    )
  }
  if (!project) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error || "Proyecto no encontrado"}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/claver-cloud/works">Volver</Link>
        </Button>
      </div>
    )
  }

  const nxt = nextStatus(project.status)
  const checklistEntries = Object.entries(project.checklist ?? {})

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/claver-cloud/works">
            <ArrowLeft className="mr-1 h-4 w-4" /> Bandeja
          </Link>
        </Button>
        <Badge variant="secondary">{WORKS_STATUS_LABEL[project.status]}</Badge>
        <Badge variant="outline">{project.segmento}</Badge>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{project.titulo}</h1>
        <p className="text-sm text-muted-foreground">
          {project.lead?.nombre} · {project.lead?.email ?? "sin email"} · {project.lead?.zona ?? "—"}
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">FSM</CardTitle>
            <CardDescription>Transiciones forward o Cancelado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "Lead",
                  "Calificado",
                  "Presupuesto",
                  "Sena",
                  "MatchPartner",
                  "EnEjecucion",
                  "Entregado",
                  "Cobrado",
                ] as WorksProjectStatus[]
              ).map((s) => (
                <Badge key={s} variant={s === project.status ? "default" : "outline"}>
                  {WORKS_STATUS_LABEL[s]}
                </Badge>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={adminOverride} onCheckedChange={(v) => setAdminOverride(v === true)} />
              Override admin (MatchPartner sin seña)
            </label>
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy || !nxt} onClick={() => void run(advance)}>
                Avanzar {nxt ? WORKS_STATUS_LABEL[nxt] : ""} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                disabled={busy || project.status === "Cancelado" || project.status === "Cobrado"}
                onClick={() =>
                  void run(async () => {
                    const res = await authFetch(`/api/works/projects/${id}/transition`, {
                      method: "POST",
                      body: JSON.stringify({ to: "Cancelado", cancelReason: "manual" }),
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error ?? "Error")
                  })
                }
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seña + Soft link</CardTitle>
            <CardDescription>Seña manual OK · MP auto en cola CTO</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Seña:{" "}
              {project.senaPagada ? (
                <Badge className="bg-emerald-600">Pagada</Badge>
              ) : (
                <Badge variant="outline">Pendiente</Badge>
              )}
            </p>
            {project.presupuestoSoftUrl ? (
              <a className="text-sm underline text-violet-300" href={project.presupuestoSoftUrl}>
                Stub presupuesto Soft
              </a>
            ) : null}
            <div className="flex gap-2">
              <Input
                placeholder="Monto seña"
                value={senaMonto}
                onChange={(e) => setSenaMonto(e.target.value)}
                type="number"
              />
              <Button disabled={busy} onClick={() => void run(markSena)}>
                Marcar seña
              </Button>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label>Comisión %</Label>
                <Input value={comisionPct} onChange={(e) => setComisionPct(e.target.value)} type="number" />
              </div>
              <Button variant="outline" disabled={busy} onClick={() => void run(saveComision)}>
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Partner EPC</CardTitle>
            <CardDescription>Asignación auditada (quién/cuándo)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.partner ? (
              <p className="text-sm">
                Asignado: <strong>{project.partner.empresa}</strong>
                {project.partnerAssignedBy ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · por {project.partnerAssignedBy}
                    {project.partnerAssignedAt
                      ? ` · ${new Date(project.partnerAssignedAt).toLocaleString("es-AR")}`
                      : ""}
                  </span>
                ) : null}
              </p>
            ) : null}
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
            >
              <option value="">Elegir partner…</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.empresa} {p.rcVigente ? "(RC)" : ""} {p.zona ? `· ${p.zona}` : ""}
                </option>
              ))}
            </select>
            <Button disabled={busy || !partnerId} onClick={() => void run(assign)}>
              Asignar partner
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Checklist Energy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {checklistEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin checklist</p>
            ) : (
              checklistEntries.map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={Boolean(v)}
                    onCheckedChange={(checked) => void run(() => toggleChecklist(k, checked === true))}
                  />
                  {k}
                </label>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Hitos</CardTitle>
            <CardDescription>Partner net = cobrado − comisión%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.milestones.map((m) => {
              const cobrado = m.monto != null ? Number(m.monto) : 0
              const pct = Number(project.comisionPct)
              const net = Math.round(cobrado * (1 - pct / 100) * 100) / 100
              return (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                  <div>
                    <div className="font-medium text-sm">{m.nombre}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.estado} · monto {m.monto ?? "—"} · partner net {net || "—"}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || m.estado === "cobrado"}
                    onClick={() => void run(() => markHitoCobrado(m.id))}
                  >
                    Marcar cobrado
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
