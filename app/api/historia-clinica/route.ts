import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const crearConsultaSchema = z.object({
  pacienteId: z.number().int().positive(),
  motivo: z.string().min(1),
  diagnostico: z.string().optional(),
  tratamiento: z.string().optional(),
  observaciones: z.string().optional(),
  peso: z.number().positive().optional(),
  temperatura: z.number().positive().optional(),
  proximaVisita: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const params = request.nextUrl.searchParams
    const clienteId = params.get("clienteId")
    const pacienteId = params.get("pacienteId")
    const q = params.get("q")

    const wherePaciente: Record<string, unknown> = { cliente: { empresaId: usuario.empresaId } }
    if (clienteId) wherePaciente.clienteId = Number(clienteId)
    if (q) wherePaciente.nombre = { contains: q, mode: "insensitive" }

    const [pacientes, totalConsultas] = await Promise.all([
      prisma.paciente.findMany({
        where: wherePaciente,
        include: {
          cliente: { select: { id: true, nombre: true, telefono: true } },
          consultas: {
            orderBy: { fecha: "desc" },
            take: pacienteId ? 50 : 3,
          },
          _count: { select: { consultas: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.consulta.count(),
    ])

    const resumen = {
      totalPacientes: pacientes.length,
      totalConsultas,
      activos: pacientes.filter(p => p.activo).length,
    }

    return NextResponse.json({ success: true, pacientes, resumen })
  } catch (error) {
    console.error("Error al obtener historia clínica:", error)
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()

    // If creating a new patient
    if (body.tipo === "paciente") {
      const paciente = await prisma.paciente.create({
        data: {
          nombre: body.nombre,
          especie: body.especie,
          raza: body.raza,
          sexo: body.sexo,
          fechaNac: body.fechaNac ? new Date(body.fechaNac) : null,
          peso: body.peso,
          clienteId: body.clienteId,
        },
        include: { cliente: { select: { id: true, nombre: true } } },
      })
      return NextResponse.json({ success: true, paciente }, { status: 201 })
    }

    // Creating a consultation
    const data = crearConsultaSchema.parse(body)
    const consulta = await prisma.consulta.create({
      data: {
        pacienteId: data.pacienteId,
        motivo: data.motivo,
        diagnostico: data.diagnostico,
        tratamiento: data.tratamiento,
        observaciones: data.observaciones,
        peso: data.peso,
        temperatura: data.temperatura,
        proximaVisita: data.proximaVisita ? new Date(data.proximaVisita) : null,
      },
    })

    // Update patient weight if provided
    if (data.peso) {
      await prisma.paciente.update({ where: { id: data.pacienteId }, data: { peso: data.peso } })
    }

    return NextResponse.json({ success: true, consulta }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 })
    }
    console.error("Error al registrar:", error)
    return NextResponse.json({ error: "Error al registrar" }, { status: 500 })
  }
}
