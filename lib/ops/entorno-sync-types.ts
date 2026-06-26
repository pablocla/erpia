import type { EntornoCodigo } from "@/lib/ops/ops-types"

/** Dominios de configuración que se pueden capturar/sincronizar entre entornos. */
export const ENTORNO_SYNC_DOMINIOS = [
  "empresa_config",
  "parametros_fiscales",
  "features",
  "suscripciones",
] as const

export type EntornoSyncDominio = (typeof ENTORNO_SYNC_DOMINIOS)[number]

export type EntornoSyncDireccion = "val→prd" | "prd→val" | "dev→val" | "val→dev" | "custom"

export interface EmpresaConfigSnapshot {
  rubro: string
  rubroId: number | null
  condicionIva: string
  paisFiscal: string
  puntoVenta: number
  direccion: string | null
  telefono: string | null
  email: string | null
  temaConfig: unknown
  entornoAfip: string
}

export interface ParametroFiscalSnapshot {
  clave: string
  valor: string
  descripcion: string | null
  categoria: string
  pais: string | null
  normativa: string | null
  activo: boolean
}

export interface FeatureSnapshot {
  featureKey: string
  activado: boolean
  modoSimplificado: boolean
  parametros: unknown
  notas: string | null
}

export interface SuscripcionSnapshot {
  sku: string
  activo: boolean
  limiteEventosMes: number | null
  metadata: unknown
}

export interface EntornoConfigSnapshot {
  version: 1
  capturedAt: string
  capturedBy: string
  codigo: EntornoCodigo
  dominios: EntornoSyncDominio[]
  data: {
    empresa_config?: EmpresaConfigSnapshot
    parametros_fiscales?: ParametroFiscalSnapshot[]
    features?: FeatureSnapshot[]
    suscripciones?: SuscripcionSnapshot[]
  }
}

export interface EntornoSyncHistoryEntry {
  direccion: EntornoSyncDireccion
  origen: EntornoCodigo
  destino: EntornoCodigo
  at: string
  by: string
  dominios: EntornoSyncDominio[]
  registrosAfectados: number
  aplicadoALiveDb: boolean
}

export interface EntornoSyncOpciones {
  dominios?: EntornoSyncDominio[]
  /** Al promover val→prd: aplicar snapshot a la base live (default true). */
  aplicarALiveDb?: boolean
  /** Al refrescar prd→val: forzar AFIP homologación en snapshot val (default true). */
  sanitizarAfipEnVal?: boolean
  /** Incluir certificados AFIP al promover (default false). */
  incluirCertificadosAfip?: boolean
}

export interface EntornoSyncStatus {
  empresaId: number
  entornos: Array<{
    codigo: EntornoCodigo
    snapshotAt: string | null
    snapshotBy: string | null
    dominios: EntornoSyncDominio[]
    lastSyncFrom: EntornoCodigo | null
    lastSyncAt: string | null
  }>
  puedePromoverValAPrd: boolean
  puedeRefrescarValDesdePrd: boolean
  mensaje?: string
}

export interface EntornoSyncResult {
  ok: boolean
  direccion: EntornoSyncDireccion
  origen: EntornoCodigo
  destino: EntornoCodigo
  dominios: EntornoSyncDominio[]
  registrosAfectados: number
  aplicadoALiveDb: boolean
  snapshotDestino?: EntornoConfigSnapshot
}