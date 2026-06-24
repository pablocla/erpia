/**
 * Emisión AFIP de Notas de Crédito (WSFE + CbteAsoc).
 */
import QRCode from "qrcode"
import { prisma } from "@/lib/prisma"
import { AFIPSoapClient } from "./soap-client"
import {
  buildCbtesAsocFce,
  buildFceOpcionales,
  formatFechaAfip,
  isFceNotaCreditoDebito,
  isFceTipoCbte,
  validateCbu,
  type TipoTransferenciaFce,
} from "./mipyme-fce"

export interface EmitirNcAfipResult {
  ok: boolean
  cae?: string
  vencimientoCAE?: string
  qrBase64?: string
  error?: string
}

function ivaAfipId(porcentaje: number): number {
  const map: Record<number, number> = { 0: 3, 2.5: 9, 5: 8, 10.5: 4, 21: 5, 27: 6 }
  return map[porcentaje] ?? 5
}

function generarUrlQR(
  cuit: string,
  tipoCbte: number,
  puntoVenta: number,
  nroComprobante: number,
  cae: string,
  importe: number,
  tipoDocRec: number,
  nroDocRec: number,
): string {
  const payload = {
    ver: 1,
    fecha: new Date().toISOString().split("T")[0],
    cuit: Number(cuit.replace(/\D/g, "")),
    ptoVta: puntoVenta,
    tipoCmp: tipoCbte,
    nroCmp: nroComprobante,
    importe: Math.round(importe * 100) / 100,
    moneda: "PES",
    ctz: 1,
    tipoDocRec,
    nroDocRec,
    tipoCodAut: "E",
    codAut: Number(cae),
  }
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `https://www.afip.gob.ar/fe/qr/?p=${base64}`
}

function parsearFechaCAE(fechaStr: string): Date {
  const year = Number.parseInt(fechaStr.slice(0, 4), 10)
  const month = Number.parseInt(fechaStr.slice(4, 6), 10) - 1
  const day = Number.parseInt(fechaStr.slice(6, 8), 10)
  return new Date(year, month, day)
}

