"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Play,
  Power,
  RefreshCw,
  Server,
  TestTube,
  Upload,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KpiStrip, PageHeader, PageShell } from "@/components/layout"
import { OpsLogsPanel } from "@/components/ops/ops-logs-panel"
import { OpsTecnicoPanel } from "@/components/ops/ops-tecnico-panel"
import { OPS_JOB_LABELS } from "@/lib/ops/ops-types"
import type { OpsJobTipo } from "@/lib/ops/ops-types"

type Entorno = {
  id: number
  codigo: string
  nombre: string
  estado: string
  urlBase: string | null
  version: string | null
  dbProveedor: string | null
  dbNombre: string | null
  ultimoHealthcheck: string | null
}

type OpsJob = {
  id: number
  tipo: string
  estado: string
  iniciadoPor: string
  createdAt: string
  finishedAt: string | null
  errorMsg: string | null
}

type Pipeline = {
  id: number
  nombre: string
  estado: string
  pasoActual: number
  pasos: { orden: number; nombre: string; estado: string; detalle?: string }[]
}

type SistemaLog = {
  id: number
  severidad: string
  categoria: string
  contexto: string
  mensaje: string
  createdAt: string
}

type ErrorFuncional = {
  tipo: string
  ref: string
  mensaje: string
  severidad: string
  modulo: string | null
  createdAt: string
}

type Overview = {
  entornos: Entorno[]
  jobs: OpsJob[]
  pipelines: Pipeline[]
  logs: SistemaLog[]
  erroresFuncionales: ErrorFuncional[]
  resumen: {
    entornosActivos: number
    jobsActivos: number
    pipelinesEnCurso: number
    logsError24h: number
    ticketsAbiertos: number
    version: string
    ambienteRuntime: string
    vercelEnv: string
  }
}

