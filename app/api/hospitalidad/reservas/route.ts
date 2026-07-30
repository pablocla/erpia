import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { CerraduraIoTService } from "@/lib/iot/cerraduras-service"

const createReservaSchema = z.object({
  clienteId: z.number().int().positive(),
  habitacionId: z.number().int().positive(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  origen: z.string().default("Directa"),
  precioTotal: z.number().nonnegative(),
})

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const body = await request.json()
    const data = createReservaSchema.parse(body)

    // Validar disponibilidad
    const superposicion = await prisma.reservaHotel.findFirst({
      where: {
        ...whereEmpresa(ctx.auth.empresaId),
        habitacionId: data.habitacionId,
        estado: { notIn: ["Cancelada", "CheckOut"] },
        OR: [
          {
            checkIn: { lte: new Date(data.checkOut) },
            checkOut: { gte: new Date(data.checkIn) }
          }
        ]
      }
    })

    if (superposicion) {
      return NextResponse.json(
        { error: "La habitación no está disponible en las fechas seleccionadas." },
        { status: 409 }
      )
    }

    // Crear la reserva
    const reserva = await prisma.reservaHotel.create({
      data: {
        empresaId: ctx.auth.empresaId,
        clienteId: data.clienteId,
        habitacionId: data.habitacionId,
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        origen: data.origen,
        precioTotal: data.precioTotal,
        saldoPendiente: data.precioTotal, // Asume que no hay cobro anticipado aún
        estado: "Confirmada",
      }
    })

    // Chequear si la habitación tiene cerradura IoT
    const cerradura = await prisma.cerraduraIoT.findUnique({
      where: { habitacionId: reserva.habitacionId }
    })

    let pinTemporal = null
    if (cerradura) {
      const iotService = new CerraduraIoTService({ proveedor: cerradura.proveedor as any })
      const llave = await iotService.generarLlaveTemporal(
        ctx.auth.empresaId,
        reserva.id,
        cerradura.id
      )
      pinTemporal = llave.pinCode
    }

    return NextResponse.json({
      reserva,
      llaveGenerada: !!cerradura,
      pinTemporal
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error("[API_RESERVAS_POST]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { searchParams } = new URL(request.url)
  const estado = searchParams.get("estado")

  try {
    const reservas = await prisma.reservaHotel.findMany({
      where: {
        ...whereEmpresa(ctx.auth.empresaId),
        ...(estado ? { estado } : {})
      },
      include: {
        cliente: { select: { nombre: true, email: true } },
        habitacion: { select: { numero: true, tipo: true } }
      },
      orderBy: { checkIn: "asc" }
    })
    
    return NextResponse.json(reservas)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener reservas" }, { status: 500 })
  }
}
