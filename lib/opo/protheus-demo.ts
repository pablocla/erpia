import type { OpoDiscoveryManifest, OpoEntityMapping } from "./types"

export const PROTHEUS_DEMO_ENTITIES: OpoEntityMapping[] = [
  {
    canonical: "opo:Customer",
    nativeReference: "SA1",
    confidence: 0.98,
    limitations: "Solo clientes activos (A1_MSBLQL != '1').",
  },
  {
    canonical: "opo:Supplier",
    nativeReference: "SA2",
    confidence: 0.98,
    limitations: "Excluye proveedores históricos bloqueados.",
  },
  {
    canonical: "opo:Invoice",
    nativeReference: "SF2 / SF1",
    confidence: 0.95,
    limitations: "Retenciones requieren correlación SF3.",
  },
  {
    canonical: "opo:Order",
    nativeReference: "SC5 / SC7",
    confidence: 0.92,
    limitations: "Estado de línea refleja liberaciones SC6/SC9.",
  },
  {
    canonical: "opo:Product",
    nativeReference: "SB1",
    confidence: 0.96,
  },
]

export const PROTHEUS_DEMO_CUSTOMERS = [
  {
    id: "00000101",
    partyId: "30-71234567-8",
    tradeName: "Distribuidora Norte",
    legalName: "Distribuidora Norte S.A.",
    outstandingBalance: 125000,
    nativeTable: "SA1",
  },
  {
    id: "00000201",
    partyId: "30-70987654-3",
    tradeName: "Kiosco Central",
    legalName: "Kiosco Central S.R.L.",
    outstandingBalance: 48200,
    nativeTable: "SA1",
  },
]

export const PROTHEUS_DEMO_PRODUCTS = [
  {
    id: "PROD001",
    sku: "COCA-225",
    name: "Coca Cola 2.25L",
    unitPrice: 1850,
    stock: 48,
    nativeTable: "SB1",
  },
  {
    id: "PROD002",
    sku: "ARROZ-1K",
    name: "Arroz 1kg",
    unitPrice: 920,
    stock: 120,
    nativeTable: "SB1",
  },
]

export const PROTHEUS_DEMO_INVOICES = [
  {
    id: "000123456001",
    number: "000123456",
    series: "001",
    issueDate: "2026-06-24",
    grandTotal: 45890,
    customerId: "00000101",
    nativeTable: "SF2",
  },
  {
    id: "000123457001",
    number: "000123457",
    series: "001",
    issueDate: "2026-06-25",
    grandTotal: 12300,
    customerId: "00000201",
    nativeTable: "SF2",
  },
]

export function buildProtheusDemoManifest(baseUrl: string): OpoDiscoveryManifest {
  return {
    opo_version: "0.1.0",
    system_identity: {
      erp_name: "TOTVS Protheus",
      version: "12.1.2310",
      jurisdictions: ["BR", "AR"],
      organization_name: "Demo Protheus — Clavis Bridge",
    },
    adapter_configuration: {
      base_url: baseUrl,
      authentication_type: "OAuth2",
      protocol_interface: "REST",
    },
    discovery: {
      context_url: `${baseUrl}/opo-context.jsonld`,
      registry_url: `${baseUrl}/opo-registry.json`,
    },
    endpoints: {
      "opo:Customer": { path: "/api/opo/entities/Customer", methods: ["GET"] },
      "opo:Supplier": { path: "/api/opo/entities/Supplier", methods: ["GET"] },
      "opo:Invoice": { path: "/api/opo/entities/Invoice", methods: ["GET", "POST"] },
      "opo:Product": { path: "/api/opo/entities/Product", methods: ["GET"] },
      "opo:Order": { path: "/api/opo/entities/Order", methods: ["GET"] },
    },
    supported_entities: PROTHEUS_DEMO_ENTITIES,
  }
}