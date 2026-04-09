import { prisma } from "@/lib/prisma"
import { HasarPrinter } from "./hasar-printer"
import { EpsonPrinter } from "./epson-printer"
import type { TicketData, PrinterResponse, PrinterConfig } from "./printer-interface"

export class PrinterService {
  async imprimirFactura(facturaId: number): Promise<PrinterResponse> {
    try {
      // Obtener la factura completa
      const factura = await prisma.factura.findUnique({
        where: { id: facturaId },
        include: {
          empresa: true,
          cliente: true,
          lineas: true,
        },
      })

      if (!factura) {
        return { success: false, error: "Factura no encontrada" }
      }

      // Obtener la impresora activa
      const impresora = await prisma.configuracionImpresora.findFirst({
        where: { activa: true },
      })

      if (!impresora) {
        return { success: false, error: "No hay impresora configurada" }
      }

      // Preparar los datos del ticket
      const ticketData: TicketData = {
        empresa: {
          nombre: factura.empresa.nombre,
          razonSocial: factura.empresa.razonSocial,
          cuit: factura.empresa.cuit,
          direccion: factura.empresa.direccion || "",
          puntoVenta: factura.puntoVenta,
        },
        factura: {
          tipo: factura.tipo,
          numero: factura.numero,
          fecha: factura.createdAt,
          cae: factura.cae || "",
          vencimientoCAE: factura.vencimientoCAE || new Date(),
        },
        cliente: {
          nombre: factura.cliente.nombre,
          cuit: factura.cliente.cuit || undefined,
          dni: factura.cliente.dni || undefined,
          condicionIva: factura.cliente.condicionIva,
        },
        items: factura.lineas.map((linea) => ({
          descripcion: linea.descripcion,
          cantidad: linea.cantidad,
          precioUnitario: linea.precioUnitario,
          iva: linea.porcentajeIva,
          total: linea.total,
        })),
        totales: {
          subtotal: factura.subtotal,
          iva: factura.iva,
          total: factura.total,
        },
        qrBase64: factura.qrBase64 || undefined,
      }

      // Seleccionar el driver de impresora correcto
      const printerConfig: PrinterConfig = {
        id: impresora.id,
        nombre: impresora.nombre,
        tipo: impresora.tipo as "fiscal" | "ticket" | "a4",
        marca: impresora.marca as "hasar" | "epson",
        modelo: impresora.modelo,
        conexion: impresora.conexion as "usb" | "red",
        ip: impresora.ip || undefined,
        puerto: impresora.puerto || undefined,
        activa: impresora.activa,
      }

      let resultado: PrinterResponse

      if (printerConfig.marca === "hasar") {
        const printer = new HasarPrinter(printerConfig)
        resultado = await printer.imprimirTicket(ticketData)
      } else if (printerConfig.marca === "epson") {
        const printer = new EpsonPrinter(printerConfig)
        resultado = await printer.imprimirTicket(ticketData)
      } else {
        return { success: false, error: "Marca de impresora no soportada" }
      }

      return resultado
    } catch (error) {
      console.error("Error en PrinterService:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  }

  async detectarImpresoras(): Promise<PrinterConfig[]> {
    // En producción, aquí se detectarían las impresoras conectadas
    // usando librerías como node-usb o escaneando la red

    const impresorasDetectadas: PrinterConfig[] = [
      {
        id: 0,
        nombre: "Hasar SMH/P-441",
        tipo: "fiscal",
        marca: "hasar",
        modelo: "SMH/P-441",
        conexion: "usb",
        activa: false,
      },
      {
        id: 0,
        nombre: "Epson TM-T20",
        tipo: "ticket",
        marca: "epson",
        modelo: "TM-T20",
        conexion: "red",
        ip: "192.168.1.100",
        puerto: 9100,
        activa: false,
      },
    ]

    return impresorasDetectadas
  }
}
