import { prisma } from "@/lib/prisma"
import type { ReporteIVA } from "@/lib/types"

export class IVAService {
  async calcularIVAPeriodo(mes: number, anio: number, empresaId?: number): Promise<ReporteIVA> {
    // Calcular fechas del período
    const fechaDesde = new Date(anio, mes - 1, 1)
    const fechaHasta = new Date(anio, mes, 0, 23, 59, 59)

    const empresaFilter = empresaId ? { empresaId } : {}

    // Obtener todas las facturas de venta del período
    const facturas = await prisma.factura.findMany({
      where: {
        ...empresaFilter,
        createdAt: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
        estado: "emitida",
      },
      include: {
        lineas: true,
        tributos: true,
      },
    })

    // Obtener todas las compras del período
    const compras = await prisma.compra.findMany({
      where: {
        ...empresaFilter,
        fecha: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
      },
      include: {
        lineas: true,
        tributos: true,
      },
    })

    // Calcular IVA Ventas (Débito Fiscal)
    const ivaVentas = this.calcularIVAVentas(facturas)

    // Calcular IVA Compras (Crédito Fiscal)
    const ivaCompras = this.calcularIVACompras(compras)

    // Calcular saldo
    const saldo = ivaVentas.total - ivaCompras.total

    return {
      periodo: `${mes.toString().padStart(2, "0")}/${anio}`,
      ivaVentas,
      ivaCompras,
      saldo,
    }
  }

  private calcularIVAVentas(facturas: any[]) {
    let total = 0
    let base = 0
    let iva21 = 0
    let iva105 = 0
    let iva27 = 0
    let iva5 = 0
    let iva25 = 0
    let totalPercepciones = 0
    let netoExento = 0
    let netoNoGravado = 0

    facturas.forEach((factura) => {
      total += factura.iva
      base += factura.subtotal
      totalPercepciones += factura.totalPercepciones ?? 0
      netoExento += factura.netoExento ?? 0
      netoNoGravado += factura.netoNoGravado ?? 0

      factura.lineas.forEach((linea: any) => {
        if (linea.porcentajeIva === 21) {
          iva21 += linea.iva
        } else if (linea.porcentajeIva === 10.5) {
          iva105 += linea.iva
        } else if (linea.porcentajeIva === 27) {
          iva27 += linea.iva
        } else if (linea.porcentajeIva === 5) {
          iva5 += linea.iva
        } else if (linea.porcentajeIva === 2.5) {
          iva25 += linea.iva
        }
      })
    })

    return {
      total: Math.round(total * 100) / 100,
      base: Math.round(base * 100) / 100,
      iva21: Math.round(iva21 * 100) / 100,
      iva105: Math.round(iva105 * 100) / 100,
      iva27: Math.round(iva27 * 100) / 100,
      iva5: Math.round(iva5 * 100) / 100,
      iva25: Math.round(iva25 * 100) / 100,
      totalPercepciones: Math.round(totalPercepciones * 100) / 100,
      netoExento: Math.round(netoExento * 100) / 100,
      netoNoGravado: Math.round(netoNoGravado * 100) / 100,
    }
  }

  private calcularIVACompras(compras: any[]) {
    let total = 0
    let base = 0
    let iva21 = 0
    let iva105 = 0
    let iva27 = 0
    let iva5 = 0
    let iva25 = 0
    let totalRetenciones = 0
    let netoExento = 0
    let netoNoGravado = 0

    compras.forEach((compra) => {
      total += compra.iva
      base += compra.subtotal
      totalRetenciones += compra.totalRetenciones ?? 0
      netoExento += compra.netoExento ?? 0
      netoNoGravado += compra.netoNoGravado ?? 0

      compra.lineas.forEach((linea: any) => {
        if (linea.porcentajeIva === 21) {
          iva21 += linea.iva
        } else if (linea.porcentajeIva === 10.5) {
          iva105 += linea.iva
        } else if (linea.porcentajeIva === 27) {
          iva27 += linea.iva
        } else if (linea.porcentajeIva === 5) {
          iva5 += linea.iva
        } else if (linea.porcentajeIva === 2.5) {
          iva25 += linea.iva
        }
      })
    })

    return {
      total: Math.round(total * 100) / 100,
      base: Math.round(base * 100) / 100,
      iva21: Math.round(iva21 * 100) / 100,
      iva105: Math.round(iva105 * 100) / 100,
      iva27: Math.round(iva27 * 100) / 100,
      iva5: Math.round(iva5 * 100) / 100,
      iva25: Math.round(iva25 * 100) / 100,
      totalRetenciones: Math.round(totalRetenciones * 100) / 100,
      netoExento: Math.round(netoExento * 100) / 100,
      netoNoGravado: Math.round(netoNoGravado * 100) / 100,
    }
  }

