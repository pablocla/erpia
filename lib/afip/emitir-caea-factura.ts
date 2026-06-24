/**
 * Emisión de factura con CAEA (contingencia offline RG 5782).
 * Se usa cuando AFIP no responde o el modo está configurado en "preferir CAEA".
 */
import QRCode from "qrcode"
import { prisma } from "@/lib/prisma"
import { getCaeaConfig, getCaeaVigencia, debeIntentarCaea } from "./caea-config"
import { resolverPercepcionesFactura } from "./resolver-percepciones-factura"
import type { SolicitarCaeResult } from "./solicitar-cae-factura"

function generarUrlQRCaea(
  cuit: string,
  tipoCbte: number,
  puntoVenta: number,
  nroComprobante: number,
  caea: string,
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
    tipoCodAut: "A",
    codAut: Number(caea),
  }
  const base64 = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `https://www.afip.gob.ar/fe/qr/?p=${base64}`
}

export async function emitirConCaeaFactura(
  facturaId: number,
  motivo: "fallback" | "preferir" = "fallback",
): Promise<SolicitarCaeResult> {
  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: {
      lineas: true,
      tributos: true,
      empresa: { select: { id: true, cuit: true } },
      cliente: { select: { cuit: true, dni: true, condicionIva: true } },
    },
  })

  if (!factura) return { ok: false, error: "Factura no encontrada" }
  if (factura.estado === "ticket") return { ok: false, error: "Los tickets no requieren CAEA" }
  if (factura.modalidadAuth === "CAEA" && factura.caea) {
    return {
      ok: true,
      cae: factura.caea,
      qrBase64: factura.qrBase64 ?? undefined,
      vencimientoCAE: factura.vencimientoCAE?.toISOString(),
    }
  }

  const config = await getCaeaConfig(factura.empresaId)
  if (!debeIntentarCaea(config, motivo)) {
    return {
      ok: false,
      error: motivo === "preferir"
        ? "CAEA no configurado en modo preferir"
        : "CAEA deshabilitado o modo solo-CAE activo",
    }
  }

  const vigencia = await getCaeaVigencia(factura.empresaId)
  if (!vigencia.vigente || !vigencia.caea) {
    return {
      ok: false,
      error: "No hay CAEA vigente. Solicitá uno en Configuración → AFIP → CAEA.",
    }
  }

  const { totalPercepciones: impTrib, tributos } = await resolverPercepcionesFactura({
    empresaId: factura.empresaId,
    subtotal: Number(factura.subtotal),
    totalPercepciones: Number(factura.totalPercepciones),
    lineas: factura.lineas.map((l) => ({
      descripcion: l.descripcion,
      cantidad: Number(l.cantidad),
      precioUnitario: Number(l.precioUnitario),
      subtotal: Number(l.subtotal),
      porcentajeIva: Number(l.porcentajeIva),
    })),
    cliente: factura.cliente,
    tributos: factura.tributos?.map((t) => ({
      codigoAfip: t.codigoAfip,
      descripcion: t.descripcion,
      baseImponible: Number(t.baseImponible),
      alicuota: t.alicuota,
      importe: Number(t.importe),
    })),
  })

  const impTotal = Number(factura.total) + impTrib
  const tipoDocRec = factura.cliente?.cuit ? 80 : factura.cliente?.dni ? 96 : 99
  const nroDocRec =
    Number(String(factura.cliente?.cuit || factura.cliente?.dni || "0").replace(/\D/g, "")) || 0

  const fechaVtoStr = vigencia.vigHasta
    ? vigencia.vigHasta.toISOString().slice(0, 10).replace(/-/g, "")
    : ""

  const qrUrl = generarUrlQRCaea(
    factura.empresa.cuit,
    factura.tipoCbte,
    factura.puntoVenta,
    factura.numero,
    vigencia.caea,
    fechaVtoStr,
    impTotal,
    factura.monedaOrigen,
    factura.tipoCambio,
    tipoDocRec,
    nroDocRec,
  )
  const qrBase64 = await QRCode.toDataURL(qrUrl)

  await prisma.factura.update({
    where: { id: factura.id },
    data: {
      modalidadAuth: "CAEA",
      caea: vigencia.caea,
      estado: "caea_emitida",
      fechaCAE: new Date(),
      vencimientoCAE: vigencia.vigHasta,
      qrBase64,
      condicionIvaReceptor: factura.cliente?.condicionIva ?? factura.condicionIvaReceptor,
      ...(impTrib > 0 && Number(factura.totalPercepciones) === 0
        ? {
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
                      empresaId: factura.empresaId,
                    })),
                  },
                }
              : {}),
          }
        : {}),
    },
  })

  try {
    const { emitAutomationEvent } = await import("@/lib/automation/emit-event")
    void emitAutomationEvent(
      factura.empresaId,
      "CAEA_EMITIDO",
      { facturaId: factura.id, numero: factura.numero, caea: vigencia.caea },
      `caea-emit-${factura.id}`,
    )
  } catch {
    /* opcional */
  }

  return {
    ok: true,
    cae: vigencia.caea,
    qrBase64,
    vencimientoCAE: vigencia.vigHasta?.toISOString(),
  }
}