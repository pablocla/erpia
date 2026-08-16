/**
 * Metadata de préstamo casero de barrio, embebida en Cliente.observaciones.
 * No requiere migración: un bloque [[PRESTAMO]]…[[/PRESTAMO]] + notas libres.
 */

export type MedioCobro = "efectivo" | "transferencia" | "otro"

export interface CobroPrestamo {
  at: string
  monto: number
  saldoDespues: number
  medio: MedioCobro
  nota?: string
}

export interface PrestamoMeta {
  v: 1
  capital: number
  interesPct: number
  interes: number
  /** Total original a devolver al otorgar */
  totalOriginal: number
  fechaVencimiento: string
  cobros: CobroPrestamo[]
}

const OPEN = "[[PRESTAMO]]"
const CLOSE = "[[/PRESTAMO]]"

const moneyFromObs =
  /Capital\s*\$?\s*([\d.\s]+)\s*\+?\s*Inter[eé]s\s*\$?\s*([\d.\s]+)(?:\s*\((\d+(?:[.,]\d+)?)\s*%\))?/i

function parseMoneyAr(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

export function extractMetaBlock(observaciones: string | null | undefined): {
  meta: PrestamoMeta | null
  notas: string
} {
  const text = observaciones ?? ""
  const start = text.indexOf(OPEN)
  const end = text.indexOf(CLOSE)
  if (start === -1 || end === -1 || end <= start) {
    return { meta: null, notas: text.trim() }
  }
  const json = text.slice(start + OPEN.length, end).trim()
  const notas = `${text.slice(0, start)}${text.slice(end + CLOSE.length)}`.trim()
  try {
    const parsed = JSON.parse(json) as PrestamoMeta
    if (!parsed || parsed.v !== 1) return { meta: null, notas: text.trim() }
    return {
      meta: {
        v: 1,
        capital: Number(parsed.capital) || 0,
        interesPct: Number(parsed.interesPct) || 0,
        interes: Number(parsed.interes) || 0,
        totalOriginal: Number(parsed.totalOriginal) || 0,
        fechaVencimiento: parsed.fechaVencimiento || "",
        cobros: Array.isArray(parsed.cobros) ? parsed.cobros : [],
      },
      notas,
    }
  } catch {
    return { meta: null, notas: text.trim() }
  }
}

export function serializeObservaciones(meta: PrestamoMeta, notas?: string | null): string {
  const block = `${OPEN}${JSON.stringify(meta)}${CLOSE}`
  const n = (notas ?? "").trim()
  return n ? `${block}\n${n}` : block
}

/** Infere meta desde saldos / texto viejo del seed (Capital $X + Interés $Y (30%)). */
export function inferMetaFromLegacy(input: {
  saldo: number
  observaciones?: string | null
  fechaAlta?: Date | string | null
}): PrestamoMeta {
  const { meta: existing, notas } = extractMetaBlock(input.observaciones)
  if (existing) return existing

  const saldo = Math.max(0, Number(input.saldo) || 0)
  const m = (notas || input.observaciones || "").match(moneyFromObs)
  let capital = 0
  let interes = 0
  let interesPct = 30

  if (m) {
    capital = parseMoneyAr(m[1])
    interes = parseMoneyAr(m[2])
    if (m[3]) interesPct = Number(String(m[3]).replace(",", ".")) || 30
  } else if (saldo > 0) {
    capital = Math.round(saldo / 1.3)
    interes = saldo - capital
    interesPct = capital > 0 ? Math.round((interes / capital) * 100) : 30
  }

  const totalOriginal = capital + interes || saldo
  const alta =
    input.fechaAlta instanceof Date
      ? input.fechaAlta
      : input.fechaAlta
        ? new Date(input.fechaAlta)
        : new Date()
  const vence = new Date(alta)
  vence.setDate(vence.getDate() + 30)

  return {
    v: 1,
    capital,
    interesPct,
    interes,
    totalOriginal: totalOriginal || saldo,
    fechaVencimiento: vence.toISOString().slice(0, 10),
    cobros: [],
  }
}

export function buildMetaOnCreate(input: {
  capital: number
  interesPct: number
  fechaVencimiento?: string
  cobrosPrevios?: CobroPrestamo[]
}): PrestamoMeta {
  const capital = Math.max(0, Math.round(input.capital))
  const interesPct = Number.isFinite(input.interesPct) ? input.interesPct : 30
  const interes = Math.round((capital * interesPct) / 100)
  const vence =
    input.fechaVencimiento?.trim() ||
    (() => {
      const d = new Date()
      d.setDate(d.getDate() + 30)
      return d.toISOString().slice(0, 10)
    })()

  return {
    v: 1,
    capital,
    interesPct,
    interes,
    totalOriginal: capital + interes,
    fechaVencimiento: vence,
    cobros: input.cobrosPrevios ?? [],
  }
}

export type EstadoPrestamoBarrio = "Al día" | "Vence hoy" | "Vencido" | "Saldado"

export function estadoDesdeVencimiento(
  saldo: number,
  fechaVencimiento: string,
  hoy = new Date(),
): EstadoPrestamoBarrio {
  if (saldo <= 0) return "Saldado"
  if (!fechaVencimiento) return "Al día"
  const v = fechaVencimiento.slice(0, 10)
  const today = hoy.toISOString().slice(0, 10)
  if (v < today) return "Vencido"
  if (v === today) return "Vence hoy"
  return "Al día"
}

export function isCobrarHoy(saldo: number, fechaVencimiento: string, hoy = new Date()): boolean {
  if (saldo <= 0) return false
  if (!fechaVencimiento) return true
  const v = fechaVencimiento.slice(0, 10)
  const today = hoy.toISOString().slice(0, 10)
  return v <= today
}

export function cobrosDeHoy(cobros: CobroPrestamo[], hoy = new Date()): CobroPrestamo[] {
  const day = hoy.toISOString().slice(0, 10)
  return cobros.filter((c) => (c.at || "").slice(0, 10) === day)
}

export function fmtArs(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n)
}
