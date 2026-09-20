/**
 * Schema Inference Engine
 *
 * Given a JSON response from a Protheus REST endpoint, infers:
 * - Field types (string, number, date, boolean, cuit, currency)
 * - Field roles (pk, fk, descriptive, monetary, fiscal, date)
 * - Protheus table prefix (A1_, B1_, F2_, etc.)
 * - Suggested OPO canonical entity match
 */

import type { OpoCanonicalEntity } from "./types"

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type InferredFieldType =
  | "string"
  | "number"
  | "integer"
  | "decimal"
  | "date"
  | "datetime"
  | "boolean"
  | "cuit"
  | "cnpj"
  | "currency"
  | "email"
  | "unknown"

export type InferredFieldRole =
  | "pk"
  | "fk"
  | "descriptive"
  | "monetary"
  | "fiscal"
  | "date"
  | "status"
  | "quantity"
  | "code"
  | "unknown"

export interface InferredField {
  name: string
  type: InferredFieldType
  role: InferredFieldRole
  nullable: boolean
  /** Protheus-style prefix (e.g. "A1_", "B1_") if detected */
  protheusPrefix?: string
  /** Sample values (up to 3) */
  samples: unknown[]
}

export interface InferredSchema {
  endpoint: string
  method: string
  /** Total records in sample */
  sampleSize: number
  /** Detected Protheus table prefix (most common) */
  protheusTablePrefix?: string
  /** Suggested native table (e.g. "SA1", "SB1") */
  suggestedTable?: string
  fields: InferredField[]
  /** Suggested OPO entity match with confidence */
  entityMatch?: { entity: OpoCanonicalEntity; confidence: number; reason: string }
  /** Inferred at */
  inferredAt: string
}

// ─── PATTERNS ────────────────────────────────────────────────────────────────

const CUIT_REGEX = /^\d{2}-?\d{7,8}-?\d$/
const CNPJ_REGEX = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_ISO_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/
const DATE_PROTHEUS_REGEX = /^\d{8}$/ // YYYYMMDD

/** Protheus field prefixes → native table mapping */
const PREFIX_TO_TABLE: Record<string, string> = {
  A1_: "SA1", A2_: "SA2", A3_: "SA3",
  B1_: "SB1", B2_: "SB2", B5_: "SB5",
  C5_: "SC5", C6_: "SC6", C7_: "SC7", C9_: "SC9",
  D1_: "SD1", D2_: "SD2", D3_: "SD3",
  E1_: "SE1", E2_: "SE2", E5_: "SE5", E8_: "SE8",
  F1_: "SF1", F2_: "SF2", F6_: "SF6",
  FT_: "SFT",
  CT_: "CT1",
  NNR: "NNR",
  DA1: "DA1",
}

/** Field name patterns → roles */
const ROLE_PATTERNS: { pattern: RegExp; role: InferredFieldRole }[] = [
  { pattern: /^(id|_id|recno|r_e_c_n_o_)$/i, role: "pk" },
  { pattern: /(cod|code|_id$|filial|empresa)/i, role: "code" },
  { pattern: /(fk_|_fk$|id_|_cod$)/i, role: "fk" },
  { pattern: /(nome|name|desc|razao|razon|titulo|label)/i, role: "descriptive" },
  { pattern: /(valor|vlr|monto|total|preco|price|amount|saldo|importe)/i, role: "monetary" },
  { pattern: /(aliq|iva|icms|ipi|iss|perc|ret|impuesto|tributo|cuit|cnpj)/i, role: "fiscal" },
  { pattern: /(data|date|dt_|fecha|vencto|emissao|emision)/i, role: "date" },
  { pattern: /(status|estado|situacao|tipo|type)/i, role: "status" },
  { pattern: /(quant|qty|qtd|cantidad|cant)/i, role: "quantity" },
]

