/**
 * Validaciones de negocio previas al envío FECAE / WSFEX.
 */

export interface ValidacionPayloadResult {
  ok: boolean
  errores: string[]
  warnings: string[]
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function validarImportesFe(
  params: {
    impNeto: number
    impTotConc: number
    impOpEx: number
    impIva: number
    impTrib: number
    impTotal: number
    ivaItems?: Array<{ BaseImp: number; Importe: number }>
  },
): ValidacionPayloadResult {
  const errores: string[] = []
  const warnings: string[] = []

  const suma =
    round2(params.impNeto) +
    round2(params.impTotConc) +
    round2(params.impOpEx) +
    round2(params.impIva) +
    round2(params.impTrib)

  if (Math.abs(suma - round2(params.impTotal)) > 0.02) {
    errores.push(
      `Importes no cierran: Neto(${params.impNeto})+NoGrav(${params.impTotConc})+Exento(${params.impOpEx})+IVA(${params.impIva})+Trib(${params.impTrib})=${suma} ≠ Total(${params.impTotal})`,
    )
  }

  if (params.ivaItems && params.ivaItems.length > 0) {
    const ivaSum = round2(
      params.ivaItems.reduce((s, i) => s + Number(i.Importe), 0),
    )
    if (Math.abs(ivaSum - round2(params.impIva)) > 0.02) {
      errores.push(
        `Suma Iva[] (${ivaSum}) no coincide con ImpIVA (${params.impIva})`,
      )
    }
  }

  if (params.impTotal < 0) errores.push("ImpTotal no puede ser negativo")

  return { ok: errores.length === 0, errores, warnings }
}

export function validarMoneda(
  monId: string,
  monCotiz: number,
): ValidacionPayloadResult {
  const errores: string[] = []
  const warnings: string[] = []
  const mon = (monId || "PES").toUpperCase()
  if (mon !== "PES" && (!monCotiz || monCotiz <= 0)) {
    errores.push("MonCotiz obligatorio y > 0 cuando MonId ≠ PES (RG 5616)")
  }
  if (mon === "PES" && monCotiz !== 1) {
    warnings.push("Moneda PES con cotización distinta de 1")
  }
  return { ok: errores.length === 0, errores, warnings }
}

export function validarDocReceptor(
  docTipo: number,
  docNro: number | string,
  tipoCbte: number,
): ValidacionPayloadResult {
  const errores: string[] = []
  const warnings: string[] = []
  const nro = String(docNro).replace(/\D/g, "")

  // Factura A requiere CUIT (80)
  if ([1, 2, 3, 201, 202, 203].includes(tipoCbte) && docTipo !== 80) {
    errores.push("Factura A / FCE A requiere DocTipo 80 (CUIT)")
  }
  if (docTipo === 80 && nro.length !== 11) {
    errores.push("CUIT receptor debe tener 11 dígitos")
  }
  if (docTipo === 96 && (nro.length < 7 || nro.length > 8)) {
    warnings.push("DNI con longitud inusual")
  }
  if (docTipo === 99 && Number(nro) !== 0) {
    warnings.push("DocTipo 99 (CF) normalmente DocNro=0")
  }

  return { ok: errores.length === 0, errores, warnings }
}

export function validarFechaCbte(cbteFch: string): ValidacionPayloadResult {
  const errores: string[] = []
  const warnings: string[] = []
  if (!/^\d{8}$/.test(cbteFch)) {
    errores.push("CbteFch debe ser YYYYMMDD")
    return { ok: false, errores, warnings }
  }
  const y = Number(cbteFch.slice(0, 4))
  const m = Number(cbteFch.slice(4, 6))
  const d = Number(cbteFch.slice(6, 8))
  const fecha = new Date(y, m - 1, d)
  const hoy = new Date()
  hoy.setHours(23, 59, 59, 999)
  if (fecha.getTime() > hoy.getTime() + 24 * 60 * 60 * 1000) {
    errores.push("Fecha de comprobante futura no permitida")
  }
  const limitePasado = new Date()
  limitePasado.setDate(limitePasado.getDate() - 10)
  if (fecha < limitePasado) {
    warnings.push("Fecha de comprobante con más de 10 días de antigüedad")
  }
  return { ok: errores.length === 0, errores, warnings }
}
