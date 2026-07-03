import type {
  OpoCanonicalEntity,
  OpoDiscoveryManifest,
  OpoQueryInput,
  OpoTenantConfig,
} from "@/lib/opo/types"

export type { OpoCanonicalEntity, OpoDiscoveryManifest, OpoQueryInput, OpoTenantConfig }

/** Identificador del adaptador activo para un tenant */
export type ErpAdapterId =
  | "claver_native"
  | "protheus_rest_direct"
  | "protheus_edge_agent"
  | "protheus_demo"

export interface ErpQueryResult {
  entity: OpoCanonicalEntity
  source: string
  count: number
  data: Record<string, unknown>[]
  adapterId: ErpAdapterId
  conector?: string
  nativeTable?: string
  endpoint?: string
  note?: string
  latencyMs: number
}

/**
 * Contrato unificado: la UI de Claver Apps consume esto sin saber
 * si atrás hay PostgreSQL nativo, REST Protheus o un Edge Agent VPN.
 */
export interface ErpDataAdapter {
  readonly adapterId: ErpAdapterId
  readonly erpLabel: string
  /** Menor número = mayor prioridad al resolver */
  readonly priority: number
  supports(config: OpoTenantConfig): boolean
  getDiscovery(baseUrl: string, orgName: string, config: OpoTenantConfig): Promise<OpoDiscoveryManifest>
  query(empresaId: number, input: OpoQueryInput, config: OpoTenantConfig): Promise<ErpQueryResult>
}

export interface LegacyApiEndpointContract {
  path: string
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  description: string
  requestBody?: Record<string, string>
  responseShape: Record<string, string>
  protheusHint?: string
}

export interface ClaverAppBridgeContract {
  sku: string
  nombre: string
  tagline: string
  requiredEndpoints: LegacyApiEndpointContract[]
  optionalEndpoints?: LegacyApiEndpointContract[]
}

/** Campo custom en diccionario SX3 o tabla Z del cliente */
export interface ProtheusCustomField {
  tabla: string
  campo: string
  tipo: "C" | "N" | "D" | "L" | "M"
  tamanho: number
  decimais?: number
  titulo: string
  descricao: string
  contexto: "R" | "C" | "V"
  obrigatorio?: boolean
  valorDefault?: string
}

/** Parámetro MV del ambiente Protheus */
export interface ProtheusMvParameter {
  mv: string
  tipo: "C" | "N" | "L"
  defaultValue: string
  descripcion: string
}

/** Paso de ingreso/egreso de datos entre Claver Edge y Protheus */
export interface ProtheusDataFlow {
  id: string
  direccion: "entrada" | "salida" | "bidireccional"
  origen: string
  destino: string
  metodo: string
  formato: "JSON" | "XML" | "SQL"
  descripcion: string
  validaciones?: string[]
  triggerProtheus?: string
}

/** Fuente AdvPL/TLPP para compilar en el RPO del AppServer */
export interface ProtheusPrwSource {
  archivo: string
  rutaRepo: string
  descripcion: string
  ordenCompilacion: number
  dependencias?: string[]
  exponeEndpoints: string[]
  compilacion: "TDS" | "TLPPCLI"
}

/**
 * Boletín técnico de implementación Protheus por Claver App.
 * Paquete entregable al analista/consultor del cliente.
 */
export interface ClaverAppTechnicalBulletin {
  sku: string
  version: string
  protheusMinVersion: string
  modulosProtheus: string[]
  tablasNativas: string[]
  camposCustom: ProtheusCustomField[]
  parametrosMV: ProtheusMvParameter[]
  flujosDatos: ProtheusDataFlow[]
  archivosPrw: ProtheusPrwSource[]
  ordenCompilacion: string[]
  checklistImplementacion: string[]
  notasSeguridad: string[]
  prerequisitos: string[]
}

export interface BenchmarkSide {
  label: string
  adapterId: ErpAdapterId
  latencyMs: number
  count: number
  sample?: Record<string, unknown>[]
}

export interface LegacyVsClaverBenchmark {
  entity: OpoCanonicalEntity
  legacy: BenchmarkSide
  claver: BenchmarkSide
  speedupFactor: number
  narrative: string
  measuredAt: string
}