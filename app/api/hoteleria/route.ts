import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { listarHabitaciones, crearReserva, realizarCheckIn, realizarCheckOut } from "@/lib/hoteleria/reservas-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    // Para simplificar, devolvemos las habitaciones y su estado
    const habitaciones = await listarHabitaciones(auth.auth.empresaId)
    return NextResponse.json({ ok: true, habitaciones })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { action, reservaId, clienteId, habitacionId, checkIn, checkOut, origen } = body

    if (action === "crear") {
      const res = await crearReserva(auth.auth.empresaId, {
        clienteId,
        habitacionId,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        origen: origen || "Directa"
      })
      return NextResponse.json({ ok: true, reserva: res })
    }

    if (action === "checkin" && reservaId) {
      const res = await realizarCheckIn(auth.auth.empresaId, reservaId)
      return NextResponse.json({ ok: true, reserva: res })
    }

    if (action === "checkout" && reservaId) {
      const res = await realizarCheckOut(auth.auth.empresaId, reservaId)
      return NextResponse.json({ ok: true, reserva: res })
    }

    return NextResponse.json({ ok: false, error: "Acción no válida" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
