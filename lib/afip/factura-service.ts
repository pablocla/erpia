import { prisma } from "@/lib/prisma"
import { AFIPSoapClient } from "./soap-client"
import QRCode from "qrcode"
import type { FacturaPayload, AFIPResponse } from "@/lib/types"
import { onFacturaEmitida } from "@/lib/contabilidad/factura-hooks"
import { calcularImpuestos } from "@/lib/tes/tax-engine"
import type { TaxBreakdown } from "@/lib/tes/types"
import { eventBus } from "@/lib/events/event-bus"
import type { FacturaEmitidaPayload } from "@/lib/events/types"
import { getParametro } from "@/lib/config/parametro-service"
import { padronService } from "@/lib/impuestos/padron-service"
// Register event handlers (stock, CC/CP, contabilidad)
import "@/lib/stock/stock-service"
import "@/lib/cc-cp/cuentas-service"

export class FacturaService {
  private soapClient: AFIPSoapClient

  constructor(entorno: "homologacion" | "produccion") {
    this.soapClient = new AFIPSoapClient(entorno)
  }

  async emitirFactura(payload: FacturaPayload): Promise<AFIPResponse> {
    try {
      // 1. Obtener configuración de la empresa
      const empresa = await prisma.empresa.findUnique({
        where: { cuit: payload.cuit },
      })

      if (!empresa) {
        return { success: false, error: "Empresa no encontrada" }
      }

      if (!empresa.certificadoCRT || !empresa.certificadoKEY) {
        return { success: false, error: "Certificados AFIP no configurados" }
      }

      // 2. Autenticar con AFIP
      const auth = await this.soapClient.authenticate(empresa.cuit, empresa.certificadoCRT, empresa.certificadoKEY)

      // 3. Obtener el último número de comprobante
      const ultimoNumero = await this.soapClient.consultarUltimoComprobante(
        auth,
        empresa.cuit,
        payload.puntoVenta,
        payload.tipoCbte,
      )

      const nuevoNumero = ultimoNumero + 1

      // 4. Calcular totales
      const { subtotal, iva, total } = this.calcularTotales(payload.items)

      // — Optional full tax breakdown (percepciones, IIBB, retenciones)
      let totalPercepciones = 0
      let totalRetenciones  = 0
      let breakdown: TaxBreakdown | null = null

      // — Padrón IIBB lookup: auto-apply special alícuota if client is in padron
      let alicuotaPadronIIBB: number | null = null
      if (payload.cliente.cuit && payload.jurisdiccion) {
        const organismoMap: Record<string, "ARBA" | "AGIP" | "DGR_SF" | "DGR_CBA" | "DGR_MZA"> = {
          PBA: "ARBA", CABA: "AGIP", SF: "DGR_SF", CBA: "DGR_CBA", MZA: "DGR_MZA",
        }
        const org = organismoMap[payload.jurisdiccion]
        if (org) {
          try {
            const padronResult = await padronService.consultarAlicuota(payload.cliente.cuit, org)
            if (padronResult) {
              alicuotaPadronIIBB = padronResult.alicuota
            }
          } catch { /* Non-fatal */ }
        }
      }

      if (payload.jurisdiccion || payload.emisorAgente) {
        try {
          breakdown = calcularImpuestos({
            pais: "AR",
            operacion: "venta",
            emisor: {
              condicionIva: "Responsable Inscripto",
              esAgentePercepcionIVA:   payload.emisorAgente?.esAgentePercepcionIVA   ?? false,
              esAgentePercepcionIIBB:  payload.emisorAgente?.esAgentePercepcionIIBB  ?? false,
            },
            receptor: { condicionIva: payload.cliente.condicionIva },
            subtotalNeto: subtotal,
            items: payload.items.map(item => ({
              descripcion:    item.descripcion,
              cantidad:       item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal:       item.cantidad * item.precioUnitario,
              reducido:       item.iva === 10.5,
              superReducido:  item.iva === 27,
              exento:         item.iva === 0,
            })),
            jurisdiccionPrincipal: payload.jurisdiccion,
            alicuotaPadronIIBB: alicuotaPadronIIBB ?? undefined,
          })
          totalPercepciones = breakdown.totalPercepciones
          totalRetenciones  = breakdown.totalRetenciones
        } catch {
          // Non-fatal: emit the invoice even if full tax engine fails
        }
      }

      // 5. RG 5824/2026: Validate CUIT/CUIL for FC B/C > threshold
      const UMBRAL_RG5824 = await getParametro(empresa.id, "umbral_rg5824", 10_000_000, "AR")
      const esFCB = payload.tipoCbte === 6  // FC B
      const esFCC = payload.tipoCbte === 11 // FC C
      const totalConPercepciones = total + totalPercepciones

      let cuitReceptor: string | null = null
      if ((esFCB || esFCC) && totalConPercepciones >= UMBRAL_RG5824) {
        // RG 5824: CUIT/CUIL obligatorio del consumidor final
        if (!payload.cliente.cuit && !payload.cliente.dni) {
          return {
            success: false,
            error: `RG 5824/2026: Operación >= $${UMBRAL_RG5824.toLocaleString()} requiere CUIT/CUIL del consumidor final`,
          }
        }
        cuitReceptor = payload.cliente.cuit || payload.cliente.dni || null
      }

      // RG 5616/2024: moneda y tipo de cambio
      const monedaOrigen = payload.moneda ?? "PES"
      const tipoCambio = payload.tipoCambio ?? 1
      if (monedaOrigen !== "PES" && tipoCambio <= 0) {
        return {
          success: false,
          error: "RG 5616/2024: tipoCambio obligatorio para operaciones en moneda extranjera",
        }
      }

      // 6. Preparar el comprobante para AFIP
      const comprobante = {
        Concepto: 1, // Productos
        DocTipo: payload.cliente.cuit ? 80 : (payload.cliente.dni ? 96 : 99),
        DocNro: payload.cliente.cuit || payload.cliente.dni || 0,
        CbteDesde: nuevoNumero,
        CbteHasta: nuevoNumero,
        CbteFch: this.formatearFecha(new Date()),
        ImpTotal: totalConPercepciones,
        ImpTotConc: 0,
        ImpNeto: subtotal,
        ImpOpEx: 0,
        ImpIVA: iva,
        ImpTrib: totalPercepciones,
        MonId: monedaOrigen,
        MonCotiz: tipoCambio,
        Iva: this.calcularIVAPorAlicuota(payload.items),
      }

      // 7. Emitir el comprobante en AFIP
      const resultado = await this.soapClient.emitirComprobante(auth, empresa.cuit, payload.puntoVenta, comprobante)

      // 8. Verificar respuesta
      if (resultado.FeDetResp?.FECAEDetResponse?.Resultado !== "A") {
        const errores = resultado.FeDetResp?.FECAEDetResponse?.Observaciones
        return {
          success: false,
          error: `Error AFIP: ${JSON.stringify(errores)}`,
        }
      }

      const cae = resultado.FeDetResp.FECAEDetResponse.CAE
      const fechaCAE = resultado.FeDetResp.FECAEDetResponse.CAEFchVto

      // 9. Generar código QR
      const qrData = this.generarDatosQR(empresa.cuit, payload.tipoCbte, payload.puntoVenta, cae, fechaCAE)
      const qrBase64 = await QRCode.toDataURL(qrData)

      // 10. Guardar la factura en la base de datos
      const cliente = await this.obtenerOCrearCliente(payload.cliente)

      const facturaCreada = await prisma.factura.create({
        data: {
          tipo: this.obtenerTipoFactura(payload.tipoCbte),
          tipoCbte: payload.tipoCbte,
          numero: nuevoNumero,
          puntoVenta: payload.puntoVenta,
          cae,
          fechaCAE: new Date(),
          vencimientoCAE: this.parsearFechaCAE(fechaCAE),
          qrBase64,
          subtotal,
          iva,
          total,
          totalPercepciones,
          totalRetenciones,
          monedaOrigen,
          tipoCambio,
          cuitReceptor,
          modalidadAuth: "CAE",
          empresaId: empresa.id,
          clienteId: cliente.id,
          estado: "emitida",
          lineas: {
            create: payload.items.map((item) => ({
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              productoId: item.productoId,
              precioUnitario: item.precioUnitario,
              porcentajeIva: item.iva,
              subtotal: item.cantidad * item.precioUnitario,
              iva: (item.cantidad * item.precioUnitario * item.iva) / 100,
              total: item.cantidad * item.precioUnitario * (1 + item.iva / 100),
            })),
          },
        },
      })

      if (payload.remitoId) {
        await prisma.remito.updateMany({
          where: { id: payload.remitoId, empresaId: empresa.id },
          data: { facturaId: facturaCreada.id },
        })
      }

      await this.sincronizarNumeradorSerie(empresa.id, payload.puntoVenta, payload.tipoCbte, nuevoNumero)

      await onFacturaEmitida(facturaCreada.id)

      // Emit domain event → stock decrement, CC generation, etc.
      await eventBus.emit<FacturaEmitidaPayload>({
        type: "FACTURA_EMITIDA",
        payload: {
          facturaId: facturaCreada.id,
          empresaId: empresa.id,
          clienteId: cliente.id,
          total,
          condicionPagoId: null,
          depositoId: null,
        },
        timestamp: new Date(),
      })

      return {
        success: true,
        facturaId: facturaCreada.id,
        cae,
        fechaCAE: new Date().toISOString(),
        vencimientoCAE: this.parsearFechaCAE(fechaCAE).toISOString(),
        qrBase64,
        numero: nuevoNumero,
      }
    } catch (error) {
      console.error("Error al emitir factura:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  }

  private calcularTotales(items: FacturaPayload["items"]) {
    let subtotal = 0
    let iva = 0

    items.forEach((item) => {
      const itemSubtotal = item.cantidad * item.precioUnitario
      const itemIva = (itemSubtotal * item.iva) / 100

      subtotal += itemSubtotal
      iva += itemIva
    })

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      iva: Math.round(iva * 100) / 100,
      total: Math.round((subtotal + iva) * 100) / 100,
    }
  }

  private calcularIVAPorAlicuota(items: FacturaPayload["items"]) {
    const ivaMap = new Map<number, number>()

    items.forEach((item) => {
      const itemSubtotal = item.cantidad * item.precioUnitario
      const itemIva = (itemSubtotal * item.iva) / 100

      const current = ivaMap.get(item.iva) || 0
      ivaMap.set(item.iva, current + itemIva)
    })

    return Array.from(ivaMap.entries()).map(([alicuota, importe]) => ({
      Id: this.obtenerCodigoAlicuota(alicuota),
      BaseImp: Math.round(importe * 100) / 100,
      Importe: Math.round(importe * 100) / 100,
    }))
  }

  private obtenerCodigoAlicuota(porcentaje: number): number {
    const codigos: Record<number, number> = {
      0: 3, // 0%
      10.5: 4, // 10.5%
      21: 5, // 21%
      27: 6, // 27%
    }
    return codigos[porcentaje] || 5
  }

  private obtenerTipoFactura(tipoCbte: number): string {
    const tipos: Record<number, string> = {
      1: "A",
      6: "B",
      11: "C",
    }
    return tipos[tipoCbte] || "B"
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, "0")
    const day = String(fecha.getDate()).padStart(2, "0")
    return `${year}${month}${day}`
  }

  private parsearFechaCAE(fechaStr: string): Date {
    // Formato: YYYYMMDD
    const year = Number.parseInt(fechaStr.substring(0, 4))
    const month = Number.parseInt(fechaStr.substring(4, 6)) - 1
    const day = Number.parseInt(fechaStr.substring(6, 8))
    return new Date(year, month, day)
  }

  private generarDatosQR(cuit: string, tipoCbte: number, puntoVenta: number, cae: string, fechaVto: string): string {
    return JSON.stringify({
      ver: 1,
      fecha: new Date().toISOString().split("T")[0],
      cuit,
      ptoVta: puntoVenta,
      tipoCmp: tipoCbte,
      nroCmp: 1,
      importe: 0,
      moneda: "PES",
      ctz: 1,
      tipoDocRec: 99,
      nroDocRec: 0,
      tipoCodAut: "E",
      codAut: cae,
    })
  }

  private async obtenerOCrearCliente(clienteData: FacturaPayload["cliente"]) {
    const where = clienteData.cuit ? { cuit: clienteData.cuit } : { nombre: clienteData.nombre }

    let cliente = await prisma.cliente.findFirst({ where })

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          nombre: clienteData.nombre,
          cuit: clienteData.cuit,
          dni: clienteData.dni,
          condicionIva: clienteData.condicionIva,
        },
      })
    }

    return cliente
  }

  private async sincronizarNumeradorSerie(
    empresaId: number,
    puntoVentaNumero: number,
    tipoCbteAfip: number,
    ultimoNumeroEmitido: number,
  ): Promise<void> {
    try {
      const db = prisma as any
      const puntoVenta = await db.puntoVentaConfig.findFirst({
        where: { empresaId, numero: puntoVentaNumero },
        select: { id: true },
      })
      if (!puntoVenta) return

      await db.serie.updateMany({
        where: {
          puntoVentaId: puntoVenta.id,
          tipoCbteAfip,
          ultimoNumero: { lt: ultimoNumeroEmitido },
        },
        data: { ultimoNumero: ultimoNumeroEmitido },
      })
    } catch {
      // Non-fatal: AFIP and invoice persistence already succeeded.
    }
  }
}
