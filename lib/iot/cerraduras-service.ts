import { prisma } from "@/lib/prisma"
import { addDays } from "date-fns"

export interface CerraduraServiceOptions {
  proveedor: "TTLock" | "Tuya" | "Mock"
}

export class CerraduraIoTService {
  private proveedor: string

  constructor(options: CerraduraServiceOptions = { proveedor: "Mock" }) {
    this.proveedor = options.proveedor
  }

  /**
   * Genera un código PIN temporal en el proveedor IoT y lo registra en la base de datos local.
   */
  async generarLlaveTemporal(empresaId: number, reservaId: number, cerraduraId: number) {
    const reserva = await prisma.reservaHotel.findUnique({
      where: { id: reservaId, empresaId },
    })

    if (!reserva) throw new Error("Reserva no encontrada")

    // Llamada al proveedor IoT para generar el PIN
    let pinCode = "123456" // Mock fallback
    
    if (this.proveedor === "TTLock") {
      // Integración simulada con TTLock API
      pinCode = Math.floor(100000 + Math.random() * 900000).toString()
      console.log(`[TTLock] Generando PIN temporal para cerradura ${cerraduraId}: ${pinCode}`)
    }

    const llave = await prisma.llaveDigital.create({
      data: {
        empresaId,
        reservaId,
        cerraduraId,
        pinCode,
        validaDesde: reserva.checkIn,
        validaHasta: reserva.checkOut,
        estado: "Activa",
      },
    })

    return llave
  }

  /**
   * Revoca inmediatamente una llave digital en caso de Check-out anticipado.
   */
  async revocarLlave(empresaId: number, llaveId: number) {
    const llave = await prisma.llaveDigital.findUnique({
      where: { id: llaveId, empresaId },
    })

    if (!llave) throw new Error("Llave no encontrada")

    if (this.proveedor === "TTLock") {
      // API call a TTLock para borrar el PIN
      console.log(`[TTLock] Revocando PIN ${llave.pinCode} de cerradura ${llave.cerraduraId}`)
    }

    return await prisma.llaveDigital.update({
      where: { id: llaveId },
      data: { estado: "Revocada" },
    })
  }
}
