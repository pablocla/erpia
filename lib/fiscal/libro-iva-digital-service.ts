/**
 * Libro IVA Digital Service — Generador Oficial AFIP (RG 4597 / RG 3685)
 *
 * Genera los 4 archivos oficiales de longitud fija estricta para el Portal IVA:
 *   1. LIBRO_IVA_DIGITAL_VENTAS_CBTE.txt  -> 266 caracteres por línea
 *   2. LIBRO_IVA_DIGITAL_VENTAS_ALICUOTAS.txt -> 62 caracteres por línea
 *   3. LIBRO_IVA_DIGITAL_COMPRAS_CBTE.txt -> 325 caracteres por línea
 *   4. LIBRO_IVA_DIGITAL_COMPRAS_ALICUOTAS.txt -> 84 caracteres por línea
 */

import { prisma } from "@/lib/prisma"
import { padLeft, padRight, formatDecimalFixed, formatAfipDate } from "./afip-txt-builder"

// Mapeo oficial de alícuotas AFIP (Tabla de alícuotas de IVA)
export const CODIGOS_ALICUOTA_AFIP: Record<number, string> = {
  0: "0003",
  10.5: "0004",
  21: "0005",
  27: "0006",
  5: "0008",
  2.5: "0009",
}

export function resolverCodigoAlicuotaAfip(porcentaje: number): string {
  const p = Math.round(porcentaje * 10) / 10
  return CODIGOS_ALICUOTA_AFIP[p] ?? "0005" // Fallback 21%
}

export interface LibroIvaVentasOutput {
  comprobantesTxt: string
  alicuotasTxt: string
  cantidadComprobantes: number
  cantidadAlicuotas: number
  nombreArchivoCbte: string
  nombreArchivoAlicuotas: string
}

export interface LibroIvaComprasOutput {
  comprobantesTxt: string
  alicuotasTxt: string
  cantidadComprobantes: number
  cantidadAlicuotas: number
  nombreArchivoCbte: string
  nombreArchivoAlicuotas: string
}

