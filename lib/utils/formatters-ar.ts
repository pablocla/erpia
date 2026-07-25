/**
 * Formatters and validators tailored for Argentine business operations.
 * CUIT, Patentes, Telefono WhatsApp, Moneda ARS, Desglose IVA, AFIP QR Link.
 */

/**
 * Normaliza y formatea CUITs a la estructura XX-XXXXXXXX-X.
 * Acepta string o número, con o sin guiones/espacios.
 */
export function formatCuit(cuitRaw: string | number | null | undefined): string {
  if (!cuitRaw) return "-"
  const cleaned = String(cuitRaw).replace(/\D/g, "")
  if (cleaned.length !== 11) return String(cuitRaw)
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`
}

/**
 * Normaliza búsqueda de CUIT (quita caracteres no numéricos)
 */
export function cleanCuit(cuitRaw: string): string {
  return cuitRaw.replace(/\D/g, "")
}

/**
 * Normaliza Patentes de vehículos en Argentina:
 * - Formato viejo: AAA 123 (3 letras, 3 números) -> "AAA 123"
 * - Formato Mercosur: AA 123 BB (2 letras, 3 números, 2 letras) -> "AA 123 BB"
 */
export function normalizePatente(patenteRaw: string | null | undefined): string {
  if (!patenteRaw) return "-"
  const cleaned = patenteRaw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
  
  // Mercosur (AA123BB)
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(cleaned)) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`
  }
  // Tradicional (AAA123)
  if (/^[A-Z]{3}\d{3}$/.test(cleaned)) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
  }
  return patenteRaw.trim().toUpperCase()
}

/**
 * Formatea número telefónico para WhatsApp en Argentina (+54 9 ...)
 * Si viene "1112345678" -> "5491112345678"
 * Si viene "+54 9 11 1234 5678" -> "5491112345678"
 */
export function normalizeTelefonoWA(phoneRaw: string | null | undefined): string {
  if (!phoneRaw) return ""
  let digits = phoneRaw.replace(/\D/g, "")
  
  // Sacar prefijo 0 inicial si existe (ej 011...)
  if (digits.startsWith("0")) {
    digits = digits.slice(1)
  }

  // Si no incluye el 549 ni 54, agregárselo
  if (!digits.startsWith("54")) {
    digits = `549${digits}`
  } else if (digits.startsWith("54") && !digits.startsWith("549")) {
    // Si arranca con 54 pero no tiene 9 despues
    digits = `549${digits.slice(2)}`
  }
  
  return digits
}

/**
 * Genera el enlace directo a WhatsApp Web / App con mensaje preconfigurado
 */
export function getWhatsAppShareUrl(phone: string, text: string): string {
  const normalizedPhone = normalizeTelefonoWA(phone)
  if (!normalizedPhone) return "#"
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`
}

/**
 * Formatea importes en pesos argentinos ($ 1.234,56 ARS)
 */
export function formatCurrencyARS(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "$ 0,00"
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Calcula desglose de IVA (Neto e IVA 21% / 10.5%) a partir de un Total Bruto
 */
export function calculateIvaBreakdown(totalWithTax: number, alicuotaPorcentaje: 21 | 10.5 | 0 = 21) {
  if (alicuotaPorcentaje === 0) {
    return { neto: totalWithTax, iva: 0, total: totalWithTax }
  }
  const factor = 1 + alicuotaPorcentaje / 100
  const neto = totalWithTax / factor
  const iva = totalWithTax - neto
  return {
    neto: Math.round(neto * 100) / 100,
    iva: Math.round(iva * 100) / 100,
    total: totalWithTax,
  }
}

/**
 * Genera la URL codificada en Base64 según especificación AFIP para QR de comprobantes electrónicos.
 * Ref: https://www.afip.gob.ar/fe/qr/especificaciones.asp
 */
export function generateAfipQrUrl(params: {
  ver?: number
  fecha: string // YYYY-MM-DD
  cuit: number | string
  ptoVta: number
  tipoCmp: number // 1: Factura A, 6: Factura B, 11: Factura C
  nroCmp: number
  importe: number
  moneda?: string
  ctz?: number
  tipoDocRec?: number
  nroDocRec?: number | string
  tipoCodAut?: "E" | "A"
  codAut: number | string
}): string {
  const jsonPayload = {
    ver: params.ver ?? 1,
    fecha: params.fecha,
    cuit: Number(cleanCuit(String(params.cuit))),
    ptoVta: params.ptoVta,
    tipoCmp: params.tipoCmp,
    nroCmp: params.nroCmp,
    importe: params.importe,
    moneda: params.moneda ?? "PES",
    ctz: params.ctz ?? 1,
    tipoDocRec: params.tipoDocRec ?? 80,
    nroDocRec: Number(cleanCuit(String(params.nroDocRec ?? 0))),
    tipoCodAut: params.tipoCodAut ?? "E",
    codAut: Number(params.codAut),
  }

  const jsonStr = JSON.stringify(jsonPayload)
  // Encoding base64 browser/node compatible
  const base64 = typeof window !== "undefined"
    ? btoa(unescape(encodeURIComponent(jsonStr)))
    : Buffer.from(jsonStr).toString("base64")

  return `https://www.afip.gob.ar/fe/qr/?p=${base64}`
}
