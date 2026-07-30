import { prisma } from "@/lib/prisma"
import { isBefore } from "date-fns"

export interface TTLockKeyResult {
  ok: boolean
  pinCode?: string
  error?: string
}

/**
 * Servicio de integración con cerraduras inteligentes (ej. TTLock / AssaAbloy).
 * Se comunica con la API del proveedor IoT para gestionar llaves y permisos.
 */
export async function emitirLlaveVirtual(
  empresaId: number, 
  reservaId: number,
  habitacionId: number
): Promise<TTLockKeyResult> {
  const cerradura = await prisma.cerraduraIoT.findFirst({
    where: { empresaId, habitacionId, online: true }
  })

  if (!cerradura) {
    return { ok: false, error: "La habitación no tiene una cerradura inteligente configurada u offline." }
  }

  const reserva = await prisma.reservaHotel.findUnique({
    where: { id: reservaId, empresaId }
  })

  if (!reserva) {
    return { ok: false, error: "Reserva no encontrada." }
  }

  if (isBefore(reserva.checkOut, new Date())) {
    return { ok: false, error: "No se puede emitir llave para una reserva vencida." }
  }

  // TODO: Acá iría el fetch real a api.ttlock.com
  // Simulamos un PIN aleatorio de 6 dígitos que solo funciona en el rango de fechas de la reserva.
  const pinCode = Math.floor(100000 + Math.random() * 900000).toString()

  // Guardamos la llave digital en el ERP
  await prisma.llaveDigital.create({
    data: {
      empresaId,
      reservaId: reserva.id,
      cerraduraId: cerradura.id,
      pinCode,
      validaDesde: reserva.checkIn,
      validaHasta: reserva.checkOut,
      estado: "Activa"
    }
  })

  return { ok: true, pinCode }
}

export async function revocarLlaveVirtual(empresaId: number, llaveId: number) {
  const llave = await prisma.llaveDigital.findUnique({
    where: { id: llaveId, empresaId },
    include: { cerradura: true }
  })

  if (!llave || llave.estado === "Revocada") {
    return { ok: false, error: "Llave no encontrada o ya revocada." }
  }

  // TODO: Acá iría el fetch a api.ttlock.com para borrar el PIN de la cerradura física
  
  await prisma.llaveDigital.update({
    where: { id: llaveId },
    data: { estado: "Revocada" }
  })

  return { ok: true }
}