/** Table/entity mapping hints for auto-matching */
const ENTITY_HINTS: { entity: OpoCanonicalEntity; tables: string[]; keywords: string[] }[] = [
  { entity: "Customer", tables: ["SA1"], keywords: ["customer", "cliente", "client"] },
  { entity: "Supplier", tables: ["SA2"], keywords: ["supplier", "proveedor", "vendor", "fornecedor"] },
  { entity: "Product", tables: ["SB1"], keywords: ["product", "producto", "item", "material"] },
  { entity: "Invoice", tables: ["SF2", "SF1"], keywords: ["invoice", "factura", "nota", "nf"] },
  { entity: "Order", tables: ["SC5", "SC6"], keywords: ["order", "pedido", "salesorder"] },
  { entity: "AccountsReceivable", tables: ["SE1"], keywords: ["receivable", "cobrar", "receber", "billsToReceive"] },
  { entity: "AccountsPayable", tables: ["SE2"], keywords: ["payable", "pagar", "billsToPay"] },
  { entity: "BankStatement", tables: ["SE5"], keywords: ["bank", "banco", "transaction", "movimiento"] },
  { entity: "CashFlow", tables: ["SE8"], keywords: ["cashflow", "flujo", "caixa"] },
  { entity: "TaxWithholding", tables: ["SFT"], keywords: ["tax", "withholding", "retencion", "percepcion"] },
  { entity: "TaxEntry", tables: ["SF6"], keywords: ["taxentry", "libro", "iva", "fiscal"] },
  { entity: "PurchaseInvoice", tables: ["SF1", "SD1"], keywords: ["purchase", "compra", "entrada", "nfentrada"] },
  { entity: "StockMovement", tables: ["SD3"], keywords: ["stock", "estoque", "movimiento", "inventory"] },
  { entity: "Warehouse", tables: ["NNR"], keywords: ["warehouse", "almacen", "deposito", "armazem"] },
  { entity: "PriceList", tables: ["DA1"], keywords: ["price", "precio", "tabela", "lista"] },
  { entity: "JournalEntry", tables: ["CT2"], keywords: ["journal", "asiento", "lancamento", "accounting"] },
  { entity: "ChartOfAccounts", tables: ["CT1"], keywords: ["chart", "cuenta", "plano", "account"] },
  { entity: "CostCenter", tables: ["CTT"], keywords: ["cost", "centro", "costo", "custo"] },
]

// ─── INFERENCE FUNCTIONS ─────────────────────────────────────────────────────

export function inferFieldType(value: unknown): InferredFieldType {
  if (value === null || value === undefined) return "unknown"
  if (typeof value === "boolean") return "boolean"
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "decimal"
  }
  if (typeof value !== "string") return "unknown"

  const trimmed = value.trim()
  if (!trimmed) return "string"

  if (CUIT_REGEX.test(trimmed)) return "cuit"
  if (CNPJ_REGEX.test(trimmed)) return "cnpj"
  if (EMAIL_REGEX.test(trimmed)) return "email"
  if (DATE_ISO_REGEX.test(trimmed)) return trimmed.includes("T") ? "datetime" : "date"
  if (DATE_PROTHEUS_REGEX.test(trimmed)) {
    const y = parseInt(trimmed.slice(0, 4))
    if (y >= 1900 && y <= 2100) return "date"
  }

  // Currency-like: numbers with optional decimals
  if (/^-?\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(trimmed)) return "currency"
  if (/^-?\d+(\.\d{1,4})?$/.test(trimmed) && trimmed.length <= 20) {
    const n = parseFloat(trimmed)
    if (!isNaN(n)) return Number.isInteger(n) ? "integer" : "decimal"
  }

  return "string"
}

export function inferFieldRole(fieldName: string, type: InferredFieldType): InferredFieldRole {
  const lower = fieldName.toLowerCase()
  for (const { pattern, role } of ROLE_PATTERNS) {
    if (pattern.test(lower)) return role
  }
  if (type === "date" || type === "datetime") return "date"
  if (type === "currency" || type === "decimal") return "monetary"
  if (type === "cuit" || type === "cnpj") return "fiscal"
  return "unknown"
}

export function detectProtheusPrefix(fieldName: string): string | undefined {
  // Protheus fields: A1_NOME, B1_COD, F2_EMISSAO, etc.
  const match = fieldName.match(/^([A-Z][A-Z0-9]{1,2}_)/i)
  if (match) return match[1].toUpperCase()
  return undefined
}

