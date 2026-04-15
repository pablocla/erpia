/**
 * Agent Types — Core types for the autonomous agent system
 *
 * Each agent: runs on schedule, reacts to events, reads ERP data,
 * takes actions (create alerts, send messages, generate reports).
 */

export type AgentId =
  | "alertas-stock"
  | "cobranzas"
  | "ventas-leads"
  | "compras-predictivo"
  | "anomalias"
  | "reportes"
  | "community-manager"
  | "marketing"
  | "onboarding"
  | "clasificador-productos"

export type AgentStatus = "idle" | "running" | "error" | "disabled"

export type AgentSchedule =
  | { type: "cron"; expression: string; label: string }
  | { type: "interval"; minutes: number; label: string }
  | { type: "event"; events: string[]; label: string }
  | { type: "manual"; label: string }

export type AgentTier = "realtime" | "batch" | "nightly"

export interface AgentConfig {
  id: AgentId
  nombre: string
  descripcion: string
  icono: string
  categoria: "operativo" | "comercial" | "marketing" | "financiero"
  tier: AgentTier
  schedule: AgentSchedule
  /** Events that trigger this agent reactively */
  reactsTo: string[]
  /** Default enabled state for new empresas */
  defaultEnabled: boolean
}

export interface AgentRunContext {
  empresaId: number
  userId?: number
  triggeredBy: "schedule" | "event" | "manual" | "api"
  eventPayload?: unknown
}

export interface AgentRunResult {
  agentId: AgentId
  empresaId: number
  success: boolean
  /** Summary of what the agent did */
  resumen: string
  /** Number of actions taken */
  accionesEjecutadas: number
  /** Detailed action log */
  acciones: AgentAction[]
  durationMs: number
  error?: string
}

export interface AgentAction {
  tipo: "alerta_creada" | "mensaje_generado" | "reporte_generado" | "producto_clasificado"
    | "reposicion_sugerida" | "anomalia_detectada" | "post_generado" | "campana_creada"
    | "email_enviado" | "notificacion" | "configuracion"
  descripcion: string
  datos?: Record<string, unknown>
}

export interface AgentLog {
  id: string
  agentId: AgentId
  empresaId: number
  triggeredBy: string
  status: "success" | "error" | "skipped"
  resumen: string
  accionesEjecutadas: number
  durationMs: number
  error?: string
  createdAt: Date
}

export interface AgentStatusInfo {
  agentId: AgentId
  config: AgentConfig
  status: AgentStatus
  enabled: boolean
  lastRun?: Date
  lastResult?: "success" | "error"
  totalRuns: number
  totalActions: number
}
