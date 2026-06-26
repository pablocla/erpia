/**
 * Campos legales unificados para ticket térmico y vista impresa.
 */

import { prisma } from "@/lib/prisma"
import { getTipoComprobante } from "@/lib/afip/tipos-comprobante"
import {
  buildAfipQrUrl,
  codigoCondicionIvaAfip,
  tipoDocReceptor,
  type TipoCodAutQr,
} from "@/lib/fiscal/qr-fiscal"

export interface IvaDesgloseLinea {
  alicuota: number
  neto: number
  iva: number
}

export interface TicketLegalData {
  empresa: {
    nombre: string
    razonSocial: string
    cuit: string
    direccion: string
    condicionIva: string
    condicionIvaCodigo: number
    iibb?: string
    puntoVenta: number
  }
  factura: {
    tipo: string
    tipoCbte: number
    nombreComprobante: string
    numero: number
    numeroCompleto: string
    fecha: Date
    cae: string
    vencimientoCAE: Date
    modalidadAuth: "CAE" | "CAEA" | "NINGUNA"
    moneda: string
    tipoCambio: number
    esFce: boolean
    esExportacion: boolean
    esTicket: boolean
  }
  cliente: {
    nombre: string
    cuit?: string
    dni?: string
    condicionIva: string
    condicionIvaCodigo: number
    direccion?: string
  }
  items: {
    descripcion: string
    cantidad: number
    precioUnitario: number
    iva: number
    total: number
  }[]
  totales: {
    subtotal: number
    iva: number
    percepciones: number
    total: number
  }
  ivaDesglose: IvaDesgloseLinea[]
  qrUrl?: string
  qrBase64?: string
  leyendas: string[]
}

function formatearNumeroCompleto(tipo: string, pv: number, num: number): string {
  const pvStr = String(pv).padStart(5, "0")
  const numStr = String(num).padStart(8, "0")
  return `${tipo}-${pvStr}-${numStr}`
}

export async function buildTicketLegalFromFactura(facturaId: number): Promise<TicketLegalData | null> {
  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: {
      empresa: true,
      cliente: true,
      lineas: true,
      tributos: true,
    },
  })

  if (!factura) return null

  const configFiscal = await prisma.configFiscalEmpresa.findFirst({
    where: { empresaId: factura.empresaId },
    include: { inscripcionesIIBB: { where: { activo: true }, take: 1 } },
  })
  const inscripcion = configFiscal?.inscripcionesIIBB[0]

  const esFce = [201, 206, 211].includes(factura.tipoCbte)
  const esExportacion = [19, 20, 21].includes(factura.tipoCbte)
  const esTicket = factura.estado === "ticket"
  const modalidadAuth: TicketLegalData["factura"]["modalidadAuth"] =
    factura.modalidadAuth === "CAEA" ? "CAEA"
      : factura.cae ? "CAE"
        : "NINGUNA"

  const docRec = tipoDocReceptor(factura.cliente.cuit, factura.cliente.dni)
  const codAut = factura.cae ?? factura.caea ?? ""
  const tipoCodAut: TipoCodAutQr = factura.modalidadAuth === "CAEA" ? "A" : "E"

  let qrUrl: string | undefined
  if (codAut && !esTicket) {
    qrUrl = buildAfipQrUrl({
      cuitEmisor: factura.empresa.cuit,
      tipoCbte: factura.tipoCbte,
      puntoVenta: factura.puntoVenta,
      numero: factura.numero,
      codAut,
      vencimientoAuth: factura.vencimientoCAE ?? new Date(),
      importe: Number(factura.total),
      moneda: factura.monedaOrigen,
      tipoCambio: factura.tipoCambio,
      tipoDocRec: docRec.tipo,
      nroDocRec: docRec.nro,
      tipoCodAut,
      fechaEmision: factura.createdAt,
    })
  }

  const ivaMap = new Map<number, { neto: number; iva: number }>()
  for (const linea of factura.lineas) {
    const pct = Number(linea.porcentajeIva)
    const total = Number(linea.total)
    const neto = total / (1 + pct / 100)
    const ivaAmt = total - neto
    const prev = ivaMap.get(pct) ?? { neto: 0, iva: 0 }
    ivaMap.set(pct, { neto: prev.neto + neto, iva: prev.iva + ivaAmt })
  }

  const ivaDesglose = [...ivaMap.entries()]
    .filter(([, v]) => v.iva > 0.001)
    .sort(([a], [b]) => b - a)
    .map(([alicuota, v]) => ({
      alicuota,
      neto: Math.round(v.neto * 100) / 100,
      iva: Math.round(v.iva * 100) / 100,
    }))

  const leyendas = [
    "Comprobante autorizado por AFIP",
    "RG 1415 — IVA discriminado según corresponda",
  ]
  if (factura.monedaOrigen && factura.monedaOrigen !== "PES") {
    leyendas.push(`RG 5616 — Moneda ${factura.monedaOrigen} — TC ${Number(factura.tipoCambio).toFixed(4)}`)
  }
  if (modalidadAuth === "CAEA") {
    leyendas.push("Emitido bajo modalidad CAEA — informar en régimen")
  }
  if (esFce) {
    leyendas.push("FCE MiPyME — Factura de Crédito Electrónica")
  }
  if (esExportacion) {
    leyendas.push("Comprobante de exportación — operación exenta IVA nacional")
  }
  if (esTicket) {
    leyendas.push("TICKET SIN CAE — No válido como comprobante fiscal")
  }

  const condEmisor = factura.empresa.condicionIva
  const condReceptor = factura.condicionIvaReceptor ?? factura.cliente.condicionIva

  return {
    empresa: {
      nombre: factura.empresa.nombre,
      razonSocial: factura.empresa.razonSocial,
      cuit: factura.empresa.cuit,
      direccion: factura.empresa.direccion ?? "",
      condicionIva: condEmisor,
      condicionIvaCodigo: codigoCondicionIvaAfip(condEmisor),
      iibb: inscripcion?.numeroInscripcion ?? undefined,
      puntoVenta: factura.puntoVenta,
    },
    factura: {
      tipo: factura.tipo,
      tipoCbte: factura.tipoCbte,
      nombreComprobante: getTipoComprobante(factura.tipoCbte)?.nombre ?? `Factura ${factura.tipo}`,
      numero: factura.numero,
      numeroCompleto: formatearNumeroCompleto(factura.tipo, factura.puntoVenta, factura.numero),
      fecha: factura.createdAt,
      cae: codAut,
      vencimientoCAE: factura.vencimientoCAE ?? new Date(),
      modalidadAuth,
      moneda: factura.monedaOrigen,
      tipoCambio: factura.tipoCambio,
      esFce,
      esExportacion,
      esTicket,
    },
    cliente: {
      nombre: factura.cliente.nombre,
      cuit: factura.cliente.cuit ?? undefined,
      dni: factura.cliente.dni ?? undefined,
      condicionIva: condReceptor,
      condicionIvaCodigo: codigoCondicionIvaAfip(condReceptor),
      direccion: factura.cliente.direccion ?? undefined,
    },
    items: factura.lineas.map((l) => ({
      descripcion: l.descripcion,
      cantidad: Number(l.cantidad),
      precioUnitario: Number(l.precioUnitario),
      iva: Number(l.porcentajeIva),
      total: Number(l.total),
    })),
    totales: {
      subtotal: Number(factura.subtotal),
      iva: Number(factura.iva),
      percepciones: Number(factura.totalPercepciones),
      total: Number(factura.total),
    },
    ivaDesglose,
    qrUrl,
    qrBase64: factura.qrBase64 ?? undefined,
    leyendas,
  }
}