export function inferSchemaFromSample(
  endpoint: string,
  method: string,
  rawData: unknown,
): InferredSchema {
  // Extract array of records from various response shapes
  const records = extractRecords(rawData)
  if (records.length === 0) {
    return {
      endpoint,
      method,
      sampleSize: 0,
      fields: [],
      inferredAt: new Date().toISOString(),
    }
  }

  // Collect all unique field names across records
  const fieldMap = new Map<string, { values: unknown[]; nullable: boolean }>()
  for (const rec of records) {
    if (!rec || typeof rec !== "object") continue
    for (const [key, val] of Object.entries(rec as Record<string, unknown>)) {
      const existing = fieldMap.get(key)
      if (existing) {
        if (existing.values.length < 5) existing.values.push(val)
        if (val === null || val === undefined) existing.nullable = true
      } else {
        fieldMap.set(key, { values: [val], nullable: val === null || val === undefined })
      }
    }
    // Mark fields missing from this record as nullable
    for (const [key, entry] of fieldMap) {
      if (!(key in (rec as Record<string, unknown>))) entry.nullable = true
    }
  }

  // Infer types and roles
  const fields: InferredField[] = []
  const prefixCounts = new Map<string, number>()

  for (const [name, { values, nullable }] of fieldMap) {
    const nonNullValues = values.filter((v) => v !== null && v !== undefined)
    const firstNonNull = nonNullValues[0]
    const type = firstNonNull !== undefined ? inferFieldType(firstNonNull) : "unknown"
    const role = inferFieldRole(name, type)
    const protheusPrefix = detectProtheusPrefix(name)

    if (protheusPrefix) {
      prefixCounts.set(protheusPrefix, (prefixCounts.get(protheusPrefix) ?? 0) + 1)
    }

    fields.push({
      name,
      type,
      role,
      nullable,
      protheusPrefix,
      samples: nonNullValues.slice(0, 3),
    })
  }

  // Determine dominant prefix → suggested table
  let protheusTablePrefix: string | undefined
  let suggestedTable: string | undefined
  if (prefixCounts.size > 0) {
    const sorted = [...prefixCounts.entries()].sort((a, b) => b[1] - a[1])
    protheusTablePrefix = sorted[0][0]
    suggestedTable = PREFIX_TO_TABLE[protheusTablePrefix]
  }

  // Try to match an OPO entity
  const entityMatch = matchEntity(endpoint, suggestedTable, fields)

  return {
    endpoint,
    method,
    sampleSize: records.length,
    protheusTablePrefix,
    suggestedTable,
    fields,
    entityMatch,
    inferredAt: new Date().toISOString(),
  }
}

function matchEntity(
  endpoint: string,
  suggestedTable: string | undefined,
  _fields: InferredField[],
): InferredSchema["entityMatch"] | undefined {
  const epLower = endpoint.toLowerCase()
  let bestMatch: { entity: OpoCanonicalEntity; confidence: number; reason: string } | undefined

  for (const hint of ENTITY_HINTS) {
    let score = 0
    const reasons: string[] = []

    // Table match (highest confidence)
    if (suggestedTable && hint.tables.includes(suggestedTable)) {
      score += 0.6
      reasons.push(`tabla ${suggestedTable}`)
    }

    // Keyword match in endpoint
    for (const kw of hint.keywords) {
      if (epLower.includes(kw)) {
        score += 0.3
        reasons.push(`keyword "${kw}" en endpoint`)
        break
      }
    }

    if (score > 0 && (!bestMatch || score > bestMatch.confidence)) {
      bestMatch = {
        entity: hint.entity,
        confidence: Math.min(score, 1),
        reason: reasons.join(" + "),
      }
    }
  }

  return bestMatch && bestMatch.confidence >= 0.3 ? bestMatch : undefined
}

function extractRecords(data: unknown): Record<string, unknown>[] {
  if (!data) return []
  if (Array.isArray(data)) return data.filter((d) => d && typeof d === "object") as Record<string, unknown>[]

  const obj = data as Record<string, unknown>
  // Common Protheus REST wrappers
  for (const key of ["items", "data", "objects", "resources", "results", "value"]) {
    if (Array.isArray(obj[key])) {
      return (obj[key] as unknown[]).filter((d) => d && typeof d === "object") as Record<string, unknown>[]
    }
  }

  // Single object response
  if (typeof data === "object" && !Array.isArray(data)) return [data as Record<string, unknown>]
  return []
}
