/**
 * Solicita CAE AFIP para una factura existente (POS, sync, reintentos).
 */
import QRCode from "qrcode"
import { prisma } from "@/lib/prisma"
import { AFIPSoapClient } from "./soap-client"
import {
  buildFceOpcionales,
  isFceTipoCbte,
  validateCbu,
  type TipoTransferenciaFce,
} from "./mipyme-fce"

export interface SolicitarCaeResult {
  ok: boolean
  cae?: string
  qrBase64?: string
  vencimientoCAE?: string
  error?: string
}

function ivaAfipId(porcentaje: number): number {
  const map: Record<number, number> = { 0: 3, 2.5: 9, 5: 8, 10.5: 4, 21: 5, 27: 6 }
  return map[porcentaje] ?? 5
}

function formatearFechaAfip(fecha: Date): string {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, "0")
  const d = String(fecha.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}

function generarUrlQR(
  cuit: string,
  tipoCbte: number,
  puntoVenta: number,
  nroComprobante: number,
  cae: string,
  fechaVto: string,
  importe: number,
  moneda: string,
  tipoCambio: number,
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
    moneda,
    ctz: tipoCambio,
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

export async function solicitarCaeFactura(facturaId: number): Promise<SolicitarCaeResult> {
  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: {
      lineas: true,
      empresa: {
        select: {
          id: true,
          cuit: true,
          certificadoCRT: true,
          certificadoKEY: true,
          entorno: true,
        },
      },
      cliente: {
        select: { cuit: true, dni: true, condicionIva: true },
      },
    },
  })

  if (!factura) {
    return { ok: false, error: "Factura no encontrada" }
  }

  if (factura.estado === "emitida" && factura.cae) {
    return {
      ok: true,
      cae: factura.cae,
      qrBase64: factura.qrBase64 ?? undefined,
      vencimientoCAE: factura.vencimientoCAE?.toISOString(),
    }
  }

  if (factura.estado === "ticket") {
    return { ok: false, error: "Los tickets no requieren CAE" }
  }

  const { empresa, cliente } = factura
  if (!empresa.certificadoCRT || !empresa.certificadoKEY) {
    return { ok: false, error: "Certificados AFIP no configurados" }
  }

  const ivaMap = new Map<number, { base: number; importe: number }>()
  for (const linea of factura.lineas) {
    const id = ivaAfipId(Number(linea.porcentajeIva))
    const prev = ivaMap.get(id) ?? { base: 0, importe: 0 }
    prev.base += Number(linea.subtotal)
    prev.importe += Number(linea.iva)
    ivaMap.set(id, prev)
  }

  const impNeto = Number(factura.subtotal)
  const impIva = Number(factura.iva)
  const impTrib = Number(factura.totalPercepciones)
  const impTotal = Number(factura.total) + impTrib

  const comprobante: Record<string, unknown> = {
    CbteTipo: factura.tipoCbte,
    Concepto: factura.concepto ?? 1,
    DocTipo: cliente?.cuit ? 80 : cliente?.dni ? 96 : 99,
    DocNro: cliente?.cuit || cliente?.dni || 0,
    CbteDesde: factura.numero,
    CbteHasta: factura.numero,
    CbteFch: formatearFechaAfip(factura.createdAt),
    ImpTotal: impTotal,
    ImpTotConc: Number(factura.netoNoGravado),
    ImpNeto: impNeto,
    ImpOpEx: Number(factura.netoExento),
    ImpIVA: impIva,
    ImpTrib: impTrib,
    MonId: factura.monedaOrigen,
    MonCotiz: factura.tipoCambio,
    Iva: [...ivaMap.entries()].map(([Id, v]) => ({
      Id,
      BaseImp: Math.round(v.base * 100) / 100,
      Importe: Math.round(v.importe * 100) / 100,
    })),
  }

  if (isFceTipoCbte(factura.tipoCbte)) {
    const configFiscal = await prisma.configFiscalEmpresa.findUnique({
      where: { empresaId: empresa.id },
    })
    const cbuFce = configFiscal?.cbuFce ?? null
    const tipoTransferenciaFce: TipoTransferenciaFce =
      configFiscal?.tipoTransferenciaFce === "ADC" ? "ADC" : "SCA"

    if (!cbuFce || !validateCbu(cbuFce)) {
      return {
        ok: false,
        error:
          "FCE MiPyME requiere CBU emisor de 22 dígitos. Configuralo en Parámetros Fiscales → FCE MiPyME.",
      }
    }
    Object.assign(comprobante, buildFceOpcionales(cbuFce, tipoTransferenciaFce))
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
      factura.puntoVenta,
      comprobante,
      empresa.id,
      factura.id,
    )

    if (resultado.FeDetResp?.FECAEDetResponse?.Resultado !== "A") {
      const obs = resultado.FeDetResp?.FECAEDetResponse?.Observaciones
      const msg = `AFIP rechazó: ${JSON.stringify(obs)}`
      try {
        const { emitAutomationEvent } = await import("@/lib/automation/emit-event")
        void emitAutomationEvent(
          empresa.id,
          "CAE_RECHAZADO",
          { facturaId: factura.id, numero: factura.numero, observaciones: obs },
          `fac-reject-${factura.id}`,
        )
      } catch {
        /* opcional */
      }
      return { ok: false, error: msg }
    }

    const cae = resultado.FeDetResp.FECAEDetResponse.CAE as string
    const fechaVto = resultado.FeDetResp.FECAEDetResponse.CAEFchVto as string

    const tipoDocRec = cliente?.cuit ? 80 : cliente?.dni ? 96 : 99
    const nroDocRec =
      Number(String(cliente?.cuit || cliente?.dni || "0").replace(/\D/g, "")) || 0

    const qrUrl = generarUrlQR(
      empresa.cuit,
      factura.tipoCbte,
      factura.puntoVenta,
      factura.numero,
      cae,
      fechaVto,
      impTotal,
      factura.monedaOrigen,
      factura.tipoCambio,
      tipoDocRec,
      nroDocRec,
    )
    const qrBase64 = await QRCode.toDataURL(qrUrl)
    const vencimientoCAE = parsearFechaCAE(fechaVto)

    await prisma.factura.update({
      where: { id: factura.id },
      data: {
        cae,
        fechaCAE: new Date(),
        vencimientoCAE,
        qrBase64,
        estado: "emitida",
        condicionIvaReceptor: cliente?.condicionIva ?? factura.condicionIvaReceptor,
      },
    })

    try {
      const { emitAutomationEvent } = await import("@/lib/automation/emit-event")
      void emitAutomationEvent(
        empresa.id,
        "CAE_OBTENIDO",
        { facturaId: factura.id, numero: factura.numero, cae },
        `fac-ok-${factura.id}`,
      )
    } catch {
      /* opcional */
    }

    return {
      ok: true,
      cae,
      qrBase64,
      vencimientoCAE: vencimientoCAE.toISOString(),
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
      await prisma.factura.update({
        where: { id: factura.id },
        data: { estado: "pendiente_cae" },
      })
      return { ok: false, error: "AFIP no disponible — quedó pendiente de CAE" }
    }

    return { ok: false, error: msg }
  }
}