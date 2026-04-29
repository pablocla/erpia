import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const DEFAULT_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
]

const parseTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

const formatTime = (minutes: number) => {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
}

const overlaps = (startA: string, endA: string, startB: string, endB: string) => {
  const a1 = parseTime(startA)
  const a2 = parseTime(endA)
  const b1 = parseTime(startB)
  const b2 = parseTime(endB)
  return a1 < b2 && b1 < a2
}

const buildAvailableSlots = (existingTurnos: Array<{ horaInicio: string; horaFin: string }>, durationMin = 30) => {
  return DEFAULT_SLOTS.filter((slot) => {
    const slotEnd = formatTime(parseTime(slot) + durationMin)
    return !existingTurnos.some((turno) => overlaps(slot, slotEnd, turno.horaInicio, turno.horaFin))
  })
}

const createBookingSchema = z.object({
  nombre: z.string().min(3),
  telefono: z.string().min(6),
  email: z.string().email().optional(),
  profesionalId: z.number().int().positive().optional(),
  servicioId: z.number().int().positive().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  notas: z.string().optional(),
})

export async function GET(request: NextRequest, { params }: { params: { empresaId: string } }) {
  const empresaId = Number(params.empresaId)
  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    return NextResponse.json({ error: "Empresa inválida" }, { status: 400 })
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, nombre: true },
  })

  if (!empresa) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
  }

  const profesionales = await prisma.profesional.findMany({
    where: { empresaId, activo: true },
    select: { id: true, nombre: true, especialidad: true, color: true },
    orderBy: { nombre: "asc" },
  })

  const fecha = request.nextUrl.searchParams.get("fecha")
  const profesionalId = Number(request.nextUrl.searchParams.get("profesionalId") ?? "0")
  const servicioId = Number(request.nextUrl.searchParams.get("servicioId") ?? "0")

  const servicios = await prisma.servicio.findMany({
    where: { empresaId, activo: true },
    select: { id: true, nombre: true, duracionMinutos: true },
    orderBy: { nombre: "asc" },
  })

  let duracionMinutos = 30
  if (servicioId) {
    const servicio = servicios.find((item) => item.id === servicioId)
    if (servicio) duracionMinutos = servicio.duracionMinutos
  }

  let disponibilidad: Array<{ profesionalId: number; horarios: string[] }> = []

  if (fecha && profesionales.length > 0) {
    const turnos = await prisma.turno.findMany({
      where: {
        fecha: new Date(fecha),
        estado: { not: "cancelado" },
        ...(profesionalId ? { profesionalId } : {}),
      },
      select: { horaInicio: true, horaFin: true, profesionalId: true },
    })

    const profesionalesFiltrados = profesionalId
      ? profesionales.filter((p) => p.id === profesionalId)
      : profesionales

    disponibilidad = profesionalesFiltrados.map((profesional) => ({
      profesionalId: profesional.id,
      horarios: buildAvailableSlots(
        turnos.filter((turno) => turno.profesionalId === profesional.id),
        duracionMinutos,
      ),
    }))
  }

  return NextResponse.json({
    success: true,
    empresa,
    profesionales,
    servicios,
    disponibilidad,
  })
}

export async function POST(request: NextRequest, { params }: { params: { empresaId: string } }) {
  const empresaId = Number(params.empresaId)
  if (!Number.isInteger(empresaId) || empresaId <= 0) {
    return NextResponse.json({ error: "Empresa inválida" }, { status: 400 })
  }

  const body = await request.json()
  const data = createBookingSchema.safeParse(body)
  if (!data.success) {
    return NextResponse.json({ error: "Datos inválidos", details: data.error.errors }, { status: 400 })
  }

  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } })
  if (!empresa) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
  }

  const profesionalId = data.data.profesionalId
    ? data.data.profesionalId
    : await prisma.profesional.findFirst({ where: { empresaId, activo: true }, select: { id: true } }).then((prof) => prof?.id)

  if (!profesionalId) {
    return NextResponse.json({ error: "No hay profesionales activos para esta empresa" }, { status: 400 })
  }

  const telefonoNormalizado = data.data.telefono.replace(/[^0-9]/g, "")
  let cliente = await prisma.cliente.findFirst({
    where: {
      empresaId,
      OR: [{ telefono: { contains: telefonoNormalizado } }, { email: data.data.email ?? "" }],
    },
  })

  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        nombre: data.data.nombre,
        tipoPersona: "persona_fisica",
        telefono: telefonoNormalizado,
        email: data.data.email,
        empresaId,
      },
    })
  }

  const servicio = data.data.servicioId
    ? await prisma.servicio.findUnique({ where: { id: data.data.servicioId }, select: { nombre: true, duracionMinutos: true } })
    : null

  const durationMinutos = servicio?.duracionMinutos ?? 30
  const horaFin = data.data.horaFin ?? calculateEndTime(data.data.horaInicio, durationMinutos)

  const turnosExistentes = await prisma.turno.findMany({
    where: {
      empresaId,
      profesionalId,
      fecha: new Date(data.data.fecha),
      estado: { not: "cancelado" },
    },
    select: { horaInicio: true, horaFin: true },
  })

  if (turnosExistentes.some((turno) => overlaps(data.data.horaInicio, horaFin, turno.horaInicio, turno.horaFin))) {
    return NextResponse.json({ error: "El horario ya está reservado" }, { status: 409 })
  }

  const turno = await prisma.turno.create({
    data: {
      fecha: new Date(data.data.fecha),
      horaInicio: data.data.horaInicio,
      horaFin,
      duracionMinutos,
      profesionalId,
      clienteId: cliente.id,
      motivo: servicio?.nombre ?? "Reserva online",
      notas: data.data.notas,
      estado: "pendiente",
      servicioId: data.data.servicioId,
      empresaId,
    },
    include: {
      profesional: { select: { id: true, nombre: true } },
      cliente: { select: { id: true, nombre: true, telefono: true } },
    },
  })

  return NextResponse.json({ success: true, turno }, { status: 201 })
}
