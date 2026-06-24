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
import {
  buildCbtesAsocFce,
  buildFceOpcionales,
  formatFechaAfip,
  isFceNotaCreditoDebito,
  isFceTipoCbte,
  type TipoTransferenciaFce,
  validateCbu,
} from "./mipyme-fce"
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

      // 1b. Obtener o crear cliente receptor
      const cliente = await this.obtenerOCrearCliente(payload.cliente, empresa.id)

      // 2. Calcular totales
      const { subtotal, iva, total } = this.calcularTotales(payload.items)

      // 2b. Ruteo automático de tipoCbte y puntoVenta (FCE MiPyMEs / Exportación)
      let finalTipoCbte = payload.tipoCbte
      let finalPuntoVenta = payload.puntoVenta

      const { isFeatureActiva } = await import("@/lib/config/rubro-config-service")

      // Determinar si es Exportación
      const esExportacion = cliente.esExportacion || (payload.moneda && payload.moneda !== "PES")
      const moduloExportacionActivo = await isFeatureActiva(empresa.id, "factura_exportacion")

      if (esExportacion && moduloExportacionActivo) {
        if (payload.tipoCbte === 1 || payload.tipoCbte === 6 || payload.tipoCbte === 11) {
          finalTipoCbte = 19 // Factura de Exportación E
        } else if (payload.tipoCbte === 3 || payload.tipoCbte === 8 || payload.tipoCbte === 13) {
          finalTipoCbte = 21 // Nota de Crédito de Exportación E
        } else if (payload.tipoCbte === 2 || payload.tipoCbte === 7 || payload.tipoCbte === 12) {
          finalTipoCbte = 20 // Nota de Débito de Exportación E
        }
      } else {
        // Determinar si es FCE MiPyME
        const moduloMipymeActivo = await isFeatureActiva(empresa.id, "factura_mipymes")
        const umbralMipyme = await getParametro(empresa.id, "umbral_mipyme", 5468127, "AR")

        if (moduloMipymeActivo && cliente.esGranEmpresa && total >= umbralMipyme) {
          if (payload.tipoCbte === 1) finalTipoCbte = 201 // FCE MiPyME A
          else if (payload.tipoCbte === 6) finalTipoCbte = 206 // FCE MiPyME B
          else if (payload.tipoCbte === 11) finalTipoCbte = 211 // FCE MiPyME C
          else if (payload.tipoCbte === 3) finalTipoCbte = 203 // NC FCE A
          else if (payload.tipoCbte === 8) finalTipoCbte = 208 // NC FCE B
          else if (payload.tipoCbte === 13) finalTipoCbte = 213 // NC FCE C
          else if (payload.tipoCbte === 2) finalTipoCbte = 202 // ND FCE A
          else if (payload.tipoCbte === 7) finalTipoCbte = 207 // ND FCE B
          else if (payload.tipoCbte === 12) finalTipoCbte = 212 // ND FCE C
        }
      }

      // Buscar si existe una Serie configurada para finalTipoCbte que defina un Punto de Venta específico
      const serieConfig = await prisma.serie.findFirst({
        where: {
          tipoCbteAfip: finalTipoCbte,
          activo: true,
          puntoVenta: {
            empresaId: empresa.id,
            activo: true,
          },
        },
        include: {
          puntoVenta: true,
        },
      })

      if (serieConfig?.puntoVenta?.numero) {
        finalPuntoVenta = serieConfig.puntoVenta.numero
      }

      // 3. Autenticar con AFIP
      const auth = await this.soapClient.authenticate(empresa.cuit, empresa.certificadoCRT, empresa.certificadoKEY)

      // 4. Obtener el último número de comprobante
      const ultimoNumero = await this.soapClient.consultarUltimoComprobante(
        auth,
        empresa.cuit,
        finalPuntoVenta,
        finalTipoCbte,
      )

      const nuevoNumero = ultimoNumero + 1

      // IDEMPOTENCY: If a factura with this pv+tipo+numero already exists, return it
      const existing = await prisma.factura.findFirst({
        where: {
          empresaId: empresa.id,
          puntoVenta: finalPuntoVenta,
          tipoCbte: finalTipoCbte,
          numero: nuevoNumero,
        },
      })
      if (existing?.cae) {
        return {
          success: true,
          facturaId: existing.id,
          cae: existing.cae,
          fechaCAE: existing.fechaCAE?.toISOString() ?? "",
          vencimientoCAE: existing.vencimientoCAE?.toISOString() ?? "",
          qrBase64: existing.qrBase64 ?? "",
          numero: existing.numero,
        }
      }

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
      const esFCB = finalTipoCbte === 6  // FC B
      const esFCC = finalTipoCbte === 11 // FC C
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
      // Concepto: 1=Productos, 2=Servicios, 3=Productos y Servicios
      const concepto = payload.concepto ?? 1

      // Calcular neto exento y no gravado de los items
      const netoExento = payload.items
        .filter((item) => item.iva === 0 && item.exento)
        .reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0)
      const netoNoGravado = payload.items
        .filter((item) => item.iva === 0 && !item.exento)
        .reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0)
      const netoGravado = subtotal - netoExento - netoNoGravado

      // Build WSFE Tributos[] array from tax engine breakdown
      const tributos: Array<{ Id: number; Desc: string; BaseImp: number; Alic: number; Importe: number }> = []
      if (breakdown) {
        // Percepciones IVA → Tributo Id 1 (Nacional)
        for (const perc of breakdown.percepciones ?? []) {
          tributos.push({
            Id: perc.jurisdiccion === "federal" ? 1 : 2, // 1=Nacional, 2=Provincial
            Desc: perc.nombre ?? `Percepción ${perc.tipo}`,
            BaseImp: perc.base,
            Alic: perc.alicuota,
            Importe: perc.monto,
          })
        }
        // Percepciones IIBB → Tributo Id 2 (Provincial)
        for (const iibb of breakdown.iibb ?? []) {
          if (iibb.monto > 0) {
            tributos.push({
              Id: 2, // Provincial
              Desc: `Percepción IIBB ${iibb.jurisdiccion ?? ""}`,
              BaseImp: iibb.base,
              Alic: iibb.alicuota,
              Importe: iibb.monto,
            })
          }
        }
      }

      const impTrib = tributos.reduce((sum, t) => sum + t.Importe, 0)

      const esFce = isFceTipoCbte(finalTipoCbte)
      let cbuFce: string | null = null
      let tipoTransferenciaFce: TipoTransferenciaFce = "SCA"

      if (esFce) {
        const configFiscal = await prisma.configFiscalEmpresa.findUnique({
          where: { empresaId: empresa.id },
        })
        cbuFce = payload.fce?.cbu ?? configFiscal?.cbuFce ?? null
        tipoTransferenciaFce =
          payload.fce?.tipoTransferencia ??
          (configFiscal?.tipoTransferenciaFce === "ADC" ? "ADC" : "SCA")

        if (!cbuFce || !validateCbu(cbuFce)) {
          return {
            success: false,
            error:
              "FCE MiPyME requiere CBU emisor de 22 dígitos. Configuralo en Parámetros Fiscales → FCE MiPyME.",
          }
        }
      }

      const comprobante: any = {
        CbteTipo: finalTipoCbte,
        Concepto: concepto,
        DocTipo: payload.cliente.cuit ? 80 : (payload.cliente.dni ? 96 : 99),
        DocNro: payload.cliente.cuit || payload.cliente.dni || 0,
        CbteDesde: nuevoNumero,
        CbteHasta: nuevoNumero,
        CbteFch: this.formatearFecha(new Date()),
        ImpTotal: total + impTrib,
        ImpTotConc: netoNoGravado,
        ImpNeto: netoGravado,
        ImpOpEx: netoExento,
        ImpIVA: iva,
        ImpTrib: impTrib,
        MonId: monedaOrigen,
        MonCotiz: tipoCambio,
        Iva: this.calcularIVAPorAlicuota(payload.items),
      }

      // Concepto 2 o 3: servicios requieren fechas
      if (concepto >= 2) {
        if (payload.fechaServicioDesde) comprobante.FchServDesde = this.formatearFecha(payload.fechaServicioDesde)
        if (payload.fechaServicioHasta) comprobante.FchServHasta = this.formatearFecha(payload.fechaServicioHasta)
        if (payload.fechaVtoPago)       comprobante.FchVtoPago   = this.formatearFecha(payload.fechaVtoPago)
      }

      // Include tributos array only if not empty
      if (tributos.length > 0) {
        comprobante.Tributos = tributos
      }

      if (esFce && cbuFce) {
        Object.assign(comprobante, buildFceOpcionales(cbuFce, tipoTransferenciaFce))
      }

      const esNcNd = [2, 3, 7, 8, 12, 13, 202, 203, 207, 208, 212, 213].includes(finalTipoCbte)
      if (esNcNd) {
        let asociado = payload.facturaAsociada
        if (payload.facturaAsociadaId) {
          const facOrig = await prisma.factura.findFirst({
            where: { id: payload.facturaAsociadaId, empresaId: empresa.id },
          })
          if (facOrig) {
            asociado = {
              tipoCbte: facOrig.tipoCbte,
              puntoVenta: facOrig.puntoVenta,
              numero: facOrig.numero,
              fecha: facOrig.createdAt,
            }
          }
        }
        if (!asociado) {
          return {
            success: false,
            error: "NC/ND requiere facturaAsociada o facturaAsociadaId",
          }
        }
        const cbteAsoc = {
          Tipo: asociado.tipoCbte,
          PtoVta: asociado.puntoVenta,
          Nro: asociado.numero,
          Cuit: empresa.cuit.replace(/\D/g, ""),
          CbteFch: asociado.fecha
            ? formatFechaAfip(asociado.fecha)
            : this.formatearFecha(new Date()),
        }
        if (esFce && isFceNotaCreditoDebito(finalTipoCbte)) {
          Object.assign(comprobante, buildCbtesAsocFce(cbteAsoc))
        } else {
          Object.assign(comprobante, { CbteAsoc: [cbteAsoc] })
        }
      }

      // 7. Guardar factura localmente (Transacción Segura / Saga Pattern)
      const facturaCreada = await prisma.$transaction(async (tx) => {
        const factura = await tx.factura.create({
          data: {
            tipo: this.obtenerTipoFactura(finalTipoCbte),
            tipoCbte: finalTipoCbte,
            numero: nuevoNumero,
            puntoVenta: finalPuntoVenta,
            cae: null,
            fechaCAE: null,
            vencimientoCAE: null,
            qrBase64: null,
            estado: "pendiente_cae",
            subtotal,
            iva,
            total,
            totalPercepciones: impTrib,
            totalRetenciones,
            monedaOrigen,
            tipoCambio,
            cuitReceptor,
            modalidadAuth: "CAE",
            concepto,
            netoExento,
            netoNoGravado,
            impInternosTotal: 0,
            condicionIvaReceptor: payload.cliente.condicionIva,
            fechaServicioDesde: concepto >= 2 ? payload.fechaServicioDesde : undefined,
            fechaServicioHasta: concepto >= 2 ? payload.fechaServicioHasta : undefined,
            fechaVtoPago: concepto >= 2 ? payload.fechaVtoPago : undefined,
            empresaId: empresa.id,
            clienteId: cliente.id,
            lineas: {
              create: payload.items.map((item) => {
                const codigoAfipIva = this.ivaToCodigoAfip(item.iva)
                return {
                  descripcion: item.descripcion,
                  cantidad: item.cantidad,
                  productoId: item.productoId,
                  precioUnitario: item.precioUnitario,
                  porcentajeIva: item.iva,
                  codigoAfipIva,
                  subtotal: item.cantidad * item.precioUnitario,
                  iva: (item.cantidad * item.precioUnitario * item.iva) / 100,
                  total: item.cantidad * item.precioUnitario * (1 + item.iva / 100),
                }
              }),
            },
            tributos: tributos.length > 0 ? {
              create: tributos.map((t) => ({
                codigoAfip: t.Id,
                descripcion: t.Desc,
                baseImponible: t.BaseImp,
                alicuota: t.Alic,
                importe: t.Importe,
                empresaId: empresa.id,
              })),
            } : undefined,
          },
        })

        if (payload.remitoId) {
          await tx.remito.updateMany({
            where: { id: payload.remitoId, empresaId: empresa.id },
            data: { facturaId: factura.id },
          })
        }
        return factura
      })

      // 8. Emitir el comprobante en AFIP (con fallback offline)
      let cae = ""
      let fechaCAE = ""
      let modoOffline = false

      try {
        const resultado = await this.soapClient.emitirComprobante(auth, empresa.cuit, finalPuntoVenta, comprobante, empresa.id)

        // 9. Verificar respuesta AFIP
        if (resultado.FeDetResp?.FECAEDetResponse?.Resultado !== "A") {
          const errores = resultado.FeDetResp?.FECAEDetResponse?.Observaciones
          await prisma.factura.update({
            where: { id: facturaCreada.id },
            data: { estado: "rechazada_afip" }
          })
          return {
            success: false,
            error: `Error AFIP: ${JSON.stringify(errores)}`,
          }
        }

        cae = resultado.FeDetResp.FECAEDetResponse.CAE
        fechaCAE = resultado.FeDetResp.FECAEDetResponse.CAEFchVto
      } catch (afipErr) {
        // AFIP caído: guardamos en modo offline para sincronizar después.
        const esErrorConectividad = afipErr instanceof Error && (
          afipErr.message.includes("ECONNREFUSED") ||
          afipErr.message.includes("ETIMEDOUT") ||
          afipErr.message.includes("ENOTFOUND") ||
          afipErr.message.includes("socket hang up") ||
          afipErr.message.toLowerCase().includes("timeout")
        )

        if (!esErrorConectividad) {
           await prisma.factura.update({
             where: { id: facturaCreada.id },
             data: { estado: "rechazada_afip" }
           })
           throw afipErr  // error lógico → propagar
        }

        modoOffline = true
        console.warn("[FacturaService] AFIP no disponible — guardando como PENDIENTE_CAE")
      }

      // 10. Generar código QR y actualizar local
      const tipoDocReceptor = payload.cliente.cuit ? 80 : (payload.cliente.dni ? 96 : 99)
      const nroDocReceptor  = payload.cliente.cuit || payload.cliente.dni || 0
      let qrBase64: string | null = null

      if (!modoOffline && cae) {
        const qrData = this.generarDatosQR(
          empresa.cuit,
          finalTipoCbte,
          finalPuntoVenta,
          nuevoNumero,
          cae,
          fechaCAE,
          total + impTrib,
          monedaOrigen,
          tipoCambio,
          tipoDocReceptor,
          nroDocReceptor,
        )
        qrBase64 = await QRCode.toDataURL(qrData)

        await prisma.factura.update({
          where: { id: facturaCreada.id },
          data: {
            cae,
            fechaCAE: new Date(),
            vencimientoCAE: this.parsearFechaCAE(fechaCAE),
            qrBase64,
            estado: "emitida",
          }
        })
      }

      await this.sincronizarNumeradorSerie(empresa.id, finalPuntoVenta, finalTipoCbte, nuevoNumero)

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

      if (modoOffline) {
        return {
          success: true,
          facturaId: facturaCreada.id,
          cae: "",
          fechaCAE: "",
          vencimientoCAE: "",
          qrBase64: "",
          numero: nuevoNumero,
          pendienteCAE: true,
          advertencia: "AFIP no disponible. La factura quedó guardada en modo PENDIENTE_CAE y se sincronizará automáticamente cuando AFIP esté en línea.",
        }
      }

      return {
        success: true,
        facturaId: facturaCreada.id,
        cae,
        fechaCAE: new Date().toISOString(),
        vencimientoCAE: this.parsearFechaCAE(fechaCAE).toISOString(),
        qrBase64: qrBase64 ?? "",
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
    // WSFE Iva[]: BaseImp = base neta gravada, Importe = monto de IVA
    // Ambos deben ir separados por alícuota.
    const ivaMap = new Map<number, { base: number; importe: number }>()

    for (const item of items) {
      const base = item.cantidad * item.precioUnitario
      const ivaImporte = (base * item.iva) / 100
      const entry = ivaMap.get(item.iva) ?? { base: 0, importe: 0 }
      ivaMap.set(item.iva, {
        base: entry.base + base,
        importe: entry.importe + ivaImporte,
      })
    }

    return Array.from(ivaMap.entries())
      .filter(([, v]) => v.base > 0)
      .map(([alicuota, { base, importe }]) => ({
        Id: this.obtenerCodigoAlicuota(alicuota),
        BaseImp: Math.round(base * 100) / 100,
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
      1: "A", 2: "A", 3: "A",
      6: "B", 7: "B", 8: "B",
      11: "C", 12: "C", 13: "C",
      19: "E", 20: "E", 21: "E", // Exportación
      201: "A", 202: "A", 203: "A", // MiPyMEs A
      206: "B", 207: "B", 208: "B", // MiPyMEs B
      211: "C", 212: "C", 213: "C", // MiPyMEs C
    }
    return tipos[tipoCbte] || "B"
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, "0")
    const day = String(fecha.getDate()).padStart(2, "0")
    return `${year}${month}${day}`
  }

  /**
   * Maps IVA percentage to AFIP IVA code (WSFE Iva[] array Id).
   * 3=0%, 4=10.5%, 5=21%, 6=27%, 8=5%, 9=2.5%
   */
  private ivaToCodigoAfip(porcentajeIva: number): string {
    const map: Record<number, string> = { 0: "3", 2.5: "9", 5: "8", 10.5: "4", 21: "5", 27: "6" }
    return map[porcentajeIva] ?? "5"
  }

  private parsearFechaCAE(fechaStr: string): Date {
    // Formato: YYYYMMDD
    const year = Number.parseInt(fechaStr.substring(0, 4))
    const month = Number.parseInt(fechaStr.substring(4, 6)) - 1
    const day = Number.parseInt(fechaStr.substring(6, 8))
    return new Date(year, month, day)
  }

  /**
   * Genera el payload JSON del QR AFIP según RG 4291/2018 y su actualización.
   * La URL de verificación es: https://www.afip.gob.ar/fe/qr/?p=<base64url(json)>
   */
  private generarDatosQR(
    cuit: string,
    tipoCbte: number,
    puntoVenta: number,
    nroComprobante: number,
    cae: string,
    fechaVto: string,
    importe: number,
    moneda: string,
    tipoCambio: number,
    tipoDocReceptor: number,
    nroDocReceptor: number | string,
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
      tipoDocRec: tipoDocReceptor,
      nroDocRec: Number(String(nroDocReceptor).replace(/\D/g, "")) || 0,
      tipoCodAut: "E",
      codAut: Number(cae),
    }
    // Base64url encode para incluir en la URL de AFIP
    const base64 = Buffer.from(JSON.stringify(payload)).toString("base64url")
    return `https://www.afip.gob.ar/fe/qr/?p=${base64}`
  }

  private async obtenerOCrearCliente(clienteData: FacturaPayload["cliente"], empresaId: number) {
    const where = clienteData.cuit ? { cuit: clienteData.cuit } : { nombre: clienteData.nombre }

    let cliente = await prisma.cliente.findFirst({ where })

    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          nombre: clienteData.nombre,
          cuit: clienteData.cuit,
          dni: clienteData.dni,
          condicionIva: clienteData.condicionIva,
          empresaId,
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
