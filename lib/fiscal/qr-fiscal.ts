/** Utilidades QR fiscal RG 4291 — CAE (E) y CAEA (A) */

export type TipoCodAutQr = "E" | "A"

export interface AfipQrPayloadInput {
  cuitEmisor: string
  tipoCbte: number
  puntoVenta: number
  numero: number
  codAut: string
  vencimientoAuth: Date | string
  importe: number
  moneda?: string
  tipoCambio?: number
  tipoDocRec?: number
  nroDocRec?: number
  tipoCodAut?: TipoCodAutQr
  fechaEmision?: Date
}

export function codigoCondicionIvaAfip(condicion: string | null | undefined): number {
  const c = (condicion ?? "").toLowerCase()
  if (c.includes("monotribut")) return 6
  if (c.includes("exento")) return 4
  if (c.includes("no alcanzado")) return 7
  if (c.includes("consumidor")) return 5
  if (c.includes("responsable") && c.includes("inscripto")) return 1
  if (c.includes("sujeto") && c.includes("exento")) return 10
  return 5
}

export function tipoDocReceptor(cuit?: string | null, dni?: string | null): { tipo: number; nro: number } {
  if (cuit) {
    return { tipo: 80, nro: Number(cuit.replace(/\D/g, "")) || 0 }
  }
  if (dni) {
    return { tipo: 96, nro: Number(dni.replace(/\D/g, "")) || 0 }
  }
  return { tipo: 99, nro: 0 }
}

function formatFechaQr(d: Date): string {
  return d.toISOString().split("T")[0]
}

function formatVtoCae(d: Date | string): string {
  if (typeof d === "string" && /^\d{8}$/.test(d)) return d
  const date = d instanceof Date ? d : new Date(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${y}${m}${day}`
}

export function buildAfipQrUrl(input: AfipQrPayloadInput): string {
  const doc = input.tipoDocRec != null && input.nroDocRec != null
    ? { tipoDocRec: input.tipoDocRec, nroDocRec: input.nroDocRec }
    : { tipoDocRec: 99, nroDocRec: 0 }

  const payload = {
    ver: 1,
    fecha: formatFechaQr(input.fechaEmision ?? new Date()),
    cuit: Number(input.cuitEmisor.replace(/\D/g, "")),
    ptoVta: input.puntoVenta,
    tipoCmp: input.tipoCbte,
    nroCmp: input.numero,
    importe: Math.round(input.importe * 100) / 100,
    moneda: input.moneda ?? "PES",
    ctz: input.tipoCambio ?? 1,
    ...doc,
    tipoCodAut: input.tipoCodAut ?? "E",
    codAut: Number(String(input.codAut).replace(/\D/g, "")),
  }

  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `https://www.afip.gob.ar/fe/qr/?p=${base64}`
}