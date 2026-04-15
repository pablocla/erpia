"use client"

import { useState } from "react"
import { useAuthFetch } from "@/hooks/use-auth-fetch"
import { authFetch } from "@/lib/stores/auth-store"
import { cn } from "@/lib/utils"
import { useKeyboardShortcuts, erpShortcuts } from "@/hooks/use-keyboard-shortcuts"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentStatusInfo {
  agentId: string
  config: {
    id: string
    nombre: string
    descripcion: string
    icono: string
    categoria: string
    tier: string
    schedule: { type: string; label: string }
    reactsTo: string[]
    defaultEnabled: boolean
  }
  status: "idle" | "running" | "error" | "disabled"
  enabled: boolean
  lastRun?: string
  lastResult?: "success" | "error"
  totalRuns: number
  totalActions: number
}

interface AgentListResponse {
  agentes: AgentStatusInfo[]
  total: number
  activos: number
  ejecutando: number
}

interface AgentLogEntry {
  id: number
  agenteId: string
  triggeredBy: string
  status: string
  resumen: string
  accionesEjecutadas: number
  durationMs: number
  error?: string
  detalles?: any
  createdAt: string
}

interface LogsResponse {
  logs: AgentLogEntry[]
  total: number
  stats: Array<{
    agenteId: string
    totalEjecuciones: number
    totalAcciones: number
    tiempoTotalMs: number
    tiempoPromedioMs: number
  }>
}

// ─── Icon mapping ─────────────────────────────────────────────────────────────

const ICONS: Record<string, string> = {
  "package-search": "📦",
  banknote: "💰",
  "message-circle": "💬",
  "shopping-cart": "🛒",
  "shield-alert": "🛡️",
  "file-text": "📊",
  "share-2": "📱",
  megaphone: "📣",
  tags: "🏷️",
  rocket: "🚀",
}

const STATUS_COLORS: Record<string, string> = {
  idle: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  running: "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  disabled: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
}

