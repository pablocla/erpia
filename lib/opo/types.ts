export type ModoErp = "full" | "legacy_front" | "hibrido"
export type OpoOrigen = "clavis_db" | "protheus"
export type OpoConector = "rest" | "sql"
/** direct = vistas SQL en BD legacy; via_rest = vistas expuestas por REST AdvPL */
export type SqlModo = "direct" | "via_rest"
export type AccesoCanal = "edge_agent" | "rest_directo" | "sql_vistas" | "sql_directo"
export type IntrospectionCanal = "rest" | "sql" | "hybrid"
export type DireccionDatos = "lectura" | "escritura" | "ambos"

export type OpoCanonicalEntity = "Customer" | "Product" | "Invoice" | "Order" | "Supplier"

export interface OpoEntityEndpoint {
  modo: OpoConector
  endpoint: string
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
}

export interface OpoEntityBridgeMapping {
  entity: OpoCanonicalEntity
  nativeTable: string
  lectura?: OpoEntityEndpoint | null
  escritura?: OpoEntityEndpoint | null
  sqlView?: string
}

export interface OpoEntityMapping {
  canonical: string
  nativeReference: string
  confidence: number
  limitations?: string
}

export interface OpoTenantConfig {
  activo: boolean
  modoErp: ModoErp
  origen: OpoOrigen
  conector: OpoConector
  /** URL del OPO Edge Agent (ej. http://192.168.100.3:4077) */
  baseUrl?: string
  /** API key compartida con el agente en la PC con VPN */
  agentApiKey?: string
  sqlViewPrefix?: string
  /** Canal preferido para legacy: agente VPN, REST Protheus directo, o vistas SQL */
  accesoCanal?: AccesoCanal
  sqlModo?: SqlModo
  /** Base REST Protheus (ej. http://10.12.35.70:8073/rest) — sin agente intermedio */
  restDirectUrl?: string
  restAuthUser?: string
  restAuthPassword?: string
  /** SQL Server Protheus directo (sin Edge Agent) */
  sqlServer?: string
  sqlPort?: number
  sqlDatabase?: string
  sqlUser?: string
  sqlPassword?: string
  /** Sufijo tablas Protheus ej. 010 → SA1010, SX2010 */
  tableSuffix?: string
  /** Mapeo por entidad canónica OPO → endpoint/tabla legacy */
  entityMappings?: OpoEntityBridgeMapping[]
  /** Última prueba ida/vuelta exitosa (ISO) */
  bridgeTestedAt?: string
  bridgeTestOk?: boolean
}

export interface ProtheusRestService {
  endpoint: string
  type: string
  doc: string
  methods: { method: string; description: string }[]
}

export interface IntrospectionStepResult {
  id: string
  label: string
  path: string
  method: string
  ok: boolean
  status: number
  ms: number
  sample?: unknown
  error?: string
}

export interface LegacyBridgeTestResult {
  ok: boolean
  steps: {
    id: string
    label: string
    ok: boolean
    ms?: number
    detail?: string
    sample?: unknown
  }[]
  servicesCount?: number
  testedAt: string
}

export interface OpoDiscoveryManifest {
  opo_version: string
  system_identity: {
    erp_name: string
    version: string
    jurisdictions: string[]
    organization_name?: string
  }
  adapter_configuration?: {
    base_url: string
    authentication_type: string
    protocol_interface: string
  }
  discovery?: {
    context_url: string
    registry_url: string
  }
  endpoints: Record<
    string,
    {
      path: string
      methods: string[]
      schema?: string
    }
  >
  supported_entities?: OpoEntityMapping[]
}

export interface OpoQueryInput {
  entity: OpoCanonicalEntity
  limit?: number
  search?: string
}