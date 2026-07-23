/**
 * Empleados digitales — tipos compartidos (Leo Cobranza y futuros)
 */

export const LEO_COBRANZA_CODE = "leo_cobranza" as const
export const LEO_COBRANZA_SKU = "empleado.leo_cobranza" as const
/** Alias comercial legacy */
export const LEO_LEGACY_SKU = "intang.cobranzas_wa" as const

export type EmpleadoEstado = "trial" | "activo" | "pausado" | "cancelado" | "error_config"
export type RunTrigger = "cron" | "event" | "manual" | "api"
export type RunStatus = "running" | "success" | "partial" | "error" | "skipped"
export type RunPath = "rules" | "hybrid" | "llm" | "none"
export type TareaEstado =
  | "pendiente"
  | "aprobada"
  | "rechazada"
  | "enviada"
  | "cancelada"
  | "error"
export type OrigenMensaje = "template" | "llm" | "manual"

export type LeoToolName =
  | "leer_deudas"
  | "generar_recordatorio"
  | "enviar_wa_borrador"
  | "enviar_wa_aprobado"
  | "actualizar_estado"
  | "personalizar_mensaje_llm"

export type EmpleadoLeoCobranzaConfig = {
  diasVencidoMin: number
  maxDraftsPorRun: number
  maxContactosCliente7d: number
  waMode: "borrador" | "auto_enviar"
  montoMinArs: number
  excluirClienteIds: number[]
  fuentes: Array<"cxc" | "fiado" | "factura">
  llmEnabled: boolean
  llmSoloSi: {
    diasVencidoMin: number
    montoMinArs: number
    primerContacto: boolean
  }
  tono: "formal" | "cercano"
  horarioLocal: { from: string; to: string }
  timezone: string
  notificarResumenA: "dueno" | "gerente" | "none"
  /** Límites mensuales soft */
  limites: {
    maxDraftsMes: number
    maxLlmMes: number
    maxWaSendMes: number
  }
}

export const DEFAULT_LEO_CONFIG: EmpleadoLeoCobranzaConfig = {
  diasVencidoMin: 7,
  maxDraftsPorRun: 15,
  maxContactosCliente7d: 2,
  waMode: "borrador",
  montoMinArs: 1000,
  excluirClienteIds: [],
  fuentes: ["cxc", "fiado"],
  llmEnabled: false,
  llmSoloSi: {
    diasVencidoMin: 30,
    montoMinArs: 50_000,
    primerContacto: true,
  },
  tono: "cercano",
  horarioLocal: { from: "09:00", to: "18:00" },
  timezone: "America/Argentina/Buenos_Aires",
  notificarResumenA: "dueno",
  limites: {
    maxDraftsMes: 300,
    maxLlmMes: 50,
    maxWaSendMes: 200,
  },
}

export type DeudaItem = {
  clienteId: number
  clienteNombre: string
  telefono: string
  montoArs: number
  diasVencido: number
  cuentaIds: number[]
  empresaNombre: string
  linkPago?: string
  score: number
}

export type RouteDecision =
  | { path: "template"; reason: string }
  | { path: "llm"; reason: string }
  | { path: "skip"; reason: string }

export type ToolContext = {
  empresaId: number
  empleadoId: number
  runId: bigint
  userId?: number
}

export type RunResult = {
  pathUsado: RunPath
  resumen: string
  tokensIn: number
  tokensOut: number
  accionesCount: number
  draftsCreados: number
  skipped: number
  detalles: Array<Record<string, unknown>>
}
