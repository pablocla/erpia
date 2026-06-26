import type { PrinterResponse, PrinterConfig } from "./printer-interface"
import type { TicketLegalData } from "@/lib/fiscal/ticket-legal"
import { buildEscPosTicketBody } from "@/lib/printer/ticket-builder"
import { enviarPorTcp, enviarPorUsb } from "./printer-transport"

export class EpsonPrinter {
  private config: PrinterConfig

  constructor(config: PrinterConfig) {
    this.config = config
  }

  async imprimirTicket(
    data: TicketLegalData,
    opts?: { incluirQr?: boolean },
  ): Promise<PrinterResponse> {
    try {
      const chunks = buildEscPosTicketBody(data, opts)
      const payload = Buffer.concat(chunks)
      await this.enviarPayload(payload)
      return { success: true, mensaje: "Ticket impreso correctamente" }
    } catch (error) {
      console.error("Error al imprimir en Epson:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  }

  private async enviarPayload(payload: Buffer): Promise<void> {
    if (this.config.conexion === "red") {
      if (!this.config.ip) throw new Error("IP de impresora no configurada")
      await enviarPorTcp(this.config.ip, payload, this.config.puerto ?? 9100)
      return
    }
    await enviarPorUsb(this.config.modelo || "epson-usb", payload)
  }
}