export async function emitirNotaCreditoAfip(notaCreditoId: number): Promise<EmitirNcAfipResult> {
  const nc = await prisma.notaCredito.findUnique({
    where: { id: notaCreditoId },
    include: {
      lineas: true,
      factura: true,
      cliente: { select: { cuit: true, dni: true, condicionIva: true } },
      empresa: {
        select: {
          id: true,
          cuit: true,
          certificadoCRT: true,
          certificadoKEY: true,
          entorno: true,
        },
      },
    },
  })

  if (!nc) return { ok: false, error: "Nota de crédito no encontrada" }
  if (nc.cae && nc.estado === "emitida") {
    return {
      ok: true,
      cae: nc.cae,
      vencimientoCAE: nc.vencimientoCAE?.toISOString(),
    }
  }

  const { empresa, factura, cliente } = nc
  if (!empresa.certificadoCRT || !empresa.certificadoKEY) {
    return { ok: false, error: "Certificados AFIP no configurados" }
  }
  if (!factura.cae) {
    return { ok: false, error: "La factura original no tiene CAE — no se puede emitir NC fiscal" }
  }

  const ivaMap = new Map<number, { base: number; importe: number }>()
  for (const linea of nc.lineas) {
    const id = ivaAfipId(Number(linea.porcentajeIva))
    const prev = ivaMap.get(id) ?? { base: 0, importe: 0 }
    prev.base += Number(linea.subtotal)
    prev.importe += Number(linea.iva)
    ivaMap.set(id, prev)
  }

  const impTrib = Number(nc.totalPercepciones)
  const impTotal = Number(nc.total) + impTrib

  const comprobante: Record<string, unknown> = {
    CbteTipo: nc.tipoCbte,
    Concepto: 1,
    DocTipo: cliente?.cuit ? 80 : cliente?.dni ? 96 : 99,
    DocNro: cliente?.cuit || cliente?.dni || 0,
    CbteDesde: nc.numero,
    CbteHasta: nc.numero,
    CbteFch: formatFechaAfip(nc.createdAt),
    ImpTotal: impTotal,
    ImpTotConc: 0,
    ImpNeto: Number(nc.subtotal),
    ImpOpEx: 0,
    ImpIVA: Number(nc.iva),
    ImpTrib: impTrib,
    MonId: nc.monedaOrigen,
    MonCotiz: nc.tipoCambio,
    Iva: [...ivaMap.entries()].map(([Id, v]) => ({
      Id,
      BaseImp: Math.round(v.base * 100) / 100,
      Importe: Math.round(v.importe * 100) / 100,
    })),
  }

  const asociado = {
    Tipo: factura.tipoCbte,
    PtoVta: factura.puntoVenta,
    Nro: factura.numero,
    Cuit: empresa.cuit.replace(/\D/g, ""),
    CbteFch: formatFechaAfip(factura.createdAt),
  }

  if (isFceTipoCbte(nc.tipoCbte) && isFceNotaCreditoDebito(nc.tipoCbte)) {
    const configFiscal = await prisma.configFiscalEmpresa.findUnique({
      where: { empresaId: empresa.id },
    })
    const cbuFce = configFiscal?.cbuFce ?? null
    const tipoTransferenciaFce: TipoTransferenciaFce =
      configFiscal?.tipoTransferenciaFce === "ADC" ? "ADC" : "SCA"
    if (!cbuFce || !validateCbu(cbuFce)) {
      return {
        ok: false,
        error: "FCE MiPyME requiere CBU emisor configurado en Parámetros Fiscales",
      }
    }
    Object.assign(comprobante, buildFceOpcionales(cbuFce, tipoTransferenciaFce))
    Object.assign(comprobante, buildCbtesAsocFce(asociado))
  } else {
    Object.assign(comprobante, { CbteAsoc: [asociado] })
  }

  try {
    const entorno =
      (empresa.entorno as "homologacion" | "produccion") ??
      (process.env.AFIP_ENTORNO === "produccion" ? "produccion" : "homologacion")
    const soapClient = new AFIPSoapClient(entorno)
    const auth = await soapClient.authenticate(
      empresa.cuit,
      empresa.certificadoCRT,
      empresa.certificadoKEY,
    )

    const resultado = await soapClient.emitirComprobante(
      auth,
      empresa.cuit,
      nc.puntoVenta,
      comprobante,
      empresa.id,
    )

    if (resultado.FeDetResp?.FECAEDetResponse?.Resultado !== "A") {
      const obs = resultado.FeDetResp?.FECAEDetResponse?.Observaciones
      return { ok: false, error: `AFIP rechazó la NC: ${JSON.stringify(obs)}` }
    }

    const cae = resultado.FeDetResp.FECAEDetResponse.CAE as string
    const fechaVto = resultado.FeDetResp.FECAEDetResponse.CAEFchVto as string
    const vencimientoCAE = parsearFechaCAE(fechaVto)

    const tipoDocRec = cliente?.cuit ? 80 : cliente?.dni ? 96 : 99
    const nroDocRec =
      Number(String(cliente?.cuit || cliente?.dni || "0").replace(/\D/g, "")) || 0
    const qrUrl = generarUrlQR(
      empresa.cuit,
      nc.tipoCbte,
      nc.puntoVenta,
      nc.numero,
      cae,
      impTotal,
      tipoDocRec,
      nroDocRec,
    )
    const qrBase64 = await QRCode.toDataURL(qrUrl)

    await prisma.notaCredito.update({
      where: { id: nc.id },
      data: {
        cae,
        fechaCAE: new Date(),
        vencimientoCAE,
        estado: "emitida",
      },
    })

    return {
      ok: true,
      cae,
      vencimientoCAE: vencimientoCAE.toISOString(),
      qrBase64,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido"
    const esRed =
      err instanceof Error &&
      (msg.includes("ECONNREFUSED") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("ENOTFOUND") ||
        msg.includes("timeout"))

    if (esRed) {
      await prisma.notaCredito.update({
        where: { id: nc.id },
        data: { estado: "pendiente_cae" },
      })
      return { ok: false, error: "AFIP no disponible — NC quedó pendiente de CAE" }
    }

    return { ok: false, error: msg }
  }
}