const CATEGORY_COLORS: Record<string, string> = {
  operativo: "bg-blue-500/10 text-blue-400",
  comercial: "bg-amber-500/10 text-amber-400",
  marketing: "bg-purple-500/10 text-purple-400",
  financiero: "bg-emerald-500/10 text-emerald-400",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface AutopilotResponse {
  autopilot: boolean
  agentes: Array<{ id: string; enabled: boolean }>
}

export default function AgentesPage() {
  const { data, mutate, isLoading } = useAuthFetch<AgentListResponse>("/api/ai/agentes")
  const { data: logsData } = useAuthFetch<LogsResponse>("/api/ai/agentes/logs?limit=30")
  const { data: autopilotData, mutate: mutateAutopilot } = useAuthFetch<AutopilotResponse>("/api/ai/agentes/autopilot")
  const [executing, setExecuting] = useState<string | null>(null)
  const [batchRunning, setBatchRunning] = useState(false)
  const [selectedLog, setSelectedLog] = useState<string | null>(null)
  const [togglingAutopilot, setTogglingAutopilot] = useState(false)

  useKeyboardShortcuts(erpShortcuts({
    onRefresh: () => { mutate() },
  }))

  async function handleAutopilot() {
    setTogglingAutopilot(true)
    try {
      const newState = !(autopilotData?.autopilot ?? false)
      await authFetch("/api/ai/agentes/autopilot", {
        method: "POST",
        body: JSON.stringify({ enabled: newState }),
      })
      mutateAutopilot()
      mutate()
    } finally {
      setTogglingAutopilot(false)
    }
  }

  async function handleToggle(agentId: string, currentEnabled: boolean) {
    await authFetch("/api/ai/agentes", {
      method: "PATCH",
      body: JSON.stringify({ agentId, enabled: !currentEnabled }),
    })
    mutate()
    mutateAutopilot()
  }

  async function handleExecute(agentId: string) {
    setExecuting(agentId)
    try {
      await authFetch("/api/ai/agentes", {
        method: "POST",
        body: JSON.stringify({ agentId }),
      })
      mutate()
    } finally {
      setExecuting(null)
    }
  }

  async function handleBatchRun() {
    setBatchRunning(true)
    try {
      await authFetch("/api/ai/agentes/batch", { method: "POST" })
      mutate()
    } finally {
      setBatchRunning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted/50 animate-pulse rounded-xl border border-border" />
          ))}
        </div>
      </div>
    )
  }

  const agentes = data?.agentes ?? []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agentes IA Autónomos</h1>
          <p className="text-muted-foreground">
            {data?.activos ?? 0} activos de {data?.total ?? 0} · {data?.ejecutando ?? 0} ejecutándose
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Autopilot Toggle */}
          <button
            onClick={handleAutopilot}
            disabled={togglingAutopilot}
            className={cn(
              "px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2",
              autopilotData?.autopilot
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30"
                : "bg-muted text-muted-foreground border border-border hover:bg-accent",
              togglingAutopilot && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", autopilotData?.autopilot ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground")} />
            {togglingAutopilot ? "Cambiando..." : autopilotData?.autopilot ? "Piloto Automático ON" : "Piloto Automático OFF"}
          </button>

          <button
            onClick={handleBatchRun}
            disabled={batchRunning}
            className={cn(
              "px-4 py-2 rounded-lg font-medium text-sm transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              batchRunning && "opacity-50 cursor-not-allowed"
            )}
          >
            {batchRunning ? "Ejecutando todos..." : "▶ Ejecutar todos"}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Agentes activos", value: data?.activos ?? 0, color: "text-emerald-400" },
          { label: "Ejecuciones hoy", value: logsData?.logs.filter((l) => isToday(l.createdAt)).length ?? 0, color: "text-blue-400" },
          { label: "Acciones totales", value: logsData?.stats.reduce((s, x) => s + x.totalAcciones, 0) ?? 0, color: "text-purple-400" },
          { label: "Errores recientes", value: logsData?.logs.filter((l) => l.status === "error").length ?? 0, color: "text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
            <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agentes.map((agent) => (
          <div
            key={agent.agentId}
            className={cn(
              "bg-card border rounded-xl p-5 space-y-3 transition-all",
              agent.enabled ? "border-border hover:border-primary/50" : "border-border/50 opacity-60"
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{ICONS[agent.config.icono] ?? "🤖"}</span>
                <div>
                  <h3 className="font-semibold text-sm leading-tight">{agent.config.nombre}</h3>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", CATEGORY_COLORS[agent.config.categoria])}>
                    {agent.config.categoria}
                  </span>
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => handleToggle(agent.agentId, agent.enabled)}
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors",
                  agent.enabled ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                    agent.enabled ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed">{agent.config.descripcion}</p>

            {/* Status + Schedule */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", STATUS_COLORS[agent.status])}>
                {agent.status === "running" ? "⚡ ejecutando" : agent.status}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ⏰ {agent.config.schedule.label}
              </span>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{agent.totalRuns} ejecuciones</span>
              <span>{agent.totalActions} acciones</span>
              {agent.lastRun && (
                <span title={new Date(agent.lastRun).toLocaleString("es-AR")}>
                  Última: {timeAgo(agent.lastRun)}
                </span>
              )}
            </div>

            {/* Events */}
            {agent.config.reactsTo.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {agent.config.reactsTo.map((evt) => (
                  <span key={evt} className="text-[9px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                    ⚡{evt}
                  </span>
                ))}
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={() => handleExecute(agent.agentId)}
              disabled={!agent.enabled || executing === agent.agentId}
              className={cn(
                "w-full py-2 rounded-lg text-xs font-medium transition-colors",
                "border border-border hover:bg-accent",
                (!agent.enabled || executing === agent.agentId) && "opacity-50 cursor-not-allowed"
              )}
            >
              {executing === agent.agentId ? "Ejecutando..." : "▶ Ejecutar ahora"}
            </button>
          </div>
        ))}
      </div>

      {/* Execution Logs */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Historial de ejecuciones</h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Agente</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Resumen</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Acciones</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Tiempo</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {(logsData?.logs ?? []).map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-border/50 hover:bg-accent/30 cursor-pointer"
                  onClick={() => setSelectedLog(selectedLog === String(log.id) ? null : String(log.id))}
                >
                  <td className="px-4 py-2 font-medium text-xs">{log.agenteId}</td>
                  <td className="px-4 py-2">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full",
                      log.status === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    )}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground max-w-[300px] truncate">{log.resumen}</td>
                  <td className="px-4 py-2 text-right text-xs">{log.accionesEjecutadas}</td>
                  <td className="px-4 py-2 text-right text-xs text-muted-foreground">{(log.durationMs / 1000).toFixed(1)}s</td>
                  <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
              {(!logsData?.logs?.length) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Sin ejecuciones registradas. Ejecutá un agente para comenzar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}
