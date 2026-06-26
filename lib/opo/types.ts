export type ModoErp = "full" | "legacy_front" | "hibrido"
export type OpoOrigen = "clavis_db" | "protheus"
export type OpoConector = "rest" | "sql"

export type OpoCanonicalEntity = "Customer" | "Product" | "Invoice" | "Order" | "Supplier"

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