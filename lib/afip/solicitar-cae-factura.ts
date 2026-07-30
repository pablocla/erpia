/**
 * Solicita CAE AFIP para una factura existente (POS, sync, reintentos).
 */
import QRCode from "qrcode"
import { prisma } from "@/lib/prisma"
import { AFIPSoapClient } from "./soap-client"
import {
  buildFceOpcionales,
  isFceTipoCbte,
  isFceFactura,
  resolveFceFchVtoPago,
  validateCbu,
  type TipoTransferenciaFce,
} from "./mipyme-fce"
import { resolverPercepcionesFactura } from "./resolver-percepciones-factura"
import { getCaeaConfig, debeIntentarCaea, isAfipNetworkError } from "./caea-config"
import { emitirConCaeaFactura } from "./emitir-caea-factura"
import { mapCondicionIvaReceptor, validarTipoCbteVsCondicion } from "./condicion-iva-afip"
import {
  validarImportesFe,
  validarMoneda,
  validarDocReceptor,
  validarFechaCbte,
} from "./payload-validators"
import { translateAfipError } from "./afip-error-translator"

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
      tributos: true,
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

  if (
    (factura.estado === "emitida" && factura.cae) ||
    (factura.modalidadAuth === "CAEA" && factura.caea)
  ) {
    return {
      ok: true,
      cae: factura.cae ?? factura.caea ?? undefined,
      qrBase64: factura.qrBase64 ?? undefined,
      vencimientoCAE: factura.vencimientoCAE?.toISOString(),
    }
  }

  if (factura.estado === "ticket") {
    return { ok: false, error: "Los tickets no requieren CAE" }
  }

  const caeaConfig = await getCaeaConfig(factura.empresaId)
  if (debeIntentarCaea(caeaConfig, "preferir")) {
    const caeaDirecto = await emitirConCaeaFactura(facturaId, "preferir")
    if (caeaDirecto.ok) return caeaDirecto
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

  const { totalPercepciones: impTrib, tributos } = await resolverPercepcionesFactura({
    empresaId: empresa.id,
    subtotal: impNeto,
    totalPercepciones: Number(factura.totalPercepciones),
    lineas: factura.lineas.map((l) => ({
      descripcion: l.descripcion,
      cantidad: Number(l.cantidad),
      precioUnitario: Number(l.precioUnitario),
      subtotal: Number(l.subtotal),
      porcentajeIva: Number(l.porcentajeIva),
    })),
    cliente,
    tributos: factura.tributos?.map((t) => ({
      codigoAfip: t.codigoAfip,
      descripcion: t.descripcion,
      baseImponible: Number(t.baseImponible),
      alicuota: t.alicuota,
      importe: Number(t.importe),
    })),
  })

  if (impTrib > 0 && Number(factura.totalPercepciones) === 0) {
    await prisma.factura.update({
      where: { id: factura.id },
      data: {
        totalPercepciones: impTrib,
        ...(tributos.length > 0
          ? {
              tributos: {
                deleteMany: {},
                create: tributos.map((t) => ({
                  codigoAfip: t.Id,
                  descripcion: t.Desc,
                  baseImponible: t.BaseImp,
                  alicuota: t.Alic,
                  importe: t.Importe,
                  empresaId: empresa.id,
                })),
              },
            }
          : {}),
      },
    })
  }

  const impTotal = Number(factura.total) + impTrib

  // Exportación E: no va por WSFE
  if ([19, 20, 21].includes(factura.tipoCbte)) {
    return {
      ok: false,
      error:
        "Factura de exportación (E) debe emitirse por WSFEX. Usá /api/afip/exportacion o emitirFacturaExportacion.",
    }
  }

  const docTipo = cliente?.cuit ? 80 : cliente?.dni ? 96 : 99
  const docNro = cliente?.cuit || cliente?.dni || 0
  const cbteFch = formatearFechaAfip(factura.createdAt)
  const ivaArr = [...ivaMap.entries()].map(([Id, v]) => ({
    Id,
    BaseImp: Math.round(v.base * 100) / 100,
    Importe: Math.round(v.importe * 100) / 100,
  }))

  const condIvaCodigo = mapCondicionIvaReceptor(
    cliente?.condicionIva ?? factura.condicionIvaReceptor,
  )
  const tipoVsCond = validarTipoCbteVsCondicion(factura.tipoCbte, condIvaCodigo)
  if (tipoVsCond) {
    return { ok: false, error: tipoVsCond }
  }

  const valImportes = validarImportesFe({
    impNeto,
    impTotConc: Number(factura.netoNoGravado),
    impOpEx: Number(factura.netoExento),
    impIva,
    impTrib,
    impTotal,
    ivaItems: ivaArr,
  })
  const valMon = validarMoneda(factura.monedaOrigen, factura.tipoCambio)
  const valDoc = validarDocReceptor(docTipo, docNro, factura.tipoCbte)
  const valFch = validarFechaCbte(cbteFch)
  const preErrores = [
    ...valImportes.errores,
    ...valMon.errores,
    ...valDoc.errores,
    ...valFch.errores,
  ]
  if (preErrores.length > 0) {
    return { ok: false, error: `Validación previa: ${preErrores.join("; ")}` }
  }

  const comprobante: Record<string, unknown> = {
    CbteTipo: factura.tipoCbte,
    Concepto: factura.concepto ?? 1,
    DocTipo: docTipo,
    DocNro: docNro,
    CbteDesde: factura.numero,
    CbteHasta: factura.numero,
    CbteFch: cbteFch,
    ImpTotal: impTotal,
    ImpTotConc: Number(factura.netoNoGravado),
    ImpNeto: impNeto,
    ImpOpEx: Number(factura.netoExento),
    ImpIVA: impIva,
    ImpTrib: impTrib,
    MonId: factura.monedaOrigen,
    MonCotiz: factura.tipoCambio,
    CondicionIVAReceptor: condIvaCodigo,
    Iva: ivaArr,
  }

  const concepto = factura.concepto ?? 1
  if (concepto >= 2) {
    if (factura.fechaServicioDesde) {
      comprobante.FchServDesde = formatearFechaAfip(factura.fechaServicioDesde)
    }
    if (factura.fechaServicioHasta) {
      comprobante.FchServHasta = formatearFechaAfip(factura.fechaServicioHasta)
    }
  }

  if (tributos.length > 0) {
    comprobante.Tributos = tributos
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
    // FCE siempre exige FchVtoPago
    if (isFceFactura(factura.tipoCbte) || !comprobante.FchVtoPago) {
      comprobante.FchVtoPago = resolveFceFchVtoPago(
        factura.createdAt,
        factura.fechaVtoPago,
      )
    }
  } else if (concepto >= 2 && factura.fechaVtoPago) {
    comprobante.FchVtoPago = formatearFechaAfip(factura.fechaVtoPago)
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
      "wsfe",
    )

    const resultado = (await soapClient.emitirComprobante(
      auth,
      empresa.cuit,
      factura.puntoVenta,
      comprobante,
      empresa.id,
      factura.id,
    )) as {
      FeDetResp?: {
        FECAEDetResponse?: {
          Resultado?: string
          Observaciones?: unknown
          CAE?: string
          CAEFchVto?: string
        }
      }
    }

    if (resultado.FeDetResp?.FECAEDetResponse?.Resultado !== "A") {
      const obs = resultado.FeDetResp?.FECAEDetResponse?.Observaciones
      const msg = translateAfipError(
        `AFIP rechazó: ${JSON.stringify(obs)}`,
      )
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

    if (isAfipNetworkError(err)) {
      const caeaFallback = await emitirConCaeaFactura(facturaId, "fallback")
      if (caeaFallback.ok) return caeaFallback

      await prisma.factura.update({
        where: { id: factura.id },
        data: { estado: "pendiente_cae" },
      })
      return {
        ok: false,
        error: caeaFallback.error ?? "AFIP no disponible — quedó pendiente de CAE",
      }
    }

    return { ok: false, error: msg }
  }
}