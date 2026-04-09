import { prisma } from "@/lib/prisma"
import type { ReporteIVA } from "@/lib/types"

export class IVAService {
  async calcularIVAPeriodo(mes: number, anio: number): Promise<ReporteIVA> {
    // Calcular fechas del período
    const fechaDesde = new Date(anio, mes - 1, 1)
    const fechaHasta = new Date(anio, mes, 0, 23, 59, 59)

    // Obtener todas las facturas de venta del período
    const facturas = await prisma.factura.findMany({
      where: {
        createdAt: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
        estado: "emitida",
      },
      include: {
        lineas: true,
      },
    })

    // Obtener todas las compras del período
    const compras = await prisma.compra.findMany({
      where: {
        fecha: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
      },
      include: {
        lineas: true,
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
    let totalPercepciones = 0

    facturas.forEach((factura) => {
      total += factura.iva
      base += factura.subtotal
      totalPercepciones += factura.totalPercepciones ?? 0

      factura.lineas.forEach((linea: any) => {
        if (linea.porcentajeIva === 21) {
          iva21 += linea.iva
        } else if (linea.porcentajeIva === 10.5) {
          iva105 += linea.iva
        } else if (linea.porcentajeIva === 27) {
          iva27 += linea.iva
        }
      })
    })

    return {
      total: Math.round(total * 100) / 100,
      base: Math.round(base * 100) / 100,
      iva21: Math.round(iva21 * 100) / 100,
      iva105: Math.round(iva105 * 100) / 100,
      iva27: Math.round(iva27 * 100) / 100,
      totalPercepciones: Math.round(totalPercepciones * 100) / 100,
    }
  }

  private calcularIVACompras(compras: any[]) {
    let total = 0
    let base = 0
    let iva21 = 0
    let iva105 = 0
    let iva27 = 0
    let totalRetenciones = 0

    compras.forEach((compra) => {
      total += compra.iva
      base += compra.subtotal
      totalRetenciones += compra.totalRetenciones ?? 0

      compra.lineas.forEach((linea: any) => {
        if (linea.porcentajeIva === 21) {
          iva21 += linea.iva
        } else if (linea.porcentajeIva === 10.5) {
          iva105 += linea.iva
        } else if (linea.porcentajeIva === 27) {
          iva27 += linea.iva
        }
      })
    })

    return {
      total: Math.round(total * 100) / 100,
      base: Math.round(base * 100) / 100,
      iva21: Math.round(iva21 * 100) / 100,
      iva105: Math.round(iva105 * 100) / 100,
      iva27: Math.round(iva27 * 100) / 100,
      totalRetenciones: Math.round(totalRetenciones * 100) / 100,
    }
  }

  async generarLibroIVAVentas(mes: number, anio: number) {
    const fechaDesde = new Date(anio, mes - 1, 1)
    const fechaHasta = new Date(anio, mes, 0, 23, 59, 59)

    const facturas = await prisma.factura.findMany({
      where: {
        createdAt: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
        estado: "emitida",
      },
      include: {
        cliente: true,
        lineas: true,
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
      iva: factura.iva,
      percepciones: factura.totalPercepciones ?? 0,
      total: factura.total + (factura.totalPercepciones ?? 0),
      cae: factura.cae,
    }))
  }

  async generarLibroIVACompras(mes: number, anio: number) {
    const fechaDesde = new Date(anio, mes - 1, 1)
    const fechaHasta = new Date(anio, mes, 0, 23, 59, 59)

    const compras = await prisma.compra.findMany({
      where: {
        fecha: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
      },
      include: {
        proveedor: true,
        lineas: true,
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
      iva: compra.iva,
      retenciones: compra.totalRetenciones ?? 0,
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

    // Formato simplificado para presentación AFIP
    // En producción, esto debería seguir el formato oficial de AFIP
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

    archivo += "Este archivo es un resumen. Para la presentación oficial ante AFIP,\n"
    archivo += "utilice el aplicativo SIAP o el servicio web correspondiente.\n"

    return archivo
  }
}
