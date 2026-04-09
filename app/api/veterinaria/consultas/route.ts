import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"

const consultaSchema = z.object({
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
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const pacienteId = searchParams.get("pacienteId")

    const where: Record<string, unknown> = {
      paciente: { cliente: { empresaId: ctx.auth.empresaId } },
    }

    if (pacienteId) where.pacienteId = parseInt(pacienteId)

    const consultas = await prisma.consulta.findMany({
      where,
      include: {
        paciente: { select: { id: true, nombre: true, especie: true } },
      },
      orderBy: { fecha: "desc" },
      take: 100,
    })

    return NextResponse.json(consultas)
  } catch (error) {
    console.error("veterinaria/consultas GET:", error)
    return NextResponse.json({ error: "Error al obtener consultas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = consultaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    // Validate paciente belongs to empresa
    const paciente = await prisma.paciente.findFirst({
      where: {
        id: parsed.data.pacienteId,
        cliente: { empresaId: ctx.auth.empresaId },
      },
    })
    if (!paciente) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
    }

    const consulta = await prisma.consulta.create({
      data: {
        pacienteId: parsed.data.pacienteId,
        motivo: parsed.data.motivo,
        diagnostico: parsed.data.diagnostico,
        tratamiento: parsed.data.tratamiento,
        observaciones: parsed.data.observaciones,
        peso: parsed.data.peso,
        temperatura: parsed.data.temperatura,
        proximaVisita: parsed.data.proximaVisita ? new Date(parsed.data.proximaVisita) : undefined,
      },
      include: { paciente: { select: { id: true, nombre: true } } },
    })

    return NextResponse.json(consulta, { status: 201 })
  } catch (error) {
    console.error("veterinaria/consultas POST:", error)
    return NextResponse.json({ error: "Error al crear consulta" }, { status: 500 })
  }
}
