/**
 * Fake en memoria sobre el mock global de Prisma (__tests__/setup.ts),
 * solo para los modelos que toca el flujo Velde. $transaction hace rollback si falla.
 */
import { vi } from "vitest"
import { prisma } from "@/lib/prisma"

type Row = Record<string, any>

export const MODELOS_VELDE = [
  "empresa",
  "parametroFiscal",
  "featureEmpresa",
  "productoComercial",
  "suscripcionModulo",
  "cajaTipo",
  "cliente",
  "caja",
  "movimientoCaja",
  "producto",
  "movimientoStock",
  "factura",
  "usuario",
  "analistaAsignacion",
] as const

const DEFAULTS: Record<string, Row> = {
  caja: { estado: "abierta", saldoInicial: 0, cajaTipoId: null },
  cajaTipo: { activo: true },
  featureEmpresa: { activado: true },
  parametroFiscal: { activo: true },
}

function flattenWhere(where: Row = {}): Row {
  const out: Row = {}
  for (const [k, v] of Object.entries(where)) {
    if (k.includes("_") && v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, v)
    else out[k] = v
  }
  return out
}

function matches(row: Row, where: Row = {}): boolean {
  for (const [k, v] of Object.entries(flattenWhere(where))) {
    if (k === "OR" || k === "AND") continue
    if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      if ("in" in v && !v.in.includes(row[k])) return false
      if ("contains" in v) {
        const hay = String(row[k] ?? "")
        const needle = String(v.contains)
        const ok = v.mode === "insensitive" ? hay.toLowerCase().includes(needle.toLowerCase()) : hay.includes(needle)
        if (!ok) return false
      }
      if ("not" in v && row[k] === v.not) return false
      continue
    }
    if (row[k] !== v) return false
  }
  return true
}

export function createFakeDb() {
  let tables: Record<string, Row[]> = {}
  const seq: Record<string, number> = {}
  const db = prisma as any
  for (const m of MODELOS_VELDE) tables[m] = []

  const withRelations = (model: string, row: Row): Row => {
    if (model !== "caja") return { ...row }
    const cajaTipo = tables.cajaTipo.find((t) => t.id === row.cajaTipoId) ?? null
    return { ...row, cajaTipo, movimientos: tables.movimientoCaja.filter((m) => m.cajaId === row.id) }
  }

  const insert = (model: string, data: Row): Row => {
    seq[model] = (seq[model] ?? 0) + 1
    const { lineas, ...plain } = data
    const row: Row = { ...(DEFAULTS[model] ?? {}), ...plain, id: seq[model], createdAt: new Date(Date.now() + seq[model]) }
    if (lineas?.create) row.lineas = lineas.create
    tables[model].push(row)
    return row
  }

  for (const model of MODELOS_VELDE) {
    const api = db[model]
    api.findUnique.mockImplementation(async (a: Row) => {
      const r = tables[model].find((row) => matches(row, a.where))
      return r ? withRelations(model, r) : null
    })
    api.findFirst.mockImplementation(async (a: Row = {}) => {
      const r = tables[model].filter((row) => matches(row, a.where))
      const ordered = a.orderBy?.numero === "desc" ? [...r].sort((x, y) => y.numero - x.numero) : r
      return ordered[0] ? withRelations(model, ordered[0]) : null
    })
    api.findMany.mockImplementation(async (a: Row = {}) => {
      const r = tables[model].filter((row) => matches(row, a.where)).map((row) => withRelations(model, row))
      return a.take ? r.slice(0, a.take) : r
    })
    api.count.mockImplementation(async (a: Row = {}) => tables[model].filter((row) => matches(row, a.where)).length)
    api.create.mockImplementation(async (a: Row) => withRelations(model, insert(model, a.data)))
    api.update.mockImplementation(async (a: Row) => {
      const r = tables[model].find((row) => matches(row, a.where))
      if (!r) throw new Error(`${model} no encontrado`)
      Object.assign(r, a.data)
      return withRelations(model, r)
    })
    api.upsert.mockImplementation(async (a: Row) => {
      const r = tables[model].find((row) => matches(row, a.where))
      if (r) {
        Object.assign(r, a.update)
        return withRelations(model, r)
      }
      return withRelations(model, insert(model, a.create))
    })
  }

  db.$transaction.mockImplementation(async (fn: any) => {
    const snapshot = JSON.parse(JSON.stringify(tables))
    try {
      return await fn(db)
    } catch (e) {
      tables = snapshot
      throw e
    }
  })

  return {
    table: (model: (typeof MODELOS_VELDE)[number]) => tables[model],
    insert,
  }
}