export class LibroIvaDigitalService {
  /**
   * Genera los archivos de Libro IVA Digital Ventas (Comprobantes 266 chars + Alícuotas 62 chars)
   */
  async generarVentas(empresaId: number, periodo: string): Promise<LibroIvaVentasOutput> {
    const [anio, mes] = periodo.split("-").map(Number)
    const desde = new Date(anio, mes - 1, 1)
    const hasta = new Date(anio, mes, 0, 23, 59, 59)

    const facturas = await prisma.factura.findMany({
      where: {
        empresaId,
        createdAt: { gte: desde, lte: hasta },
        estado: { not: "anulada" },
      },
      include: {
        cliente: { select: { cuit: true, dni: true, nombre: true } },
        lineas: true,
      },
      orderBy: { createdAt: "asc" },
    })

    const lineasCbte: string[] = []
    const lineasAlicuotas: string[] = []

    for (const fac of facturas) {
      // 1. Datos básicos
      const fecha = formatAfipDate(new Date(fac.createdAt))
      const tipoCbte = padLeft(fac.tipoCbte ?? 6, 3)
      const puntoVenta = padLeft(fac.puntoVenta, 5)
      const numeroCbte = padLeft(fac.numero, 20)
      const numeroCbteHasta = numeroCbte

      // 2. Documento comprador
      const cuitLimpio = (fac.cliente.cuit ?? "").replace(/\D/g, "")
      const dniLimpio = (fac.cliente.dni ?? "").replace(/\D/g, "")
      let tipoDoc = "99" // Sin identificar / Consumidor Final
      let nroDoc = "".padStart(20, "0")

      if (cuitLimpio.length === 11) {
        tipoDoc = "80" // CUIT
        nroDoc = padLeft(cuitLimpio, 20)
      } else if (dniLimpio.length >= 7) {
        tipoDoc = "96" // DNI
        nroDoc = padLeft(dniLimpio, 20)
      }

      const denominacion = padRight((fac.cliente.nombre ?? "CONSUMIDOR FINAL").toUpperCase(), 30)

      // 3. Importes
      const total = formatDecimalFixed(Number(fac.total), 15, 2)
      const noGravado = formatDecimalFixed(Number(fac.netoNoGravado ?? 0), 15, 2)
      const noCategorizado = "".padStart(15, "0")
      const exento = formatDecimalFixed(Number(fac.netoExento ?? 0), 15, 2)
      const percepcionesNac = "".padStart(15, "0")
      const percepcionesIIBB = formatDecimalFixed(Number(fac.totalPercepciones ?? 0), 15, 2)
      const percepcionesMun = "".padStart(15, "0")
      const impuestosInternos = "".padStart(15, "0")
      const codigoMoneda = padRight(fac.monedaOrigen ?? "PES", 3)
      const tipoCambio = formatDecimalFixed(fac.tipoCambio ?? 1, 10, 6)

      // 4. Determinar alícuotas agrupadas por porcentaje
      const mapaAlicuotas: Record<number, { neto: number; iva: number }> = {}

      if (fac.lineas.length > 0) {
        for (const l of fac.lineas) {
          const porc = l.porcentajeIva ?? 21
          const sub = Number(l.subtotal ?? (Number(l.precioUnitario) * Number(l.cantidad)))
          const ivaLin = Math.round(sub * (porc / 100) * 100) / 100

          if (!mapaAlicuotas[porc]) {
            mapaAlicuotas[porc] = { neto: 0, iva: 0 }
          }
          mapaAlicuotas[porc].neto += sub
          mapaAlicuotas[porc].iva += ivaLin
        }
      } else {
        // Si no hay líneas detalladas, inferir de subtotal e iva global
        const ivaTotal = Number(fac.iva)
        const subtotal = Number(fac.subtotal)
        const porcInferido = subtotal > 0 ? (ivaTotal > 0 ? 21 : 0) : 0
        mapaAlicuotas[porcInferido] = { neto: subtotal, iva: ivaTotal }
      }

      const entriesAlicuotas = Object.entries(mapaAlicuotas)
      const cantAlicuotas = String(entriesAlicuotas.length).padStart(1, "1")
      const codigoOperacion = Number(fac.subtotal) > 0 ? "0" : (Number(fac.netoExento ?? 0) > 0 ? "E" : "N")
      const otrosTributos = "".padStart(15, "0")
      const fechaVtoPago = fac.fechaVtoPago ? formatAfipDate(new Date(fac.fechaVtoPago)) : "".padStart(8, "0")

      // Construir línea de Comprobante (266 caracteres)
      const registroCbte =
        fecha +              // 8
        tipoCbte +           // 3
        puntoVenta +         // 5
        numeroCbte +         // 20
        numeroCbteHasta +    // 20
        tipoDoc +            // 2
        nroDoc +             // 20
        denominacion +       // 30
        total +              // 15
        noGravado +          // 15
        noCategorizado +     // 15
        exento +             // 15
        percepcionesNac +    // 15
        percepcionesIIBB +   // 15
        percepcionesMun +    // 15
        impuestosInternos +  // 15
        codigoMoneda +       // 3
        tipoCambio +         // 10
        cantAlicuotas +      // 1
        codigoOperacion +    // 1
        otrosTributos +      // 15
        fechaVtoPago         // 8
        // Total: 266

      lineasCbte.push(registroCbte)

      // Construir líneas de Alícuotas (62 caracteres cada una)
      for (const [porcStr, valores] of entriesAlicuotas) {
        const porc = Number(porcStr)
        const codAlicuota = resolverCodigoAlicuotaAfip(porc)
        const netoGravado = formatDecimalFixed(valores.neto, 15, 2)
        const liquidado = formatDecimalFixed(valores.iva, 15, 2)

        const registroAlicuota =
          tipoCbte +      // 3
          puntoVenta +    // 5
          numeroCbte +    // 20
          netoGravado +   // 15
          codAlicuota +   // 4
          liquidado       // 15
          // Total: 62

        lineasAlicuotas.push(registroAlicuota)
      }
    }

    const periodoLimpio = periodo.replace("-", "")

    return {
      comprobantesTxt: lineasCbte.join("\r\n"),
      alicuotasTxt: lineasAlicuotas.join("\r\n"),
      cantidadComprobantes: lineasCbte.length,
      cantidadAlicuotas: lineasAlicuotas.length,
      nombreArchivoCbte: `LIBRO_IVA_DIGITAL_VENTAS_CBTE_${periodoLimpio}.txt`,
      nombreArchivoAlicuotas: `LIBRO_IVA_DIGITAL_VENTAS_ALICUOTAS_${periodoLimpio}.txt`,
    }
  }

