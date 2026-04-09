import type { TicketData, PrinterResponse, PrinterConfig } from "./printer-interface"

export class EpsonPrinter {
  private config: PrinterConfig

  constructor(config: PrinterConfig) {
    this.config = config
  }

  async imprimirTicket(data: TicketData): Promise<PrinterResponse> {
    try {
      // Comandos ESC/POS para impresoras Epson
      const comandos = this.generarComandosEpson(data)

      await this.enviarComandos(comandos)

      return {
        success: true,
        mensaje: "Ticket impreso correctamente",
      }
    } catch (error) {
      console.error("Error al imprimir en Epson:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  }

  private generarComandosEpson(data: TicketData): Buffer[] {
    const comandos: Buffer[] = []

    // Inicializar impresora
    comandos.push(Buffer.from([0x1b, 0x40])) // ESC @ - Inicializar

    // Encabezado
    comandos.push(Buffer.from([0x1b, 0x61, 0x01])) // Centrar
    comandos.push(Buffer.from([0x1b, 0x21, 0x30])) // Doble tamaño
    comandos.push(Buffer.from(`${data.empresa.nombre}\n`))
    comandos.push(Buffer.from([0x1b, 0x21, 0x00])) // Tamaño normal

    comandos.push(Buffer.from(`${data.empresa.razonSocial}\n`))
    comandos.push(Buffer.from(`CUIT: ${this.formatearCUIT(data.empresa.cuit)}\n`))
    comandos.push(Buffer.from(`${data.empresa.direccion}\n`))

    // Línea separadora
    comandos.push(Buffer.from([0x1b, 0x61, 0x00])) // Alinear izquierda
    comandos.push(Buffer.from("----------------------------------------\n"))

    // Factura
    comandos.push(Buffer.from([0x1b, 0x21, 0x08])) // Negrita
    comandos.push(Buffer.from(`FACTURA ${data.factura.tipo}\n`))
    comandos.push(Buffer.from([0x1b, 0x21, 0x00]))
    comandos.push(Buffer.from(`Nro: ${data.factura.numero.toString().padStart(8, "0")}\n`))
    comandos.push(Buffer.from(`Fecha: ${this.formatearFecha(data.factura.fecha)}\n`))

    // Cliente
    comandos.push(Buffer.from("----------------------------------------\n"))
    comandos.push(Buffer.from(`Cliente: ${data.cliente.nombre}\n`))
    if (data.cliente.cuit) {
      comandos.push(Buffer.from(`CUIT: ${this.formatearCUIT(data.cliente.cuit)}\n`))
    }

    // Items
    comandos.push(Buffer.from("----------------------------------------\n"))
    comandos.push(Buffer.from("Descripción              Cant    Total\n"))
    comandos.push(Buffer.from("----------------------------------------\n"))

    data.items.forEach((item) => {
      const desc = item.descripcion.substring(0, 24).padEnd(24)
      const cant = item.cantidad.toString().padStart(4)
      const total = this.formatearMoneda(item.total).padStart(8)
      comandos.push(Buffer.from(`${desc} ${cant} ${total}\n`))
    })

    // Totales
    comandos.push(Buffer.from("----------------------------------------\n"))
    comandos.push(Buffer.from(`Subtotal:              ${this.formatearMoneda(data.totales.subtotal).padStart(12)}\n`))
    comandos.push(Buffer.from(`IVA:                   ${this.formatearMoneda(data.totales.iva).padStart(12)}\n`))
    comandos.push(Buffer.from([0x1b, 0x21, 0x30])) // Doble tamaño
    comandos.push(Buffer.from(`TOTAL:                 ${this.formatearMoneda(data.totales.total).padStart(12)}\n`))
    comandos.push(Buffer.from([0x1b, 0x21, 0x00]))

    // CAE
    comandos.push(Buffer.from("----------------------------------------\n"))
    comandos.push(Buffer.from([0x1b, 0x61, 0x01])) // Centrar
    comandos.push(Buffer.from("COMPROBANTE AUTORIZADO\n"))
    comandos.push(Buffer.from(`CAE: ${data.factura.cae}\n`))
    comandos.push(Buffer.from(`Vto: ${this.formatearFecha(data.factura.vencimientoCAE)}\n`))

    // Espaciado y corte
    comandos.push(Buffer.from("\n\n\n"))
    comandos.push(Buffer.from([0x1d, 0x56, 0x41, 0x00])) // Cortar papel

    return comandos
  }

  private async enviarComandos(comandos: Buffer[]): Promise<void> {
    // Simulación de envío a impresora
    // TODO: implementar envío real a impresora Epson
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  private formatearCUIT(cuit: string): string {
    return `${cuit.substring(0, 2)}-${cuit.substring(2, 10)}-${cuit.substring(10)}`
  }

  private formatearFecha(fecha: Date): string {
    const dia = fecha.getDate().toString().padStart(2, "0")
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0")
    const anio = fecha.getFullYear()
    return `${dia}/${mes}/${anio}`
  }

  private formatearMoneda(valor: number): string {
    return `$${valor.toFixed(2)}`
  }
}