  async generarLibroIVAVentas(mes: number, anio: number, empresaId?: number) {
    const fechaDesde = new Date(anio, mes - 1, 1)
    const fechaHasta = new Date(anio, mes, 0, 23, 59, 59)

    const empresaFilter = empresaId ? { empresaId } : {}

    const facturas = await prisma.factura.findMany({
      where: {
        ...empresaFilter,
        createdAt: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
        estado: "emitida",
      },
      include: {
        cliente: true,
        lineas: true,
        tributos: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return facturas.map((factura) => ({
      fecha: factura.createdAt,
      tipo: factura.tipo,
      puntoVenta: factura.puntoVenta,
      numero: factura.numero,
      cliente: {
        nombre: factura.cliente.nombre,
        cuit: factura.cliente.cuit,
        condicionIva: factura.cliente.condicionIva,
      },
      neto: factura.subtotal,
      netoExento: factura.netoExento ?? 0,
      netoNoGravado: factura.netoNoGravado ?? 0,
      iva: factura.iva,
      percepciones: factura.totalPercepciones ?? 0,
      tributos: (factura as any).tributos?.map((t: any) => ({
        descripcion: t.descripcion,
        codigoAfip: t.codigoAfip,
        baseImponible: t.baseImponible,
        alicuota: t.alicuota,
        importe: t.importe,
      })) ?? [],
      total: factura.total + (factura.totalPercepciones ?? 0),
      cae: factura.cae,
    }))
  }

  async generarLibroIVACompras(mes: number, anio: number, empresaId?: number) {
    const fechaDesde = new Date(anio, mes - 1, 1)
    const fechaHasta = new Date(anio, mes, 0, 23, 59, 59)

    const empresaFilter = empresaId ? { empresaId } : {}

    const compras = await prisma.compra.findMany({
      where: {
        ...empresaFilter,
        fecha: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
      },
      include: {
        proveedor: true,
        lineas: true,
        tributos: true,
      },
      orderBy: {
        fecha: "asc",
      },
    })

    return compras.map((compra) => ({
      fecha: compra.fecha,
      tipo: compra.tipo,
      puntoVenta: compra.puntoVenta,
      numero: compra.numero,
      proveedor: {
        nombre: compra.proveedor.nombre,
        cuit: compra.proveedor.cuit,
        condicionIva: compra.proveedor.condicionIva,
      },
      neto: compra.subtotal,
      netoExento: compra.netoExento ?? 0,
      netoNoGravado: compra.netoNoGravado ?? 0,
      iva: compra.iva,
      retenciones: compra.totalRetenciones ?? 0,
      tributos: (compra as any).tributos?.map((t: any) => ({
        descripcion: t.descripcion,
        codigoAfip: t.codigoAfip,
        baseImponible: t.baseImponible,
        alicuota: t.alicuota,
        importe: t.importe,
      })) ?? [],
      total: compra.total,
    }))
  }

  async exportarLibroIVAVentasCSV(mes: number, anio: number): Promise<string> {
    const libro = await this.generarLibroIVAVentas(mes, anio)

    let csv = "Fecha,Tipo,Punto Venta,N\u00famero,Cliente,CUIT,Condici\u00f3n IVA,Neto,IVA,Percepciones,Total,CAE\n"

    libro.forEach((registro) => {
      const fecha = registro.fecha.toISOString().split("T")[0]
      csv += `"${fecha}","${registro.tipo}",${registro.puntoVenta},${registro.numero},"${registro.cliente.nombre}","${registro.cliente.cuit || ""}","${registro.cliente.condicionIva}",${registro.neto},${registro.iva},${(registro as any).percepciones ?? 0},${registro.total},"${registro.cae}"\n`
    })

    return csv
  }

  async exportarLibroIVAComprasCSV(mes: number, anio: number): Promise<string> {
    const libro = await this.generarLibroIVACompras(mes, anio)

    let csv = "Fecha,Tipo,Punto Venta,N\u00famero,Proveedor,CUIT,Condici\u00f3n IVA,Neto,IVA,Retenciones,Total\n"

    libro.forEach((registro) => {
      const fecha = registro.fecha.toISOString().split("T")[0]
      csv += `"${fecha}","${registro.tipo}","${registro.puntoVenta}","${registro.numero}","${registro.proveedor.nombre}","${registro.proveedor.cuit}","${registro.proveedor.condicionIva}",${registro.neto},${registro.iva},${(registro as any).retenciones ?? 0},${registro.total}\n`
    })

    return csv
  }

  async generarArchivoPresentacionAFIP(mes: number, anio: number): Promise<string> {
    const reporte = await this.calcularIVAPeriodo(mes, anio)
    const libroVentas = await this.generarLibroIVAVentas(mes, anio)
    const libroCompras = await this.generarLibroIVACompras(mes, anio)

    let archivo = `DECLARACIÓN JURADA IVA - PERÍODO ${reporte.periodo}\n\n`

    archivo += "=== RESUMEN ===\n"
    archivo += `IVA Débito Fiscal (Ventas): $${reporte.ivaVentas.total}\n`
    archivo += `  - Base Imponible: $${reporte.ivaVentas.base}\n`
    archivo += `  - IVA 21%: $${reporte.ivaVentas.iva21}\n`
    archivo += `  - IVA 10.5%: $${reporte.ivaVentas.iva105}\n`
    archivo += `  - IVA 27%: $${reporte.ivaVentas.iva27}\n\n`

    archivo += `IVA Crédito Fiscal (Compras): $${reporte.ivaCompras.total}\n`
    archivo += `  - Base Imponible: $${reporte.ivaCompras.base}\n`
    archivo += `  - IVA 21%: $${reporte.ivaCompras.iva21}\n`
    archivo += `  - IVA 10.5%: $${reporte.ivaCompras.iva105}\n`
    archivo += `  - IVA 27%: $${reporte.ivaCompras.iva27}\n\n`

    archivo += `SALDO A FAVOR/EN CONTRA: $${reporte.saldo}\n`
    archivo += reporte.saldo > 0 ? "(A PAGAR)\n\n" : "(A FAVOR)\n\n"

    archivo += "=== DETALLE DE VENTAS ===\n"
    archivo += `Total de comprobantes: ${libroVentas.length}\n\n`

    archivo += "=== DETALLE DE COMPRAS ===\n"
    archivo += `Total de comprobantes: ${libroCompras.length}\n\n`

    archivo += "Nota: Use generarLibroIVADigitalVentas/Compras para archivo RG 4597 importable a AFIP.\n"

    return archivo
  }

  /**
   * Libro IVA Digital - Ventas (RG 4597/2019)
   * Fixed-width text file per AFIP specification for PORTAL IVA import.
   *
   * Fields (in order): fecha, tipo_cbte, pto_venta, nro_cbte_desde, nro_cbte_hasta,
   *   cod_doc_comprador, nro_doc_comprador, apellido_nombre, imp_total, imp_tot_conc,
   *   imp_neto_no_gravado, imp_op_exentas, percepciones_iva, percepciones_nacionales,
   *   percepciones_iibb, percepciones_municipales, imp_internos, moneda, tipo_cambio,
   *   cant_alicuotas, cod_operacion, otros_tributos, fecha_vto_pago
   */
  async generarLibroIVADigitalVentas(mes: number, anio: number, empresaId?: number): Promise<string> {
    const libro = await this.generarLibroIVAVentas(mes, anio, empresaId)
    const lines: string[] = []

    for (const reg of libro) {
      const fecha = this.formatFechaAFIP(reg.fecha)
      const tipoCbte = this.padNum(this.tipoFacturaToCode(reg.tipo), 3)
      const ptoVenta = this.padNum(reg.puntoVenta, 5)
      const nroDesde = this.padNum(reg.numero, 20)
      const nroHasta = this.padNum(reg.numero, 20)
      const codDoc = reg.cliente.cuit ? "80" : "99"
      const nroDoc = (reg.cliente.cuit || "0").replace(/-/g, "").padStart(20, "0")
      const nombre = (reg.cliente.nombre || "").substring(0, 30).padEnd(30, " ")
      const impTotal = this.formatMontoAFIP(reg.total)
      const impConc = this.formatMontoAFIP(0)
      const impNetoNG = this.formatMontoAFIP(reg.netoNoGravado)
      const impOpEx = this.formatMontoAFIP(reg.netoExento)
      const percIVA = this.formatMontoAFIP(0)
      const percNac = this.formatMontoAFIP(0)
      const percIIBB = this.formatMontoAFIP(reg.percepciones)
      const percMun = this.formatMontoAFIP(0)
      const impInt = this.formatMontoAFIP(0)
      const moneda = "PES"
      const tipoCambio = "0001000000"
      const cantAlic = this.padNum(this.contarAlicuotas(reg), 1)
      const codOp = " "
      const otrosTrib = this.formatMontoAFIP(
        reg.tributos?.reduce((s: number, t: any) => s + (t.importe ?? 0), 0) ?? 0
      )
      const fchVto = "00000000"

      lines.push(
        `${fecha}${tipoCbte}${ptoVenta}${nroDesde}${nroHasta}` +
        `${codDoc}${nroDoc}${nombre}${impTotal}${impConc}${impNetoNG}${impOpEx}` +
        `${percIVA}${percNac}${percIIBB}${percMun}${impInt}` +
        `${moneda}${tipoCambio}${cantAlic}${codOp}${otrosTrib}${fchVto}`
      )
    }

    return lines.join("\r\n")
  }

  /**
   * Libro IVA Digital - Alicuotas Ventas (RG 4597/2019)
   * One line per IVA rate per comprobante.
   */
  async generarLibroIVADigitalAlicuotasVentas(mes: number, anio: number, empresaId?: number): Promise<string> {
    const libro = await this.generarLibroIVAVentas(mes, anio, empresaId)
    const lines: string[] = []

    const ALICUOTAS_AFIP: Record<number, { id: string; rate: number }> = {
      0: { id: "03", rate: 0 },
      2.5: { id: "09", rate: 2.5 },
      5: { id: "08", rate: 5 },
      10.5: { id: "04", rate: 10.5 },
      21: { id: "05", rate: 21 },
      27: { id: "06", rate: 27 },
    }

    for (const reg of libro) {
      const tipoCbte = this.padNum(this.tipoFacturaToCode(reg.tipo), 3)
      const ptoVenta = this.padNum(reg.puntoVenta, 5)
      const nroCbte = this.padNum(reg.numero, 20)

      const ivaByRate = this.agruparIVAPorAlicuota(reg)
      for (const [rate, { base, importe }] of Object.entries(ivaByRate)) {
        const alic = ALICUOTAS_AFIP[Number(rate)]
        if (!alic) continue
        lines.push(
          `${tipoCbte}${ptoVenta}${nroCbte}` +
          `${this.formatMontoAFIP(base)}${alic.id}${this.formatMontoAFIP(importe)}`
        )
      }
    }

    return lines.join("\r\n")
  }

  /**
   * Libro IVA Digital - Compras (RG 4597/2019)
   */
  async generarLibroIVADigitalCompras(mes: number, anio: number, empresaId?: number): Promise<string> {
    const libro = await this.generarLibroIVACompras(mes, anio, empresaId)
    const lines: string[] = []

    for (const reg of libro) {
      const fecha = this.formatFechaAFIP(reg.fecha)
      const tipoCbte = this.padNum(this.tipoFacturaToCode(reg.tipo), 3)
      const ptoVenta = this.padNum(reg.puntoVenta, 5)
      const nroDesde = this.padNum(reg.numero, 20)
      const despacho = "".padEnd(16, " ")
      const codDoc = "80"
      const nroDoc = (reg.proveedor.cuit || "0").replace(/-/g, "").padStart(20, "0")
      const nombre = (reg.proveedor.nombre || "").substring(0, 30).padEnd(30, " ")
      const impTotal = this.formatMontoAFIP(reg.total)
      const impConc = this.formatMontoAFIP(0)
      const impNetoNG = this.formatMontoAFIP(reg.netoNoGravado)
      const impOpEx = this.formatMontoAFIP(reg.netoExento)
      const impIVA = this.formatMontoAFIP(reg.iva)
      const impNeto = this.formatMontoAFIP(reg.neto)
      const percIVA = this.formatMontoAFIP(0)
      const percIIBB = this.formatMontoAFIP(reg.retenciones)
      const percMun = this.formatMontoAFIP(0)
      const impInt = this.formatMontoAFIP(0)
      const moneda = "PES"
      const tipoCambio = "0001000000"
      const cantAlic = this.padNum(1, 1)
      const codOp = " "
      const cfComputable = this.formatMontoAFIP(reg.iva)
      const otrosTrib = this.formatMontoAFIP(
        reg.tributos?.reduce((s: number, t: any) => s + (t.importe ?? 0), 0) ?? 0
      )
      const cuitEmisor = "00000000000"
      const denEmisor = "".padEnd(30, " ")
      const ivaComision = this.formatMontoAFIP(0)

      lines.push(
        `${fecha}${tipoCbte}${ptoVenta}${nroDesde}${despacho}` +
        `${codDoc}${nroDoc}${nombre}${impTotal}${impConc}${impNetoNG}${impOpEx}` +
        `${impIVA}${impNeto}${percIVA}${percIIBB}${percMun}${impInt}` +
        `${moneda}${tipoCambio}${cantAlic}${codOp}${cfComputable}${otrosTrib}` +
        `${cuitEmisor}${denEmisor}${ivaComision}`
      )
    }

    return lines.join("\r\n")
  }

  // ─── Helpers for RG 4597 format ────────────────────────────────────

  private formatFechaAFIP(fecha: Date): string {
    const d = new Date(fecha)
    const yyyy = d.getFullYear().toString()
    const mm = (d.getMonth() + 1).toString().padStart(2, "0")
    const dd = d.getDate().toString().padStart(2, "0")
    return `${yyyy}${mm}${dd}`
  }

  private padNum(n: number | string, len: number): string {
    return String(n).padStart(len, "0")
  }

  private formatMontoAFIP(monto: number): string {
    // AFIP format: 15 positions, 2 decimal places, no separator, right-aligned with zeros
    const cents = Math.round(Math.abs(monto) * 100)
    return cents.toString().padStart(15, "0")
  }

  private tipoFacturaToCode(tipo: string): number {
    const map: Record<string, number> = {
      A: 1, B: 6, C: 11, E: 19, M: 51,
      "NC A": 3, "NC B": 8, "NC C": 13,
      "ND A": 2, "ND B": 7, "ND C": 12,
    }
    return map[tipo] ?? 0
  }

  private contarAlicuotas(reg: any): number {
    const rates = new Set<number>()
    if (reg.neto > 0) rates.add(21)
    if (reg.netoExento > 0) rates.add(0)
    return Math.max(rates.size, 1)
  }

  private agruparIVAPorAlicuota(reg: any): Record<number, { base: number; importe: number }> {
    const result: Record<number, { base: number; importe: number }> = {}
    // From tributos data if available, otherwise infer from totals
    const neto = reg.neto - (reg.netoExento ?? 0) - (reg.netoNoGravado ?? 0)
    if (neto > 0) {
      result[21] = { base: neto, importe: reg.iva ?? 0 }
    }
    return result
  }
}
