/**
 * Gatillos por índice de inflación — Claver (billing) + tenant (fiado, CxC, etc.)
 */

export type IndiceCodigo = "IPC_NACIONAL" | "IPC_GBA" | "UVA" | "MANUAL"

/** Subsystems that can consume inflation triggers */
export type InflacionSubsystem =
  | "billing_claver" // Claver cobra suscripciones a tenants
  | "fiado" // tenant fía a clientes
  | "cxc" // cuentas a cobrar genéricas
  | "cxp" // cuentas a pagar (opcional, info)
  | "listas_precio" // reexpresión de precios de catálogo
  | "presupuestos" // validez / reexpresión de presupuestos
  | "custom"

export type InflacionScope = "platform" | "empresa"

export interface IndicePeriodo {
  codigo: IndiceCodigo
  /** YYYY-MM */
  periodo: string
  /** Índice (base relativa, ej. 100, 102.9) */
  valor: number
  fuente: string
  publicadoAt?: string
}

export interface InflacionPolicyConfig {
  scope: InflacionScope
  /** null = platform (Claver) */
  empresaId?: number | null
  subsystem: InflacionSubsystem
  activo: boolean
  indiceCodigo: IndiceCodigo
  /**
   * Tope de variación por período (ej. 0.05 = 5% max por mes).
   * null = sin tope.
   */
  topeVariacionPeriodo: number | null
  /**
   * Días de gracia en los que el deudor puede pagar nominal
   * antes de aplicar el índice del período (fiado/cxc).
   */
  diasGraciaNominal: number
  /**
   * Si true, solo muestra pérdida / reexpresión informativa
   * sin cambiar el saldo cobrable (modo "alerta").
   */
  soloInformativo: boolean
  /**
   * Día del mes en que se considera “publicado” el índice del mes anterior
   * (INDEC ~15). Antes de ese día se usa el último índice disponible.
   */
  diaPublicacion: number
  notas?: string
}

export interface ReexpresionInput {
  montoOriginal: number
  /** ISO date o Date de origen de la deuda/precio */
  fechaOrigen: Date | string
  /** Fecha de valuación (default: hoy) */
  fechaValuacion?: Date | string
  indiceCodigo?: IndiceCodigo
  topeVariacionPeriodo?: number | null
}

export interface ReexpresionResult {
  montoOriginal: number
  montoAjustado: number
  perdidaPoderAdquisitivo: number
  factor: number
  periodoOrigen: string
  periodoValuacion: string
  ipcOrigen: number
  ipcValuacion: number
  indiceCodigo: IndiceCodigo
  /** true si se usó fallback / proyección */
  estimado: boolean
  disclaimer: string
}

export interface BillingIndexTriggerResult {
  precioBaseArs: number
  precioIndexadoArs: number
  periodoBase: string
  periodoActual: string
  factor: number
  topeAplicado: boolean
  policyActiva: boolean
}
