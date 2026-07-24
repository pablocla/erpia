"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  CalendarPlus,
  RefreshCw,
  UserPlus,
  FileSignature,
  ClipboardList,
  Users,
  LayoutGrid,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageShell, PageHeader, StatusBadge } from "@/components/layout"
import { PageSkeleton } from "@/components/layout/page-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import type { StatusVariant } from "@/lib/ui/status-map"

type Stakeholder = { id: number; nombre: string; email: string }
type BacklogItem = {
  id: string
  titulo: string
  tipo: string
  estado: string
  visibilidadCliente: boolean
  sprintId?: string
}
type Sprint = { id: string; nombre: string; inicio: string; fin: string; activo: boolean }

const ESTADOS = ["backlog", "sprint", "en_curso", "review", "done"] as const

const ESTADO_LABEL: Record<string, string> = {
  backlog: "Backlog",
  sprint: "Sprint",
  en_curso: "En curso",
  review: "Review",
  done: "Done",
}

function scrumVariant(estado: string): StatusVariant {
  switch (estado) {
    case "done":
      return "success"
    case "en_curso":
      return "info"
    case "review":
      return "warning"
    case "sprint":
      return "info"
    default:
      return "neutral"
  }
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function hoyIso() {
  return new Date().toISOString().slice(0, 10)
}

function enDosSemanasIso() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

export default function ClaverImplementationDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [items, setItems] = useState<BacklogItem[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [sprintNombre, setSprintNombre] = useState("")
  const [sprintInicio, setSprintInicio] = useState(hoyIso)
  const [sprintFin, setSprintFin] = useState(enDosSemanasIso)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [uatSignature, setUatSignature] = useState("")
  const [uatComments, setUatComments] = useState("")
  const [uatOk, setUatOk] = useState("")

  const cargar = useCallback(async () => {
    if (!id) return
    setLoadError("")
    try {
      const [sRes, bRes] = await Promise.all([
        fetch(`/api/claver/implementaciones/${id}/stakeholders`, { headers: authHeaders() }),
        fetch(`/api/claver/implementaciones/${id}/scrum`, { headers: authHeaders() }),
      ])
      if (!sRes.ok && !bRes.ok) {
        setLoadError("No se pudo cargar el proyecto. Revisá tu sesión o el ID.")
        return
      }
      if (sRes.ok) {
        const s = await sRes.json()
        setStakeholders(s.stakeholders ?? [])
      }
      if (bRes.ok) {
        const b = await bRes.json()
        setItems(b.items ?? [])
        setSprints(b.sprints ?? [])
      }
    } catch {
      setLoadError("Error de conexión al cargar la implementación.")
    } finally {
      setInitialLoading(false)
    }
  }, [id])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const invitar = async () => {
    setLoading(true)
    try {
      await fetch(`/api/claver/implementaciones/${id}/stakeholders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ nombre, email }),
      })
      setNombre("")
      setEmail("")
      await cargar()
    } finally {
      setLoading(false)
    }
  }

  const syncScrum = async () => {
    setLoading(true)
    try {
      await fetch(`/api/claver/implementaciones/${id}/scrum`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "sync" }),
      })
      await cargar()
    } finally {
      setLoading(false)
    }
  }

  const crearSprint = async () => {
    if (!sprintNombre.trim()) return
    setLoading(true)
    try {
      await fetch(`/api/claver/implementaciones/${id}/scrum`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          action: "create_sprint",
          nombre: sprintNombre.trim(),
          inicio: sprintInicio,
          fin: sprintFin,
        }),
      })
      setSprintNombre("")
      await cargar()
    } finally {
      setLoading(false)
    }
  }

  const mover = async (itemId: string, estado: string) => {
    await fetch(`/api/claver/implementaciones/${id}/scrum`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ action: "move", itemId, estado }),
    })
    await cargar()
  }

  const asignarSprint = async (itemId: string, sprintId: string) => {
    await fetch(`/api/claver/implementaciones/${id}/scrum`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        action: "assign_sprint",
        itemId,
        sprintId: sprintId || null,
      }),
    })
    await cargar()
  }

  const signUat = async () => {
    if (!uatSignature) return
    setLoading(true)
    setUatOk("")
    try {
      const res = await fetch(`/api/claver/uat/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          signatureName: uatSignature,
          comments: uatComments,
        }),
      })
      if (res.ok) {
        setUatOk("Acta firmada. El proyecto puede avanzar a go-live.")
        setUatSignature("")
        setUatComments("")
        await cargar()
      } else {
        setLoadError("No se pudo firmar el acta UAT. Reintentá.")
      }
    } finally {
      setLoading(false)
    }
  }

  const sprintActivo = sprints.find((s) => s.activo)
  const doneCount = items.filter((i) => i.estado === "done").length

  if (initialLoading) {
    return <PageSkeleton kpis={0} tableRows={8} tableCols={3} />
  }

  if (loadError && stakeholders.length === 0 && items.length === 0) {
    return (
      <PageShell className="max-w-5xl">
        <EmptyState
          icon={ClipboardList}
          title="No se pudo cargar el proyecto"
          description={loadError}
          actionLabel="Reintentar"
          onAction={() => {
            setInitialLoading(true)
            void cargar()
          }}
          secondaryActionLabel="Volver al listado"
          onSecondaryAction={() => {
            window.location.href = "/claver-cloud/implementation"
          }}
        />
      </PageShell>
    )
  }

  return (
    <PageShell className="max-w-5xl">
      <div className="flex flex-wrap gap-2 -ml-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/claver-cloud/implementation">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Implementaciones
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/claver-cloud/go-live">Go-live</Link>
        </Button>
      </div>

      <PageHeader
        variant="surface"
        title={`Proyecto #${id}`}
        description="Stakeholders del portal cliente, sprints, tablero Scrum y firma de acta UAT para go-live."
        badge={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <ClipboardList className="h-3.5 w-3.5" />
            Seguimiento CCA
          </span>
        }
        statusSlot={
          <div className="flex flex-wrap gap-2">
            <StatusBadge variant="neutral" label={`${stakeholders.length} stakeholders`} />
            <StatusBadge
              variant={doneCount > 0 ? "success" : "info"}
              label={`${doneCount}/${items.length} done`}
            />
            {sprintActivo && <StatusBadge variant="info" label={`Sprint: ${sprintActivo.nombre}`} />}
          </div>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void syncScrum()}
            className="min-h-[40px]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Sincronizar CCA
          </Button>
        }
      />

      {loadError && (
        <p className="text-sm text-[var(--status-error-foreground)]">{loadError}</p>
      )}
      {uatOk && (
        <p className="text-sm text-[var(--status-success-foreground)] rounded-lg border border-[var(--status-success-border)] bg-[var(--status-success-muted)] px-3 py-2">
          {uatOk}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Stakeholders (portal cliente)
          </CardTitle>
          <CardDescription>
            Invitados acceden en <code className="text-xs">/claver-cliente</code> para ver avance y tickets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} className="min-h-[40px]" />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-[40px]"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => void invitar()}
                disabled={loading || !nombre || !email}
                className="w-full min-h-[40px]"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invitar
              </Button>
            </div>
          </div>
          {stakeholders.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Sin stakeholders todavía"
              description="Invitá al contacto del cliente para que siga el proyecto desde el portal."
            />
          ) : (
            <ul className="text-sm space-y-2">
              {stakeholders.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <span className="font-medium">{s.nombre}</span>
                  <span className="text-muted-foreground text-xs">{s.email}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarPlus className="h-4 w-4 text-primary" />
            Sprints
          </CardTitle>
          <CardDescription>Planificá ventanas de trabajo y asigná ítems del tablero.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sprintActivo && (
            <p className="text-sm rounded-lg border bg-muted/40 px-3 py-2">
              Activo: <span className="font-medium">{sprintActivo.nombre}</span>{" "}
              <span className="text-muted-foreground">
                ({sprintActivo.inicio} → {sprintActivo.fin})
              </span>
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <Label>Nombre</Label>
              <Input
                placeholder="Sprint 1"
                value={sprintNombre}
                onChange={(e) => setSprintNombre(e.target.value)}
                className="min-h-[40px]"
              />
            </div>
            <div>
              <Label>Inicio</Label>
              <Input
                type="date"
                value={sprintInicio}
                onChange={(e) => setSprintInicio(e.target.value)}
                className="min-h-[40px]"
              />
            </div>
            <div>
              <Label>Fin</Label>
              <Input
                type="date"
                value={sprintFin}
                onChange={(e) => setSprintFin(e.target.value)}
                className="min-h-[40px]"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => void crearSprint()}
                disabled={loading || !sprintNombre.trim() || !sprintInicio || !sprintFin}
                className="w-full min-h-[40px]"
              >
                Crear sprint
              </Button>
            </div>
          </div>
          {sprints.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-1">
              {sprints.map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <StatusBadge variant={s.activo ? "info" : "neutral"} label={s.activo ? "Activo" : "Cerrado"} />
                  <span>
                    {s.nombre} ({s.inicio} → {s.fin})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              Tablero Scrum
            </CardTitle>
            <CardDescription>
              Mové estados y asigná sprint. Sincronizá desde CCA / marketplace / tickets.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => void syncScrum()}
            className="min-h-[40px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title="Sin ítems en el tablero"
              description="Usá Sincronizar para importar fases CCA, tareas de marketplace y tickets."
              actionLabel="Sincronizar ahora"
              onAction={() => void syncScrum()}
            />
          ) : (
            items.map((i) => (
              <div
                key={i.id}
                className="flex flex-wrap items-center gap-2 border rounded-lg p-3 text-sm hover:bg-muted/30 transition-colors"
              >
                <span className="font-medium flex-1 min-w-[140px]">{i.titulo}</span>
                <Badge variant="outline" className="text-xs">
                  {i.tipo}
                </Badge>
                <StatusBadge variant={scrumVariant(i.estado)} label={ESTADO_LABEL[i.estado] ?? i.estado} />
                {sprints.length > 0 && (
                  <select
                    className="text-xs border rounded-md px-2 py-2 bg-background min-h-[36px]"
                    value={i.sprintId ?? ""}
                    onChange={(e) => void asignarSprint(i.id, e.target.value)}
                    aria-label={`Sprint de ${i.titulo}`}
                  >
                    <option value="">Sin sprint</option>
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                )}
                <select
                  className="text-xs border rounded-md px-2 py-2 bg-background min-h-[36px]"
                  value={i.estado}
                  onChange={(e) => void mover(i.id, e.target.value)}
                  aria-label={`Estado de ${i.titulo}`}
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>
                      {ESTADO_LABEL[e] ?? e}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-primary" />
            Acta UAT y go-live digital
          </CardTitle>
          <CardDescription>
            Al firmar, confirmás que el cliente probó el sistema y acepta el paso a producción.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Firma del cliente (nombre completo)</Label>
              <Input
                placeholder="Ej. Juan Pérez"
                value={uatSignature}
                onChange={(e) => setUatSignature(e.target.value)}
                className="min-h-[40px]"
              />
            </div>
            <div>
              <Label>Comentarios o salvedades</Label>
              <Input
                placeholder="Observaciones finales…"
                value={uatComments}
                onChange={(e) => setUatComments(e.target.value)}
                className="min-h-[40px]"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => void signUat()}
              disabled={loading || !uatSignature.trim()}
              className="min-h-[40px]"
            >
              Firmar acta UAT
            </Button>
            <Button variant="outline" asChild className="min-h-[40px]">
              <Link href="/claver-cloud/go-live">Ir a cola go-live</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  )
}
