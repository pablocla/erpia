import type { TicketData, PrinterResponse, PrinterConfig } from "./printer-interface"

export class HasarPrinter {
  private config: PrinterConfig

  constructor(config: PrinterConfig) {
    this.config = config
  }

  async imprimirTicket(data: TicketData): Promise<PrinterResponse> {
    try {
      // Comandos ESC/POS para impresoras Hasar
      const comandos = this.generarComandosHasar(data)

      // En producción, aquí se enviarían los comandos a la impresora
      // usando USB o conexión de red
      await this.enviarComandos(comandos)

      return {
        success: true,
        mensaje: "Ticket impreso correctamente",
      }
    } catch (error) {
      console.error("Error al imprimir en Hasar:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  }

  private generarComandosHasar(data: TicketData): string[] {
    const comandos: string[] = []

    // Inicializar impresora
    comandos.push("\x1B\x40") // ESC @ - Inicializar

    // Encabezado - Datos de la empresa
    comandos.push("\x1B\x61\x01") // ESC a 1 - Centrar
    comandos.push("\x1B\x21\x30") // ESC ! 48 - Doble altura y ancho
    comandos.push(`${data.empresa.nombre}\n`)
    comandos.push("\x1B\x21\x00") // ESC ! 0 - Normal

    comandos.push(`${data.empresa.razonSocial}\n`)
    comandos.push(`CUIT: ${this.formatearCUIT(data.empresa.cuit)}\n`)
    comandos.push(`${data.empresa.direccion}\n`)
    comandos.push(`Punto de Venta: ${data.empresa.puntoVenta.toString().padStart(4, "0")}\n`)

    // Línea separadora
    comandos.push("\x1B\x61\x00") // ESC a 0 - Alinear izquierda
    comandos.push("----------------------------------------\n")

    // Datos de la factura
    comandos.push("\x1B\x21\x08") // ESC ! 8 - Negrita
    comandos.push(`FACTURA ${data.factura.tipo}\n`)
    comandos.push("\x1B\x21\x00") // ESC ! 0 - Normal
    comandos.push(`Nro: ${data.factura.numero.toString().padStart(8, "0")}\n`)
    comandos.push(`Fecha: ${this.formatearFecha(data.factura.fecha)}\n`)

    // Datos del cliente
    comandos.push("----------------------------------------\n")
    comandos.push(`Cliente: ${data.cliente.nombre}\n`)
    if (data.cliente.cuit) {
      comandos.push(`CUIT: ${this.formatearCUIT(data.cliente.cuit)}\n`)
    } else if (data.cliente.dni) {
      comandos.push(`DNI: ${data.cliente.dni}\n`)
    }
    comandos.push(`Condición IVA: ${data.cliente.condicionIva}\n`)

    // Items
    comandos.push("----------------------------------------\n")
    comandos.push("Cant  Descripción           P.Unit  Total\n")
    comandos.push("----------------------------------------\n")

    data.items.forEach((item) => {
      const cant = item.cantidad.toString().padEnd(5)
      const desc = item.descripcion.substring(0, 20).padEnd(20)
      const precio = this.formatearMoneda(item.precioUnitario).padStart(7)
      const total = this.formatearMoneda(item.total).padStart(7)

      comandos.push(`${cant} ${desc} ${precio} ${total}\n`)

      if (item.iva > 0) {
        comandos.push(`      IVA ${item.iva}%\n`)
      }
    })

    // Totales
    comandos.push("----------------------------------------\n")
    comandos.push(`Subtotal:              ${this.formatearMoneda(data.totales.subtotal).padStart(12)}\n`)
    comandos.push(`IVA:                   ${this.formatearMoneda(data.totales.iva).padStart(12)}\n`)

    comandos.push("\x1B\x21\x30") // ESC ! 48 - Doble altura y ancho
    comandos.push(`TOTAL:                 ${this.formatearMoneda(data.totales.total).padStart(12)}\n`)
    comandos.push("\x1B\x21\x00") // ESC ! 0 - Normal

    // Datos AFIP
    comandos.push("----------------------------------------\n")
    comandos.push("\x1B\x61\x01") // ESC a 1 - Centrar
    comandos.push("COMPROBANTE AUTORIZADO\n")
    comandos.push(`CAE: ${data.factura.cae}\n`)
    comandos.push(`Vto. CAE: ${this.formatearFecha(data.factura.vencimientoCAE)}\n`)

    // QR Code (si está disponible)
    if (data.qrBase64) {
      comandos.push("\n")
      comandos.push("Escanee el código QR para verificar\n")
      // En producción, aquí se imprimiría el QR usando comandos específicos
      comandos.push("[QR CODE]\n")
    }

    // Pie de página
    comandos.push("\n")
    comandos.push("Gracias por su compra\n")
    comandos.push("\n\n\n")

    // Cortar papel
    comandos.push("\x1D\x56\x41\x00") // GS V A 0 - Corte total

    return comandos
  }

  private async enviarComandos(comandos: string[]): Promise<void> {
    // En producción, aquí se implementaría la comunicación real con la impresora
    // Usando USB (node-usb) o red (net/socket)

    if (this.config.conexion === "red" && this.config.ip) {
      // Ejemplo de conexión por red
      // const net = require('net');
      // const client = new net.Socket();
      // client.connect(this.config.puerto || 9100, this.config.ip, () => {
      //   comandos.forEach(cmd => client.write(cmd));
      //   client.end();
      // });
      // TODO: implementar conexión TCP real
      // net.Socket → connect(this.config.puerto, this.config.ip)
    } else {
      // Conexión USB
      // TODO: implementar conexión USB real
    }

    // Simulación de impresión
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  private formatearCUIT(cuit: string): string {
    // Formato: XX-XXXXXXXX-X
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
