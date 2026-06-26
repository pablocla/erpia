/**
 * México — CFDI 4.0 (SAT)
 * Generación XML base y contrato de timbrado vía PAC.
 */

export const MX_USO_CFDI = {
  GASTOS_GENERAL: "G03",
  ADQUISICION_MERCANCIAS: "G01",
  POR_DEFINIR: "P01",
} as const

export interface MxCfdiConcepto {
  claveProdServ: string
  cantidad: number
  claveUnidad: string
  descripcion: string
  valorUnitario: number
  importe: number
  objetoImp: "01" | "02" | "03" | "04"
}

export interface MxCfdiInput {
  serie: string
  folio: string
  fecha: Date
  formaPago: string
  metodoPago: string
  lugarExpedicion: string
  emisorRfc: string
  emisorNombre: string
  emisorRegimen: string
  receptorRfc: string
  receptorNombre: string
  receptorUsoCfdi: string
  conceptos: MxCfdiConcepto[]
  subtotal: number
  total: number
  ivaTrasladado: number
}

function fmtFechaCfdi(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** Genera CFDI 4.0 sin sello (previo a cadena original + CSD). */
export function generarCfdi40Xml(input: MxCfdiInput): string {
  const conceptos = input.conceptos
    .map(
      (c) => `
    <cfdi:Concepto ClaveProdServ="${c.claveProdServ}" Cantidad="${c.cantidad}" ClaveUnidad="${c.claveUnidad}" Descripcion="${escapeXml(c.descripcion)}" ValorUnitario="${c.valorUnitario.toFixed(2)}" Importe="${c.importe.toFixed(2)}" ObjetoImp="${c.objetoImp}"/>`,
    )
    .join("")

  const impuestos =
    input.ivaTrasladado > 0
      ? `
    <cfdi:Impuestos TotalImpuestosTrasladados="${input.ivaTrasladado.toFixed(2)}">
      <cfdi:Traslados>
        <cfdi:Traslado Base="${input.subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${input.ivaTrasladado.toFixed(2)}"/>
      </cfdi:Traslados>
    </cfdi:Impuestos>`
      : ""

  return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="${input.serie}" Folio="${input.folio}" Fecha="${fmtFechaCfdi(input.fecha)}" FormaPago="${input.formaPago}" MetodoPago="${input.metodoPago}" SubTotal="${input.subtotal.toFixed(2)}" Total="${input.total.toFixed(2)}" Moneda="MXN" TipoDeComprobante="I" Exportacion="01" LugarExpedicion="${input.lugarExpedicion}">
  <cfdi:Emisor Rfc="${input.emisorRfc}" Nombre="${escapeXml(input.emisorNombre)}" RegimenFiscal="${input.emisorRegimen}"/>
  <cfdi:Receptor Rfc="${input.receptorRfc}" Nombre="${escapeXml(input.receptorNombre)}" UsoCFDI="${input.receptorUsoCfdi}"/>
  <cfdi:Conceptos>${conceptos}
  </cfdi:Conceptos>${impuestos}
</cfdi:Comprobante>`
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")
}

export interface MxTimbradoResult {
  ok: boolean
  uuid?: string
  xmlTimbrado?: string
  error?: string
}

/** Timbrado vía PAC (Finkok, SW Sapien, etc.). */
export async function solicitarTimbradoCfdi(
  xmlSinSello: string,
  pacUrl = process.env.MX_CFDI_PAC_URL,
): Promise<MxTimbradoResult> {
  if (!pacUrl) {
    return {
      ok: false,
      error: "MX_CFDI_PAC_URL no configurada — timbrado CFDI pendiente de PAC",
      xmlTimbrado: xmlSinSello,
    }
  }
  try {
    const res = await fetch(pacUrl, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xmlSinSello,
    })
    if (!res.ok) return { ok: false, error: `PAC respondió ${res.status}` }
    const data = (await res.json()) as { uuid?: string; xml?: string }
    return { ok: true, uuid: data.uuid, xmlTimbrado: data.xml ?? xmlSinSello }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error PAC" }
  }
}