function estadoColor(estado: string) {
  if (estado === "activo" || estado === "completado" || estado === "ok") return "bg-emerald-500/10 text-emerald-700 border-emerald-300"
  if (estado === "error" || estado === "fatal" || estado === "rechazado") return "bg-red-500/10 text-red-700 border-red-300"
  if (estado === "en_progreso" || estado === "en_curso" || estado === "desplegando") return "bg-blue-500/10 text-blue-700 border-blue-300"
  if (estado === "mantenimiento" || estado === "detenido") return "bg-amber-500/10 text-amber-800 border-amber-300"
  return "bg-slate-500/10 text-slate-700 border-slate-300"
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface OpsConsoleProps {
  mode: "tenant" | "analyst"
  empresaId?: number
  empresaNombre?: string
  backHref?: string
}

export function OpsConsole({ mode, empresaId, empresaNombre, backHref }: OpsConsoleProps) {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const baseUrl =
    mode === "tenant"
      ? "/api/ops"
      : `/api/claver/ops/${empresaId}`

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const url = mode === "tenant" ? `${baseUrl}/overview` : baseUrl
      const res = await fetch(url, { headers: authHeaders() })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [baseUrl, mode])

  useEffect(() => {
    void cargar()
    const t = setInterval(() => void cargar(), 8000)
    return () => clearInterval(t)
  }, [cargar])

  const dispararJob = async (tipo: OpsJobTipo, entornoId?: number) => {
    setActionLoading(tipo)
    try {
      const jobsUrl = mode === "tenant" ? "/api/ops/jobs" : `/api/claver/ops/${empresaId}/jobs`
      await fetch(jobsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ tipo, entornoId }),
      })
      await cargar()
    } finally {
      setActionLoading(null)
    }
  }

  const pipelineAction = async (action: "create" | "advance", pipelineId?: number) => {
    setActionLoading(action)
    try {
      const url = mode === "tenant" ? "/api/ops/pipelines" : `/api/claver/ops/${empresaId}/pipelines`
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action, pipelineId }),
      })
      await cargar()
    } finally {
      setActionLoading(null)
    }
  }

  const cambiarEntorno = async (entornoId: number, estado: string) => {
    setActionLoading(`entorno-${entornoId}`)
    try {
      const url =
        mode === "tenant"
          ? `/api/ops/entornos/${entornoId}`
          : `/api/claver/ops/${empresaId}/entornos/${entornoId}`
      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ estado }),
      })
      await cargar()
    } finally {
      setActionLoading(null)
    }
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-sm text-muted-foreground">
        {loading ? "Cargando consola de operaciones…" : "No se pudo cargar la consola"}
      </div>
    )
  }

  const pipelineActivo = data.pipelines[0]
  const logsUrl =
    mode === "tenant" ? "/api/ops/logs" : `/api/claver/ops/${empresaId}/logs`

  const resumenContent = (
    <>
      <KpiStrip
        items={[
          { label: "Entornos activos", value: data.resumen.entornosActivos, icon: Server },
          { label: "Jobs en curso", value: data.resumen.jobsActivos, icon: Activity },
          { label: "Errores sistema", value: data.resumen.logsError24h, icon: AlertTriangle },
          { label: "Tickets abiertos", value: data.resumen.ticketsAbiertos, icon: AlertTriangle },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {data.entornos.map((ent) => (
          <Card key={ent.id} className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  {ent.nombre}
                  <Badge variant="outline" className="uppercase text-[10px]">{ent.codigo}</Badge>
                </CardTitle>
                <Badge variant="outline" className={estadoColor(ent.estado)}>{ent.estado}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="text-xs text-muted-foreground space-y-1">
                <p>URL: {ent.urlBase ?? "—"}</p>
                <p>DB: {ent.dbProveedor} / {ent.dbNombre ?? "—"}</p>
                <p>Versión: {ent.version ?? "—"}</p>
                <p>
                  Health:{" "}
                  {ent.ultimoHealthcheck
                    ? new Date(ent.ultimoHealthcheck).toLocaleString("es-AR")
                    : "Sin chequeo"}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" disabled={!!actionLoading} onClick={() => dispararJob("healthcheck", ent.id)}>
                  <Activity className="h-3 w-3 mr-1" />
                  Health
                </Button>
                <Button size="sm" variant="outline" disabled={!!actionLoading} onClick={() => cambiarEntorno(ent.id, "activo")}>
                  <Power className="h-3 w-3 mr-1" />On
                </Button>
                <Button size="sm" variant="outline" disabled={!!actionLoading} onClick={() => cambiarEntorno(ent.id, "mantenimiento")}>
                  Mant.
                </Button>
                <Button size="sm" variant="outline" disabled={!!actionLoading} onClick={() => cambiarEntorno(ent.id, "detenido")}>
                  Off
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones operativas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(["backup_db", "migrate_db", "restart_app", "test_suite", "deploy"] as OpsJobTipo[]).map((tipo) => (
            <Button
              key={tipo}
              variant="outline"
              size="sm"
              disabled={!!actionLoading}
              onClick={() => dispararJob(tipo)}
            >
              {tipo === "backup_db" && <Database className="h-3 w-3 mr-1" />}
              {tipo === "migrate_db" && <Upload className="h-3 w-3 mr-1" />}
              {tipo === "restart_app" && <Power className="h-3 w-3 mr-1" />}
              {tipo === "test_suite" && <TestTube className="h-3 w-3 mr-1" />}
              {tipo === "deploy" && <Play className="h-3 w-3 mr-1" />}
              {OPS_JOB_LABELS[tipo]}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Pipeline VAL → PRD</CardTitle>
          <div className="flex gap-2">
            {!pipelineActivo && (
              <Button size="sm" disabled={!!actionLoading} onClick={() => pipelineAction("create")}>
                Crear pipeline
              </Button>
            )}
            {pipelineActivo && pipelineActivo.estado !== "completado" && (
              <Button size="sm" disabled={!!actionLoading} onClick={() => pipelineAction("advance", pipelineActivo.id)}>
                Avanzar paso <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!pipelineActivo && <p className="text-sm text-muted-foreground">Sin pipeline activo.</p>}
          {pipelineActivo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className={estadoColor(pipelineActivo.estado)}>{pipelineActivo.estado}</Badge>
                <span>Paso {pipelineActivo.pasoActual + 1} / {pipelineActivo.pasos.length}</span>
              </div>
              {pipelineActivo.pasos.map((p) => (
                <div key={p.orden} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    {p.estado === "ok" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    {p.estado === "error" && <XCircle className="h-4 w-4 text-red-600" />}
                    {p.orden}. {p.nombre}
                  </span>
                  <Badge variant="outline" className={estadoColor(p.estado)}>{p.estado}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Logs de sistema</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {data.logs.map((log) => (
              <div key={log.id} className="border rounded-md p-2 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={estadoColor(log.severidad)}>{log.severidad}</Badge>
                  <span className="text-muted-foreground">{log.categoria} · {log.contexto}</span>
                </div>
                <p>{log.mensaje}</p>
                <p className="text-muted-foreground mt-1">{new Date(log.createdAt).toLocaleString("es-AR")}</p>
              </div>
            ))}
            {data.logs.length === 0 && <p className="text-sm text-muted-foreground">Sin logs registrados.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Errores funcionales</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {data.erroresFuncionales.map((err, i) => (
              <div key={`${err.ref}-${i}`} className="border rounded-md p-2 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{err.tipo}</Badge>
                  <Badge variant="outline" className={estadoColor(err.severidad)}>{err.severidad}</Badge>
                  <span className="text-muted-foreground">{err.modulo ?? "general"}</span>
                </div>
                <p className="font-medium">{err.ref}</p>
                <p>{err.mensaje}</p>
                <p className="text-muted-foreground mt-1">{new Date(err.createdAt).toLocaleString("es-AR")}</p>
              </div>
            ))}
            {data.erroresFuncionales.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin errores funcionales recientes.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Historial de jobs</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
              <div>
                <p className="font-medium">#{job.id} — {OPS_JOB_LABELS[job.tipo as OpsJobTipo] ?? job.tipo}</p>
                <p className="text-xs text-muted-foreground">{job.iniciadoPor} · {new Date(job.createdAt).toLocaleString("es-AR")}</p>
                {job.errorMsg && <p className="text-xs text-red-600">{job.errorMsg}</p>}
              </div>
              <Badge variant="outline" className={estadoColor(job.estado)}>{job.estado}</Badge>
            </div>
          ))}
          {data.jobs.length === 0 && <p className="text-sm text-muted-foreground">Sin jobs ejecutados.</p>}
        </CardContent>
      </Card>
    </>
  )

  return (
    <PageShell>
      <PageHeader
        variant="surface"
        title={mode === "analyst" ? `VPS — ${empresaNombre ?? `Cliente #${empresaId}`}` : "Centro de Operaciones"}
        description={
          mode === "analyst"
            ? "Panel técnico del tenant: entornos, logs, errores, backups, migraciones y pipeline VAL→PRD."
            : "Estado de tus entornos, logs del sistema, errores funcionales y operaciones de mantenimiento."
        }
        badge={
          <Badge variant="outline" className="bg-primary/5">
            {data.resumen.vercelEnv} · v{data.resumen.version}
          </Badge>
        }
        actions={
          <div className="flex gap-2">
            {backHref && (
              <Button variant="outline" asChild>
                <Link href={backHref}>Volver</Link>
              </Button>
            )}
            <Button variant="outline" onClick={cargar} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="resumen" className="gap-4">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          {mode === "tenant" && <TabsTrigger value="tecnico">Datos técnicos</TabsTrigger>}
        </TabsList>
        <TabsContent value="resumen">{resumenContent}</TabsContent>
        <TabsContent value="logs"><OpsLogsPanel logsUrl={logsUrl} /></TabsContent>
        {mode === "tenant" && (
          <TabsContent value="tecnico"><OpsTecnicoPanel /></TabsContent>
        )}
      </Tabs>
    </PageShell>
  )
}