import { prisma } from "@/lib/prisma"

export interface HabitacionInfo {
  id: number
  numero: string
  tipo: string
  estado: string
  tarifaBase: number
  piso?: string | null
}

export async function listarHabitaciones(empresaId: number): Promise<HabitacionInfo[]> {
  const habitaciones = await prisma.habitacion.findMany({
    where: { empresaId },
    orderBy: { numero: "asc" }
  })
  return habitaciones.map(h => ({
    id: h.id,
    numero: h.numero,
    tipo: h.tipo,
    estado: h.estado,
    tarifaBase: Number(h.tarifaBase),
    piso: h.piso
  }))
}

export async function crearReserva(
  empresaId: number,
  params: { clienteId: number; habitacionId: number; checkIn: Date; checkOut: Date; origen: string }
) {
  const habitacion = await prisma.habitacion.findUnique({
    where: { id: params.habitacionId, empresaId }
  })
  
  if (!habitacion) {
    throw new Error("Habitación no encontrada")
  }

  // Verificar superposición de fechas (Overbooking protection)
  const superposicion = await prisma.reservaHotel.findFirst({
    where: {
      empresaId,
      habitacionId: params.habitacionId,
      estado: { in: ["Confirmada", "CheckIn"] },
      OR: [
        { checkIn: { lt: params.checkOut }, checkOut: { gt: params.checkIn } }
      ]
    }
  })

  if (superposicion) {
    throw new Error("La habitación no está disponible para las fechas seleccionadas.")
  }

  // Calcular precio simplificado (tarifaBase * cantNoches)
  const noches = Math.ceil((params.checkOut.getTime() - params.checkIn.getTime()) / (1000 * 60 * 60 * 24))
  const precioTotal = Number(habitacion.tarifaBase) * Math.max(1, noches)

  return await prisma.reservaHotel.create({
    data: {
      empresaId,
      clienteId: params.clienteId,
      habitacionId: params.habitacionId,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      estado: "Confirmada",
      origen: params.origen,
      precioTotal,
      saldoPendiente: precioTotal
    }
  })
}

export async function realizarCheckIn(empresaId: number, reservaId: number) {
  return await prisma.$transaction(async (tx) => {
    const reserva = await tx.reservaHotel.findUnique({
      where: { id: reservaId, empresaId }
    })

    if (!reserva || reserva.estado !== "Confirmada") {
      throw new Error("Reserva no válida para CheckIn")
    }

    await tx.habitacion.update({
      where: { id: reserva.habitacionId },
      data: { estado: "Ocupada" }
    })

    return await tx.reservaHotel.update({
      where: { id: reservaId },
      data: { estado: "CheckIn" }
    })
  })
}

export async function realizarCheckOut(empresaId: number, reservaId: number) {
  return await prisma.$transaction(async (tx) => {
    const reserva = await tx.reservaHotel.findUnique({
      where: { id: reservaId, empresaId }
    })

    if (!reserva || reserva.estado !== "CheckIn") {
      throw new Error("Reserva no válida para CheckOut")
    }

    await tx.habitacion.update({
      where: { id: reserva.habitacionId },
      data: { estado: "Limpieza" }
    })

    return await tx.reservaHotel.update({
      where: { id: reservaId },
      data: { estado: "CheckOut" }
    })
  })
}
