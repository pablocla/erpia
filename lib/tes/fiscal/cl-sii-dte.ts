/**
 * Chile — SII DTE (Documento Tributario Electrónico)
 * Generación de envelope XML y catálogo de tipos. Timbrado vía PAC es externo.
 */

export const CL_DTE_TIPOS = {
  FACTURA_ELECTRONICA: 33,
  FACTURA_EXENTA: 34,
  BOLETA: 39,
  NOTA_CREDITO: 61,
  NOTA_DEBITO: 56,
} as const

export type ClDteTipo = (typeof CL_DTE_TIPOS)[keyof typeof CL_DTE_TIPOS]

export interface ClDteLinea {
  nombre: string
  cantidad: number
  precioUnitario: number
  montoItem: number
  exento?: boolean
}

export interface ClDteInput {
  tipoDte: ClDteTipo
  folio: number
  fechaEmision: Date
  rutEmisor: string
  rutReceptor: string
  razonSocialReceptor: string
  lineas: ClDteLinea[]
  montoNeto: number
  montoIva: number
  montoTotal: number
}

/** Valida formato RUT chileno (módulo 11). */
export function validarRutChile(rut: string): boolean {
  const clean = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase()
  if (clean.length < 2) return false
  const cuerpo = clean.slice(0, -1)
  const dv = clean.slice(-1)
  if (!/^\d+$/.test(cuerpo)) return false

  let suma = 0
  let multiplo = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo
    multiplo = multiplo === 7 ? 2 : multiplo + 1
  }
  const resto = 11 - (suma % 11)
  const dvCalc = resto === 11 ? "0" : resto === 10 ? "K" : String(resto)
  return dv === dvCalc
}

function fmtFecha(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Construye XML DTE (sin firma electrónica — delegar a PAC/certificado). */
export function generarDteXml(input: ClDteInput): string {
  const lineasXml = input.lineas
    .map(
      (l, i) => `
    <Detalle>
      <NroLinDet>${i + 1}</NroLinDet>
      <NmbItem>${escapeXml(l.nombre)}</NmbItem>
      <QtyItem>${l.cantidad}</QtyItem>
      <PrcItem>${l.precioUnitario.toFixed(2)}</PrcItem>
      <MontoItem>${l.montoItem.toFixed(0)}</MontoItem>
    </Detalle>`,
    )
    .join("")

  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<DTE version="1.0">
  <Documento ID="DTE-${input.tipoDte}-${input.folio}">
    <Encabezado>
      <IdDoc>
        <TipoDTE>${input.tipoDte}</TipoDTE>
        <Folio>${input.folio}</Folio>
        <FchEmis>${fmtFecha(input.fechaEmision)}</FchEmis>
      </IdDoc>
      <Emisor><RUTEmisor>${input.rutEmisor}</RUTEmisor></Emisor>
      <Receptor>
        <RUTRecep>${input.rutReceptor}</RUTRecep>
        <RznSocRecep>${escapeXml(input.razonSocialReceptor)}</RznSocRecep>
      </Receptor>
      <Totales>
        <MntNeto>${Math.round(input.montoNeto)}</MntNeto>
        <IVA>${Math.round(input.montoIva)}</IVA>
        <MntTotal>${Math.round(input.montoTotal)}</MntTotal>
      </Totales>
    </Encabezado>${lineasXml}
  </Documento>
</DTE>`
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export interface ClTimbradoResult {
  ok: boolean
  trackId?: string
  xmlTimbrado?: string
  error?: string
}

/** Placeholder para integración PAC (LibreDTE, SimpleAPI, etc.). */
export async function solicitarTimbradoSii(
  xmlSinFirma: string,
  pacUrl = process.env.CL_SII_PAC_URL,
): Promise<ClTimbradoResult> {
  if (!pacUrl) {
    return {
      ok: false,
      error: "CL_SII_PAC_URL no configurada — timbrado DTE pendiente de PAC",
      xmlTimbrado: xmlSinFirma,
    }
  }
  try {
    const res = await fetch(pacUrl, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xmlSinFirma,
    })
    if (!res.ok) return { ok: false, error: `PAC respondió ${res.status}` }
    const data = (await res.json()) as { trackId?: string; xml?: string }
    return { ok: true, trackId: data.trackId, xmlTimbrado: data.xml ?? xmlSinFirma }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error PAC" }
  }
}