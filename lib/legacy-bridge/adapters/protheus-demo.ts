import {
  buildProtheusDemoManifest,
  PROTHEUS_DEMO_CUSTOMERS,
  PROTHEUS_DEMO_INVOICES,
  PROTHEUS_DEMO_PRODUCTS,
} from "@/lib/opo/protheus-demo"
import type { ErpDataAdapter, ErpQueryResult } from "../types"
import type { OpoCanonicalEntity, OpoTenantConfig } from "@/lib/opo/types"

function filterDemo<T extends Record<string, unknown>>(rows: T[], search?: string) {
  if (!search?.trim()) return rows
  const q = search.toLowerCase()
  return rows.filter((row) =>
    Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q)),
  )
}

const DEMO_DATA: Record<OpoCanonicalEntity, Record<string, unknown>[]> = {
  Customer: PROTHEUS_DEMO_CUSTOMERS,
  Product: PROTHEUS_DEMO_PRODUCTS,
  Invoice: PROTHEUS_DEMO_INVOICES,
  Order: [],
  Supplier: [],
  AccountsReceivable: [],
  AccountsPayable: [],
  BankStatement: [],
  CashFlow: [],
  TaxWithholding: [],
  TaxEntry: [],
  PurchaseInvoice: [],
  StockMovement: [],
  Warehouse: [],
  PriceList: [],
  JournalEntry: [],
  ChartOfAccounts: [],
  CostCenter: [],
}

/** Latencia simulada de Protheus WebApp para demos comerciales */
export const PROTHEUS_LEGACY_SIMULATED_MS = 8_500

export const protheusDemoAdapter: ErpDataAdapter = {
  adapterId: "protheus_demo",
  erpLabel: "TOTVS Protheus (demo / sin conexión)",
  priority: 90,

  supports(config) {
    return config.origen === "protheus" && isFallbackDemo(config)
  },

  async getDiscovery(baseUrl) {
    return buildProtheusDemoManifest(baseUrl)
  },

  async query(_empresaId, input, config) {
    const t0 = Date.now()
    const limit = Math.min(input.limit ?? 10, 50)
    const entity = input.entity
    const rows = filterDemo(DEMO_DATA[entity] ?? [], input.search).slice(0, limit)

    return {
      entity,
      source: "protheus_demo",
      count: rows.length,
      data: rows,
      adapterId: "protheus_demo",
      conector: config.conector,
      note:
        config.conector === "sql"
          ? `Vista SQL sugerida: ${config.sqlViewPrefix ?? "vw_opo_"}${entity.toLowerCase()}`
          : "Datos demo — configurá REST directo o Edge Agent para lectura real",
      latencyMs: Date.now() - t0,
    }
  },
}

function isFallbackDemo(config: OpoTenantConfig): boolean {
  const hasRest =
    config.restDirectUrl?.trim() &&
    config.restAuthUser?.trim() &&
    config.restAuthPassword?.trim()
  const hasAgent = Boolean(config.baseUrl?.trim() && /^https?:\/\//i.test(config.baseUrl))
  return !hasRest && !hasAgent
}