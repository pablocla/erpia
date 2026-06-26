import type { OpoEntityBridgeMapping } from "./types"

/** Mapeos sugeridos Protheus → OPO (ajustables por analista tras discovery REST) */
export const PROTHEUS_DEFAULT_MAPPINGS: OpoEntityBridgeMapping[] = [
  {
    entity: "Customer",
    nativeTable: "SA1",
    sqlView: "vw_opo_customer",
    lectura: { modo: "rest", endpoint: "/api/fin/v1/customers", method: "GET" },
    escritura: null,
  },
  {
    entity: "Product",
    nativeTable: "SB1",
    sqlView: "vw_opo_product",
    lectura: { modo: "rest", endpoint: "/api/acproduct/v1/products", method: "GET" },
    escritura: null,
  },
  {
    entity: "Invoice",
    nativeTable: "SF2",
    sqlView: "vw_opo_invoice",
    lectura: { modo: "rest", endpoint: "/api/ctb/accountingentry", method: "GET" },
    escritura: null,
  },
  {
    entity: "Order",
    nativeTable: "SC5",
    sqlView: "vw_opo_order",
    lectura: { modo: "rest", endpoint: "/api/pc/v1/reports", method: "POST" },
    escritura: null,
  },
  {
    entity: "Supplier",
    nativeTable: "SA2",
    sqlView: "vw_opo_supplier",
    lectura: { modo: "sql", endpoint: "", method: "GET" },
    escritura: null,
  },
]

export function resolveAccesoCanal(
  conector: "rest" | "sql",
  baseUrl?: string,
  restDirectUrl?: string,
): "edge_agent" | "rest_directo" | "sql_vistas" {
  if (conector === "sql") return "sql_vistas"
  if (restDirectUrl?.trim()) return "rest_directo"
  if (baseUrl?.trim()) return "edge_agent"
  return "rest_directo"
}