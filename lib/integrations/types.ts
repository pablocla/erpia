export type IntegrationStatus = "conectado" | "error" | "desconectado" | "pausado"
export type IntegrationCategory =
  | "ecommerce"
  | "marketplace"
  | "pagos"
  | "comunicacion"
  | "productividad"
  | "hospitalidad"
  | "crm"
  | "fiscal"
  | "automatizacion"
  | "bi"
  | "logistica"
  | "erp"
  | "opensource"

export type AuthTipo = "oauth2" | "api_key" | "certificado" | "webhook" | "ninguno"

export type SyncDireccion = "bidireccional" | "entrada" | "salida" | "manual"
export type SyncFrecuencia = "tiempo_real" | "5min" | "15min" | "1h" | "diario" | "manual"

export interface CatalogEntry {
  id: string
  nombre: string
  categoria: IntegrationCategory
  categoriaLabel: string
  authTipo: AuthTipo
  descripcion: string
  descripcionComercial: string
  prioridad: number
  disponible: boolean
  novedad?: boolean
  badge?: string
  docsUrl?: string
  campos?: CredentialField[]
  entidadesSync?: SyncEntityOption[]
  color: string
  emoji: string
}

export interface CredentialField {
  key: string
  label: string
  tipo: "text" | "password" | "url" | "number"
  requerido?: boolean
  placeholder?: string
  ayuda?: string
}

export interface SyncEntityOption {
  id: string
  label: string
  defaultDireccion: SyncDireccion
  defaultFrecuencia: SyncFrecuencia
}

export interface ConnectionContext {
  empresaId: number
  conexionId: number
  credenciales: Record<string, string>
  configSync?: Record<string, unknown>
}

export interface TestResult {
  ok: boolean
  mensaje: string
  detalle?: string
}

export interface ConnectionSummary {
  integracionId: string
  estado: IntegrationStatus
  cuentaExterna?: string | null
  ultimaSyncAt?: string | null
  ultimoError?: string | null
  conexionId?: number
}

export interface IntegrationConnector {
  id: string
  testConnection(ctx: ConnectionContext): Promise<TestResult>
  getDefaultSyncConfig?(): Record<string, unknown>
  onConnect?(empresaId: number, credenciales: Record<string, string>): Promise<Partial<{
    cuentaExterna: string
    estado: IntegrationStatus
  }>>
}

export interface SyncConfigForm {
  entidades: Record<string, {
    activo: boolean
    direccion: SyncDireccion
    frecuencia: SyncFrecuencia
  }>
}

export const DEFAULT_SYNC_CONFIG: SyncConfigForm = {
  entidades: {},
}