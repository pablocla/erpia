import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const crearTurnoSchema = z.object({
  fecha: z.string(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/),
  profesionalId: z.number().int().positive(),
  clienteId: z.number().int().positive().optional(),
  motivo: z.string().optional(),
  notas: z.string().optional(),
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

    const [turnos, profesionales] = await Promise.all([
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

    return NextResponse.json({ success: true, turnos, profesionales, resumen })
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

    const turno = await prisma.turno.create({
      data: {
        fecha: new Date(data.fecha),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        profesionalId: data.profesionalId,
        clienteId: data.clienteId,
        motivo: data.motivo,
        notas: data.notas,
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
