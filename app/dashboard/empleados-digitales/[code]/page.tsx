"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { PageShell, PageHeader } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authFetch } from "@/lib/stores"
import { Check, Loader2, Pause, Play, RefreshCw, X } from "lucide-react"

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

export default function EmpleadoDetailPage() {
  const params = useParams()
  const code = String(params.code || "")

  const [empleado, setEmpleado] = useState<EmpleadoDetail | null>(null)
  const [template, setTemplate] = useState<{ nombre?: string; lema?: string; descripcion?: string } | null>(null)
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")
  const [running, setRunning] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)
  const [editMsg, setEditMsg] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [resEmp, resTar] = await Promise.all([
        authFetch(`/api/empleados-digitales/${code}`),
        authFetch(`/api/empleados-digitales/${code}/tareas?estado=pendiente`),
      ])
      const dataEmp = await resEmp.json()
      const dataTar = await resTar.json().catch(() => ({ tareas: [] }))

      if (!resEmp.ok && dataEmp.error) {
        setError(dataEmp.error)
        return
      }
      setEmpleado(dataEmp.empleado)
      setTemplate(dataEmp.template)
      if (resTar.ok) setTareas(dataTar.tareas || [])
      else setTareas([])
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => {
    load()
  }, [load])

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
    await authFetch(`/api/empleados-digitales/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: { llmEnabled } }),
    })
    load()
  }

  const runNow = async () => {
    setRunning(true)
    setError("")
    setMsg("")
    try {
      const res = await authFetch(`/api/empleados-digitales/${code}/run`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Error al correr")
        return
      }
      setMsg(data.resumen || "Corrida OK")
      await load()
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
      await load()
    } finally {
      setActingId(null)
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center gap-2 text-muted-foreground p-8">
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
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">{template?.descripcion}</p>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={activar}>Activar ahora</Button>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  const money = (n: number | null) =>
    n == null
      ? "—"
      : new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: "ARS",
          maximumFractionDigits: 0,
        }).format(n)

  return (
    <PageShell>
      <PageHeader
        title={empleado.nombre}
        description={empleado.lema || "Cobranza híbrida: plantillas + aprobación humana"}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={load} title="Actualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/empleados-digitales">Todos</Link>
            </Button>
            <Button onClick={runNow} disabled={running || empleado.estado === "pausado"}>
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Corriendo…
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" /> Correr ahora
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

      <div className="grid gap-4 md:grid-cols-4 mb-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{empleado.tareasPendientes}</div>
            <div className="text-xs text-muted-foreground">Borradores pendientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{empleado.runsTotal}</div>
            <div className="text-xs text-muted-foreground">Corridas totales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{empleado.accionesMes}</div>
            <div className="text-xs text-muted-foreground">Acciones este mes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{empleado.tokensMes}</div>
            <div className="text-xs text-muted-foreground">Tokens LLM este mes</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
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
                onCheckedChange={toggleEstado}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>LLM en casos difíciles (20%)</Label>
              <Switch checked={!!empleado.config?.llmEnabled} onCheckedChange={toggleLlm} />
            </div>
            <p className="text-xs text-muted-foreground">
              Por defecto Leo usa plantillas (0 tokens). El LLM solo reescribe mensajes de deudas altas o muy
              vencidas si lo activás.
            </p>
            <Badge variant="outline">Estado: {empleado.estado}</Badge>
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
                <div className="flex flex-wrap items-center gap-2 mb-1">
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
        <CardHeader>
          <CardTitle className="text-base">Cola de WhatsApp (borradores)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tareas.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay borradores pendientes. Corré a Leo para generar recordatorios.
            </p>
          )}
          {tareas.map((t) => (
            <div key={t.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge>Cliente #{t.clienteId}</Badge>
                <Badge variant="outline">{money(t.montoArs)}</Badge>
                {t.diasVencido != null && (
                  <Badge variant="secondary">{t.diasVencido} días</Badge>
                )}
                <Badge variant="outline">{t.origenMensaje}</Badge>
                {t.telefono && <span className="text-muted-foreground text-xs">{t.telefono}</span>}
              </div>
              <Textarea
                value={editMsg[t.id] ?? t.mensaje ?? ""}
                onChange={(e) => setEditMsg((m) => ({ ...m, [t.id]: e.target.value }))}
                rows={3}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => accionTarea(t.id, "aprobar")} disabled={actingId === t.id}>
                  <Check className="h-4 w-4 mr-1" /> Aprobar envío
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => accionTarea(t.id, "rechazar")}
                  disabled={actingId === t.id}
                >
                  <X className="h-4 w-4 mr-1" /> Descartar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  )
}