  /**
   * Genera los archivos de Libro IVA Digital Compras (Comprobantes 325 chars + Alícuotas 84 chars)
   */
  async generarCompras(empresaId: number, periodo: string): Promise<LibroIvaComprasOutput> {
    const [anio, mes] = periodo.split("-").map(Number)
    const desde = new Date(anio, mes - 1, 1)
    const hasta = new Date(anio, mes, 0, 23, 59, 59)

    const compras = await prisma.compra.findMany({
      where: {
        empresaId,
        fecha: { gte: desde, lte: hasta },
        deletedAt: null,
      },
      include: {
        proveedor: { select: { cuit: true, nombre: true } },
        lineas: true,
      },
      orderBy: { fecha: "asc" },
    })

    const lineasCbte: string[] = []
    const lineasAlicuotas: string[] = []

    for (const comp of compras) {
      const fecha = formatAfipDate(new Date(comp.fecha))
      const tipoCbteMap: Record<string, string> = { A: "001", B: "006", C: "011", M: "051" }
      const tipoCbte = tipoCbteMap[comp.tipo] ?? "001"
      const puntoVenta = padLeft(comp.puntoVenta ?? "1", 5)
      const numeroCbte = padLeft(comp.numero ?? "1", 20)
      const despachoImp = "".padStart(16, " ") // 16 espacios si no es importación
      const tipoDoc = "80" // CUIT vendedor
      const cuitVendedor = (comp.proveedor.cuit ?? "").replace(/\D/g, "")
      const nroDoc = padLeft(cuitVendedor, 20)
      const denominacion = padRight((comp.proveedor.nombre ?? "PROVEEDOR").toUpperCase(), 30)

      const total = formatDecimalFixed(Number(comp.total), 15, 2)
      const noGravado = formatDecimalFixed(Number(comp.netoNoGravado ?? 0), 15, 2)
      const exento = formatDecimalFixed(Number(comp.netoExento ?? 0), 15, 2)
      const percIva = "".padStart(15, "0")
      const percNac = "".padStart(15, "0")
      const percIIBB = formatDecimalFixed(Number(comp.totalPercepciones ?? 0), 15, 2)
      const percMun = "".padStart(15, "0")
      const impInternos = "".padStart(15, "0")
      const codigoMoneda = padRight(comp.monedaOrigen ?? "PES", 3)
      const tipoCambio = formatDecimalFixed(comp.tipoCambio ?? 1, 10, 6)

      // Alícuota estimada / líneas
      const cantAlicuotas = "1"
      const codigoOperacion = "0"
      const creditoFiscalComputable = formatDecimalFixed(Number(comp.iva ?? 0), 15, 2)
      const otrosTributos = "".padStart(15, "0")
      const cuitEmisorCorredor = "".padStart(11, "0")
      const denomEmisorCorredor = "".padStart(30, " ")
      const ivaComision = "".padStart(15, "0")

      // Construir Comprobante Compras (325 caracteres)
      const registroCbte =
        fecha +                   // 8
        tipoCbte +                // 3
        puntoVenta +              // 5
        numeroCbte +              // 20
        despachoImp +             // 16
        tipoDoc +                 // 2
        nroDoc +                  // 20
        denominacion +            // 30
        total +                   // 15
        noGravado +               // 15
        exento +                  // 15
        percIva +                 // 15
        percNac +                 // 15
        percIIBB +                // 15
        percMun +                 // 15
        impInternos +             // 15
        codigoMoneda +            // 3
        tipoCambio +              // 10
        cantAlicuotas +           // 1
        codigoOperacion +         // 1
        creditoFiscalComputable + // 15
        otrosTributos +           // 15
        cuitEmisorCorredor +      // 11
        denomEmisorCorredor +     // 30
        ivaComision               // 15
        // Total: 325

      lineasCbte.push(registroCbte)

      // Construir Alícuotas Compras (84 caracteres)
      const netoGravado = formatDecimalFixed(Number(comp.subtotal), 15, 2)
      const codAlicuota = "0005" // 21% por defecto
      const liquidado = formatDecimalFixed(Number(comp.iva ?? 0), 15, 2)

      const registroAlicuota =
        tipoCbte +      // 3
        puntoVenta +    // 5
        numeroCbte +    // 20
        tipoDoc +       // 2
        nroDoc +        // 20
        netoGravado +   // 15
        codAlicuota +   // 4
        liquidado       // 15
        // Total: 84

      lineasAlicuotas.push(registroAlicuota)
    }

    const periodoLimpio = periodo.replace("-", "")

    return {
      comprobantesTxt: lineasCbte.join("\r\n"),
      alicuotasTxt: lineasAlicuotas.join("\r\n"),
      cantidadComprobantes: lineasCbte.length,
      cantidadAlicuotas: lineasAlicuotas.length,
      nombreArchivoCbte: `LIBRO_IVA_DIGITAL_COMPRAS_CBTE_${periodoLimpio}.txt`,
      nombreArchivoAlicuotas: `LIBRO_IVA_DIGITAL_COMPRAS_ALICUOTAS_${periodoLimpio}.txt`,
    }
  }
}

export const libroIvaDigitalService = new LibroIvaDigitalService()
