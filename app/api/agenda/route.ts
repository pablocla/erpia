import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const parseTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

const calculateEndTime = (start: string, durationMin: number) => {
  const endMinutes = parseTime(start) + durationMin
  return `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`
}

const timeOverlaps = (startA: string, endA: string, startB: string, endB: string) => {
  const a1 = parseTime(startA)
  const a2 = parseTime(endA)
  const b1 = parseTime(startB)
  const b2 = parseTime(endB)
  return a1 < b2 && b1 < a2
}

const crearTurnoSchema = z.object({
  fecha: z.string(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duracionMinutos: z.number().int().positive().optional(),
  servicioId: z.number().int().positive().optional(),
  profesionalId: z.number().int().positive(),
  clienteId: z.number().int().positive().optional(),
  motivo: z.string().optional(),
  notas: z.string().optional(),
}).refine((data) => Boolean(data.horaFin) || Boolean(data.duracionMinutos) || Boolean(data.servicioId), {
  message: "Debe proporcionar horaFin, duración o servicio para calcular la hora de fin",
  path: ["horaFin"],
})

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const params = request.nextUrl.searchParams
    const fecha = params.get("fecha")
    const profesionalId = params.get("profesionalId")

    const where: Record<string, unknown> = { profesional: { empresaId: usuario.empresaId } }
    if (fecha) where.fecha = new Date(fecha)
    if (profesionalId) where.profesionalId = Number(profesionalId)

    const [turnos, profesionales, servicios] = await Promise.all([
      prisma.turno.findMany({
        where,
        include: {
          profesional: { select: { id: true, nombre: true, especialidad: true, color: true } },
          cliente: { select: { id: true, nombre: true, telefono: true } },
        },
        orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
      }),
      prisma.profesional.findMany({
        where: { empresaId: usuario.empresaId, activo: true },
        select: { id: true, nombre: true, especialidad: true, color: true },
        orderBy: { nombre: "asc" },
      }),
      prisma.servicio.findMany({
        where: { empresaId: usuario.empresaId, activo: true },
        select: { id: true, nombre: true, duracionMinutos: true },
        orderBy: { nombre: "asc" },
      }),
    ])

    // Resumen del día
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const turnosHoy = turnos.filter(t => new Date(t.fecha).getTime() === hoy.getTime())
    const resumen = {
      totalHoy: turnosHoy.length,
      pendientes: turnosHoy.filter(t => t.estado === "pendiente").length,
      confirmados: turnosHoy.filter(t => t.estado === "confirmado").length,
      completados: turnosHoy.filter(t => t.estado === "completado").length,
    }

    return NextResponse.json({ success: true, turnos, profesionales, servicios, resumen })
  } catch (error) {
    console.error("Error al obtener turnos:", error)
    return NextResponse.json({ error: "Error al obtener turnos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()
    const data = crearTurnoSchema.parse(body)

    const servicio = data.servicioId
      ? await prisma.servicio.findUnique({ where: { id: data.servicioId }, select: { nombre: true, duracionMinutos: true } })
      : null

    const durationMinutos = servicio?.duracionMinutos ?? data.duracionMinutos ?? 30
    const horaFin = data.horaFin ?? calculateEndTime(data.horaInicio, durationMinutos)

    const turnosExistentes = await prisma.turno.findMany({
      where: {
        empresaId: usuario.empresaId,
        profesionalId: data.profesionalId,
        fecha: new Date(data.fecha),
        estado: { not: "cancelado" },
      },
      select: { horaInicio: true, horaFin: true },
    })

    if (turnosExistentes.some((turno) => timeOverlaps(data.horaInicio, horaFin, turno.horaInicio, turno.horaFin))) {
      return NextResponse.json({ error: "El horario ya está ocupado por otro turno" }, { status: 409 })
    }

    const turno = await prisma.turno.create({
      data: {
        fecha: new Date(data.fecha),
        horaInicio: data.horaInicio,
        horaFin,
        duracionMinutos,
        profesionalId: data.profesionalId,
        clienteId: data.clienteId,
        motivo: data.motivo ?? servicio?.nombre ?? "Turno",
        notas: data.notas,
        servicioId: data.servicioId,
        empresaId: usuario.empresaId,
      },
      include: {
        profesional: { select: { id: true, nombre: true, especialidad: true } },
        cliente: { select: { id: true, nombre: true } },
      },
    })

    return NextResponse.json({ success: true, turno }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 })
    }
    console.error("Error al crear turno:", error)
    return NextResponse.json({ error: "Error al crear turno" }, { status: 500 })
  }
}
