import { prisma } from "@/lib/prisma"
import { HasarPrinter } from "./hasar-printer"
import { EpsonPrinter } from "./epson-printer"
import type { PrinterResponse, PrinterConfig } from "./printer-interface"
import { buildTicketLegalFromFactura } from "@/lib/fiscal/ticket-legal"
import { getFiscalEmissionConfig } from "@/lib/fiscal/emission-config"
import { buildEscPosEtiqueta, type EtiquetaProductoData } from "@/lib/printer/label-builder"
import { enviarPorTcp, enviarPorUsb } from "@/lib/printer/printer-transport"

export class PrinterService {
  private async resolvePrinterConfig(empresaId: number): Promise<PrinterConfig | null> {
    const impresora = await prisma.configuracionImpresora.findFirst({
      where: { empresaId, activa: true },
    })
    if (!impresora) return null
    return {
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
  }

  private async enviarRaw(config: PrinterConfig, payload: Buffer): Promise<void> {
    if (config.conexion === "red") {
      if (!config.ip) throw new Error("IP de impresora no configurada")
      await enviarPorTcp(config.ip, payload, config.puerto ?? 9100)
      return
    }
    await enviarPorUsb(config.modelo || `${config.marca}-usb`, payload)
  }

  async imprimirFactura(facturaId: number, empresaId?: number): Promise<PrinterResponse> {
    try {
      const factura = await prisma.factura.findUnique({
        where: { id: facturaId },
        select: { empresaId: true },
      })

      if (!factura) {
        return { success: false, error: "Factura no encontrada" }
      }

      const eid = empresaId ?? factura.empresaId
      if (empresaId && factura.empresaId !== empresaId) {
        return { success: false, error: "Factura no pertenece a la empresa" }
      }

      const ticketData = await buildTicketLegalFromFactura(facturaId)
      if (!ticketData) {
        return { success: false, error: "No se pudieron cargar los datos del comprobante" }
      }

      const impresora = await prisma.configuracionImpresora.findFirst({
        where: { empresaId: eid, activa: true },
      })

      if (!impresora) {
        return { success: false, error: "No hay impresora configurada para esta empresa" }
      }

      const emissionConfig = await getFiscalEmissionConfig(eid)

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

      const printOpts = { incluirQr: emissionConfig.incluirQrTicket }

      if (printerConfig.marca === "hasar") {
        return new HasarPrinter(printerConfig).imprimirTicket(ticketData, printOpts)
      }
      if (printerConfig.marca === "epson") {
        return new EpsonPrinter(printerConfig).imprimirTicket(ticketData, printOpts)
      }

      return { success: false, error: "Marca de impresora no soportada" }
    } catch (error) {
      console.error("Error en PrinterService:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }
    }
  }

  /**
   * Etiqueta de góndola / precio (ESC/POS Hasar o Epson).
   */
  async imprimirEtiqueta(
    empresaId: number,
    data: EtiquetaProductoData,
  ): Promise<PrinterResponse> {
    try {
      const printerConfig = await this.resolvePrinterConfig(empresaId)
      if (!printerConfig) {
        return { success: false, error: "No hay impresora configurada (Hasar/Epson)" }
      }

      const emissionConfig = await getFiscalEmissionConfig(empresaId)
      const payload = buildEscPosEtiqueta(
        {
          ...data,
          empresaNombre: data.empresaNombre,
        },
        { anchoMm: emissionConfig.etiquetaAnchoMm },
      )

      await this.enviarRaw(printerConfig, payload)
      return {
        success: true,
        mensaje: `Etiqueta enviada a ${printerConfig.marca} ${printerConfig.modelo}`,
      }
    } catch (error) {
      console.error("Error imprimir etiqueta:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al imprimir etiqueta",
      }
    }
  }

  async listarImpresorasEmpresa(empresaId: number) {
    return prisma.configuracionImpresora.findMany({
      where: { empresaId },
      orderBy: [{ activa: "desc" }, { nombre: "asc" }],
    })
  }

  async detectarImpresoras(): Promise<PrinterConfig[]> {
    return [
      {
        id: 0,
        nombre: "Hasar SMH/P-441 (térmica ESC/POS)",
        tipo: "ticket",
        marca: "hasar",
        modelo: "SMH/P-441",
        conexion: "usb",
        activa: false,
      },
      {
        id: 0,
        nombre: "Hasar red :9100",
        tipo: "ticket",
        marca: "hasar",
        modelo: "Hasar-TCP",
        conexion: "red",
        ip: "192.168.1.50",
        puerto: 9100,
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
      {
        id: 0,
        nombre: "Epson TM-T88 (red)",
        tipo: "ticket",
        marca: "epson",
        modelo: "TM-T88",
        conexion: "red",
        ip: "192.168.1.101",
        puerto: 9100,
        activa: false,
      },
    ]
  }
}