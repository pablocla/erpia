"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { PageShell, PageHeader } from "@/components/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { authFetch } from "@/lib/stores"
import {
  Check,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  X,
  TrendingUp,
  MessageSquare,
  Users,
  PhoneOff,
  Sparkles,
  CheckCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Tarea = {
  id: string
  estado: string
  clienteId: number | null
  montoArs: number | null
  diasVencido: number | null
  telefono: string | null
  mensaje: string | null
  origenMensaje: string
  createdAt: string
}

type Kpis = {
  deudaEnRadarArs: number
  deudoresEnRadar: number
  sinTelefono: number
  draftsPendientes: number
  enviadosMes: number
  draftsMes: number
  llmMes: number
  tokensMes: number
  arsRecuperadosMes: number
  recuperacionesCount: number
  periodMonth: string
  limites: { maxDraftsMes: number; maxLlmMes: number; maxWaSendMes: number }
  trial: boolean
  llmLocked: boolean
}

type EmpleadoDetail = {
  id: number
  code: string
  nombre: string
  lema?: string | null
  estado: string
  config: { llmEnabled?: boolean; diasVencidoMin?: number; maxDraftsPorRun?: number }
  lastRunAt?: string | null
  runsTotal: number
  tokensMes: number
  accionesMes: number
  tareasPendientes: number
  valorEstimadoArs?: number
  kpis?: Kpis
  lastRuns?: Array<{
    id: string
    status: string
    pathUsado: string
    resumen: string | null
    tokensIn: number
    tokensOut: number
    createdAt: string
  }>
}

const money = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(n)

export default function EmpleadoDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const code = String(params.code || "")
  const onboardingQ = searchParams.get("onboarding") === "1"

  const [empleado, setEmpleado] = useState<EmpleadoDetail | null>(null)
  const [template, setTemplate] = useState<{
    nombre?: string
    lema?: string
    descripcion?: string
  } | null>(null)
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")
  const [running, setRunning] = useState(false)
  const [preview, setPreview] = useState<Array<Record<string, unknown>> | null>(null)
  const [health, setHealth] = useState<{
    score: number
    grade: string
    recommendedActions: string[]
    reasons: Array<{ label: string; ok: boolean; points: number }>
  } | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [editMsg, setEditMsg] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(onboardingQ)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [resEmp, resTar, resHealth] = await Promise.all([
        authFetch(`/api/empleados-digitales/${code}`),
        authFetch(`/api/empleados-digitales/${code}/tareas?estado=pendiente`),
        authFetch(`/api/empleados-digitales/health`),
      ])
      const dataEmp = await resEmp.json()
      const dataTar = await resTar.json().catch(() => ({ tareas: [] }))
      const dataHealth = await resHealth.json().catch(() => null)

      if (!resEmp.ok && dataEmp.error) {
        setError(dataEmp.error)
        return
      }
      setEmpleado(dataEmp.empleado)
      setTemplate(dataEmp.template)
      if (resTar.ok) setTareas(dataTar.tareas || [])
      else setTareas([])
      if (resHealth.ok && dataHealth?.health) setHealth(dataHealth.health)
      else setHealth(null)

      // Onboarding auto si primera visita sin corridas
      if (
        dataEmp.empleado &&
        (onboardingQ || dataEmp.empleado.runsTotal === 0) &&
        !sessionStorage.getItem(`leo-ob-${code}-done`)
      ) {
        setShowOnboarding(true)
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }, [code, onboardingQ])

  useEffect(() => {
    load()
  }, [load])

  const kpis = empleado?.kpis
  const llmLocked = kpis?.llmLocked || empleado?.estado === "trial"

  const activar = async () => {
    setError("")
    const res = await authFetch("/api/empleados-digitales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "No se pudo activar")
      return
    }
    setMsg("Leo activado")
    setOnboardingStep(1)
    load()
  }

  const toggleEstado = async (activo: boolean) => {
    const res = await authFetch(`/api/empleados-digitales/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: activo ? "activo" : "pausado" }),
    })
    if (res.ok) load()
  }

  const toggleLlm = async (llmEnabled: boolean) => {
    if (llmLocked) {
      setError("En trial el LLM está bloqueado (0 tokens). Pasá a plan activo para habilitarlo.")
      return
    }
    await authFetch(`/api/empleados-digitales/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: { llmEnabled } }),
    })
    load()
  }

  const runNow = async (dryRun = false) => {
    setRunning(true)
    setError("")
    setMsg("")
    if (!dryRun) setPreview(null)
    try {
      const res = await authFetch(`/api/empleados-digitales/${code}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al correr")
        return
      }
      setMsg(data.resumen || (dryRun ? "Vista previa OK" : "Corrida OK"))
      if (dryRun && Array.isArray(data.preview)) {
        setPreview(data.preview)
      }
      if (!dryRun) {
        setOnboardingStep((s) => Math.max(s, 2))
        await load()
      }
    } finally {
      setRunning(false)
    }
  }

  const accionTarea = async (id: string, accion: "aprobar" | "rechazar") => {
    setActingId(id)
    try {
      const res = await authFetch(`/api/empleados-digitales/${code}/tareas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion,
          mensaje: editMsg[id] || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error")
        return
      }
      if (accion === "aprobar") {
        setOnboardingStep(3)
        sessionStorage.setItem(`leo-ob-${code}-done`, "1")
      }
      await load()
    } finally {
      setActingId(null)
    }
  }

  const bulk = async (accion: "aprobar" | "rechazar") => {
    const ids = [...selected].slice(0, 20)
    if (!ids.length) return
    if (
      accion === "aprobar" &&
      !window.confirm(`¿Aprobar envío de ${ids.length} WhatsApp? (máx 20)`)
    ) {
      return
    }
    setBulkBusy(true)
    try {
      const res = await authFetch(`/api/empleados-digitales/${code}/tareas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, ids }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error bulk")
        return
      }
      setMsg(`Bulk: ${data.ok} OK, ${data.fail} fallidos`)
      setSelected(new Set())
      await load()
    } finally {
      setBulkBusy(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else if (n.size < 20) n.add(id)
      return n
    })
  }

  const selectAll = () => {
    setSelected(new Set(tareas.slice(0, 20).map((t) => t.id)))
  }

  const draftUsagePct = useMemo(() => {
    if (!kpis) return 0
    return Math.min(100, Math.round((kpis.draftsMes / Math.max(1, kpis.limites.maxDraftsMes)) * 100))
  }, [kpis])

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center gap-2 p-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      </PageShell>
    )
  }

  if (!empleado) {
    return (
      <PageShell>
        <PageHeader
          title={template?.nombre || "Empleado digital"}
          description={template?.lema || "Activá este empleado para tu empresa"}
          actions={
            <Button variant="outline" asChild>
              <Link href="/dashboard/empleados-digitales">Volver</Link>
            </Button>
          }
        />
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-muted-foreground">{template?.descripcion}</p>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="rounded-lg border border-dashed p-4 text-sm">
              <p className="font-medium">Onboarding en 3 pasos</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>Activá a Leo</li>
                <li>Corré una pasada de deudas</li>
                <li>Aprobá el primer WhatsApp</li>
              </ol>
            </div>
            <Button onClick={() => void activar()} className="bg-emerald-600 hover:bg-emerald-500">
              <Sparkles className="mr-2 h-4 w-4" />
              Activar ahora
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        title={empleado.nombre}
        description={empleado.lema || "Cobranza híbrida: plantillas + aprobación humana"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="icon" onClick={() => void load()} title="Actualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/empleados-digitales">Todos</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => void runNow(true)}
              disabled={running || empleado.estado === "pausado"}
            >
              Vista previa
            </Button>
            <Button
              onClick={() => void runNow(false)}
              disabled={running || empleado.estado === "pausado"}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Corriendo…
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Correr ahora
                </>
              )}
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {msg && (
        <Alert className="mb-4">
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      )}

      {preview && preview.length > 0 && (
        <Card className="mb-4 border-sky-500/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vista previa (sin enviar)</CardTitle>
            <CardDescription>
              ED-20 dry-run · {preview.length} mensajes de ejemplo · ningún WhatsApp encolado
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {preview.map((p, i) => (
              <div key={i} className="rounded-md border p-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">#{String(p.clienteId)}</Badge>
                  <span className="font-medium">{String(p.clienteNombre ?? "")}</span>
                  <span className="text-muted-foreground">
                    {typeof p.monto === "number"
                      ? money(p.monto)
                      : String(p.monto ?? "")}
                  </span>
                  {!p.tieneTelefono && (
                    <Badge variant="destructive" className="text-[10px]">
                      sin tel
                    </Badge>
                  )}
                  {p.tieneLinkPago ? (
                    <Badge variant="secondary" className="text-[10px]">
                      link MP
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                  {String(p.mensajePreview ?? "")}
                </p>
              </div>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
              Cerrar preview
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ED-09 Onboarding */}
      {showOnboarding && (
        <Card className="mb-4 border-sky-500/40 bg-sky-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Primeros pasos con Leo</CardTitle>
            <CardDescription>En 3 pasos cobrás con WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { n: 1, t: "Activado", ok: true },
                { n: 2, t: "Correr deudas", ok: (empleado.runsTotal ?? 0) > 0 || onboardingStep >= 2 },
                { n: 3, t: "Aprobar 1 WA", ok: onboardingStep >= 3 },
              ].map((s) => (
                <div
                  key={s.n}
                  className={cn(
                    "rounded-lg border p-3 text-sm",
                    s.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-border",
                  )}
                >
                  <span className="font-mono text-xs text-muted-foreground">Paso {s.n}</span>
                  <p className="font-medium">{s.t}</p>
                </div>
              ))}
            </div>
            <Progress value={Math.min(100, ((onboardingStep || 1) / 3) * 100)} className="h-1.5" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowOnboarding(false)
                sessionStorage.setItem(`leo-ob-${code}-done`, "1")
              }}
            >
              Ocultar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PV-02 Health */}
      {health && (
        <Card className="mb-4 border-primary/20">
          <CardContent className="flex flex-wrap items-center gap-4 pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Health score adopción</p>
              <p className="text-3xl font-bold tabular-nums">
                {health.score}
                <span className="ml-2 text-lg text-muted-foreground">({health.grade})</span>
              </p>
            </div>
            <Progress value={health.score} className="h-2 max-w-xs flex-1" />
            <ul className="min-w-[200px] flex-1 text-[11px] text-muted-foreground">
              {health.recommendedActions.slice(0, 3).map((a) => (
                <li key={a}>· {a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ED-08 + ED-13 KPIs */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              Deuda en radar
            </div>
            <div className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {money(kpis?.deudaEnRadarArs ?? 0)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {kpis?.deudoresEnRadar ?? 0} deudores ·{" "}
              {kpis?.sinTelefono ? (
                <span className="text-amber-600">
                  <PhoneOff className="mr-0.5 inline h-3 w-3" />
                  {kpis.sinTelefono} sin tel
                </span>
              ) : (
                "cobertura OK"
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Recuperación estimada
            </div>
            <div className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-400">
              {money(kpis?.arsRecuperadosMes ?? empleado.valorEstimadoArs ?? 0)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {kpis?.recuperacionesCount ?? 0} atribuciones · mes {kpis?.periodMonth ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              Borradores / enviados
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {kpis?.draftsPendientes ?? empleado.tareasPendientes}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {kpis?.enviadosMes ?? 0}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Pendientes · enviados mes (límite {kpis?.limites.maxWaSendMes ?? "—"})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Uso mes (drafts)
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {kpis?.draftsMes ?? 0}
              <span className="text-sm font-normal text-muted-foreground">
                /{kpis?.limites.maxDraftsMes ?? "—"}
              </span>
            </div>
            <Progress value={draftUsagePct} className="mt-2 h-1" />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Tokens LLM: {kpis?.tokensMes ?? empleado.tokensMes}
              {llmLocked ? " · LLM bloqueado (trial)" : ` · LLM calls ${kpis?.llmMes ?? 0}`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                {empleado.estado === "pausado" ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Activo
              </Label>
              <Switch
                checked={empleado.estado === "activo" || empleado.estado === "trial"}
                onCheckedChange={(v) => void toggleEstado(v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className={cn(llmLocked && "text-muted-foreground")}>
                LLM casos difíciles (20%)
              </Label>
              <Switch
                checked={!!empleado.config?.llmEnabled && !llmLocked}
                disabled={llmLocked}
                onCheckedChange={(v) => void toggleLlm(v)}
              />
            </div>
            {llmLocked && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Trial: LLM off (0 tokens Gemini). Plantillas cubren el 100%.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Por defecto Leo usa plantillas (0 tokens). El LLM solo reescribe deudas altas/viejas si lo
              activás.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Estado: {empleado.estado}</Badge>
              {kpis?.trial && <Badge variant="secondary">Trial</Badge>}
            </div>
            {empleado.lastRunAt && (
              <p className="text-xs text-muted-foreground">
                Última corrida: {new Date(empleado.lastRunAt).toLocaleString("es-AR")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Últimas corridas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(empleado.lastRuns || []).length === 0 && (
              <p className="text-sm text-muted-foreground">Todavía no corrió. Usá «Correr ahora».</p>
            )}
            {(empleado.lastRuns || []).map((r) => (
              <div key={r.id} className="rounded-md border p-3 text-sm">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant={r.status === "success" ? "default" : "secondary"}>{r.status}</Badge>
                  <Badge variant="outline">{r.pathUsado}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString("es-AR")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    tokens {r.tokensIn + r.tokensOut}
                  </span>
                </div>
                <p className="text-muted-foreground">{r.resumen}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Cola de WhatsApp (borradores)</CardTitle>
            <CardDescription>Aprobá envíos o editá el texto antes</CardDescription>
          </div>
          {tareas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={selectAll}>
                Seleccionar 20
              </Button>
              <Button
                size="sm"
                disabled={bulkBusy || selected.size === 0}
                onClick={() => void bulk("aprobar")}
              >
                <CheckCheck className="mr-1 h-4 w-4" />
                Aprobar ({selected.size})
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={bulkBusy || selected.size === 0}
                onClick={() => void bulk("rechazar")}
              >
                Descartar sel.
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {tareas.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay borradores pendientes. Corré a Leo para generar recordatorios.
            </p>
          )}
          {tareas.map((t) => (
            <div key={t.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Checkbox
                  checked={selected.has(t.id)}
                  onCheckedChange={() => toggleSelect(t.id)}
                />
                <Badge>Cliente #{t.clienteId}</Badge>
                <Badge variant="outline">{money(t.montoArs)}</Badge>
                {t.diasVencido != null && (
                  <Badge variant="secondary">{t.diasVencido} días</Badge>
                )}
                <Badge variant="outline">{t.origenMensaje}</Badge>
                {t.telefono && <span className="text-xs text-muted-foreground">{t.telefono}</span>}
              </div>
              <Textarea
                value={editMsg[t.id] ?? t.mensaje ?? ""}
                onChange={(e) => setEditMsg((m) => ({ ...m, [t.id]: e.target.value }))}
                rows={3}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => void accionTarea(t.id, "aprobar")}
                  disabled={actingId === t.id}
                >
                  <Check className="mr-1 h-4 w-4" /> Aprobar envío
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void accionTarea(t.id, "rechazar")}
                  disabled={actingId === t.id}
                >
                  <X className="mr-1 h-4 w-4" /> Descartar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  )
}
