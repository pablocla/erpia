/**
 * Sincronización de facturas PENDIENTE_CAE con AFIP.
 *
 * Uso:
 *   - Cron: cada 5 minutos vía /api/cron/sync-afip (requiere CRON_SECRET)
 *   - Manual: llamar syncFacturasPendientes(empresaId)
 *
 * Qué hace:
 *   1. Busca facturas en estado "pendiente_cae" con menos de 24hs de antigüedad
 *   2. Re-intenta solicitar el CAE a AFIP
 *   3. Si obtiene el CAE: actualiza la factura y genera el QR
 *   4. Si sigue fallando: deja el estado para el siguiente intento
 *   5. Si pasaron 24hs sin CAE: marca como "error_cae" para revisión manual
 */

import { prisma } from "@/lib/prisma"
import { AFIPSoapClient } from "./soap-client"
import QRCode from "qrcode"

const HORAS_LIMITE_REINTENTO = 24
const HORAS_AFIP_MANTENIMIENTO_INICIO = 0   // 00:00 ART
const HORAS_AFIP_MANTENIMIENTO_FIN    = 1   // 01:00 ART (margen extra)

function enVentanaMantenimientoAFIP(): boolean {
  const horaUTC = new Date().getUTCHours()
  // Argentina es UTC-3, así que 00:00 ART = 03:00 UTC
  const horaART = (horaUTC + 21) % 24  // UTC - 3 = UTC + 21
  return horaART >= HORAS_AFIP_MANTENIMIENTO_INICIO && horaART < HORAS_AFIP_MANTENIMIENTO_FIN
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

export interface SyncResult {
  procesadas: number
  sincronizadas: number
  errores: number
  omitidas: number  // en ventana de mantenimiento
  detalles: { facturaId: number; resultado: "ok" | "error" | "omitida"; mensaje?: string }[]
}

export async function syncFacturasPendientes(empresaId?: number): Promise<SyncResult> {
  const result: SyncResult = { procesadas: 0, sincronizadas: 0, errores: 0, omitidas: 0, detalles: [] }

  if (enVentanaMantenimientoAFIP()) {
    return { ...result, omitidas: 1, detalles: [{ facturaId: 0, resultado: "omitida", mensaje: "Ventana de mantenimiento AFIP (00:00-01:00 ART)" }] }
  }

  const limiteAntigüedad = new Date(Date.now() - HORAS_LIMITE_REINTENTO * 3600_000)

  const pendientes = await prisma.factura.findMany({
    where: {
      estado: "pendiente_cae",
      createdAt: { gte: limiteAntigüedad },
      ...(empresaId ? { empresaId } : {}),
    },
    include: {
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
        select: { cuit: true, dni: true },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,  // máximo por corrida
  })

  // Marcar como error_cae las que superaron el límite
  const vencidas = await prisma.factura.findMany({
    where: {
      estado: "pendiente_cae",
      createdAt: { lt: limiteAntigüedad },
      ...(empresaId ? { empresaId } : {}),
    },
    select: { id: true },
  })
  if (vencidas.length > 0) {
    await prisma.factura.updateMany({
      where: { id: { in: vencidas.map(f => f.id) } },
      data: { estado: "error_cae" },
    })
  }

  result.procesadas = pendientes.length

  for (const factura of pendientes) {
    const { empresa, cliente } = factura
    if (!empresa.certificadoCRT || !empresa.certificadoKEY) {
      result.errores++
      result.detalles.push({ facturaId: factura.id, resultado: "error", mensaje: "Sin certificados AFIP" })
      continue
    }

    try {
      const soapClient = new AFIPSoapClient(empresa.entorno as "homologacion" | "produccion")
      const auth = await soapClient.authenticate(empresa.cuit, empresa.certificadoCRT, empresa.certificadoKEY)

      // Reconstruir el comprobante mínimo para reenviar
      // AFIP permite reenviar con el mismo número si no emitió CAE antes
      const comprobante = {
        Concepto: 1,
        DocTipo: cliente?.cuit ? 80 : (cliente?.dni ? 96 : 99),
        DocNro: cliente?.cuit || cliente?.dni || 0,
        CbteDesde: factura.numero,
        CbteHasta: factura.numero,
        CbteFch: factura.createdAt.toISOString().slice(0, 10).replace(/-/g, ""),
        ImpTotal: factura.total + factura.totalPercepciones,
        ImpTotConc: 0,
        ImpNeto: factura.subtotal,
        ImpOpEx: 0,
        ImpIVA: factura.iva,
        ImpTrib: factura.totalPercepciones,
        MonId: factura.monedaOrigen,
        MonCotiz: factura.tipoCambio,
        // IVA detail is not stored per factura, use total as single alícuota 21%
        // Para un sync correcto deberías guardar el desglose de IVA en otra tabla
        Iva: [{ Id: 5, BaseImp: factura.subtotal, Importe: factura.iva }],
      }

      const resultado = await soapClient.emitirComprobante(auth, empresa.cuit, factura.puntoVenta, comprobante)

      if (resultado.FeDetResp?.FECAEDetResponse?.Resultado !== "A") {
        throw new Error(`AFIP rechazó: ${JSON.stringify(resultado.FeDetResp?.FECAEDetResponse?.Observaciones)}`)
      }

      const cae      = resultado.FeDetResp.FECAEDetResponse.CAE
      const fechaVto = resultado.FeDetResp.FECAEDetResponse.CAEFchVto

      const tipoDocRec = cliente?.cuit ? 80 : (cliente?.dni ? 96 : 99)
      const nroDocRec  = Number(String(cliente?.cuit || cliente?.dni || "0").replace(/\D/g, "")) || 0

      const qrUrl = generarUrlQR(
        empresa.cuit,
        factura.tipoCbte,
        factura.puntoVenta,
        factura.numero,
        cae,
        fechaVto,
        factura.total + factura.totalPercepciones,
        factura.monedaOrigen,
        factura.tipoCambio,
        tipoDocRec,
        nroDocRec,
      )
      const qrBase64 = await QRCode.toDataURL(qrUrl)

      const [year, month, day] = [fechaVto.slice(0, 4), fechaVto.slice(4, 6), fechaVto.slice(6, 8)]
      const vencimientoCAE = new Date(`${year}-${month}-${day}`)

      await prisma.factura.update({
        where: { id: factura.id },
        data: {
          cae,
          fechaCAE: new Date(),
          vencimientoCAE,
          qrBase64,
          estado: "emitida",
        },
      })

      result.sincronizadas++
      result.detalles.push({ facturaId: factura.id, resultado: "ok" })
    } catch (err) {
      result.errores++
      result.detalles.push({
        facturaId: factura.id,
        resultado: "error",
        mensaje: err instanceof Error ? err.message : "Error desconocido",
      })
    }
  }

  return result
}
