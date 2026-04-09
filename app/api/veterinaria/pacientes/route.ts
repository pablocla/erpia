import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"

const pacienteSchema = z.object({
  nombre: z.string().min(1),
  clienteId: z.number().int().positive(),
  especie: z.string().optional(),
  raza: z.string().optional(),
  sexo: z.enum(["M", "H"]).optional(),
  fechaNac: z.string().optional(),
  peso: z.number().positive().optional(),
  chip: z.string().optional(),
  notas: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const clienteId = searchParams.get("clienteId")

    const where: Record<string, unknown> = {
      activo: true,
      cliente: { empresaId: ctx.auth.empresaId },
    }

    if (clienteId) where.clienteId = parseInt(clienteId)

    if (search.trim()) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { chip: { contains: search, mode: "insensitive" } },
        { raza: { contains: search, mode: "insensitive" } },
        { cliente: { nombre: { contains: search, mode: "insensitive" } } },
      ]
    }

    const pacientes = await prisma.paciente.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        consultas: {
          orderBy: { fecha: "desc" },
          take: 1,
          select: { fecha: true, motivo: true },
        },
      },
      orderBy: { nombre: "asc" },
      take: 100,
    })

    return NextResponse.json(pacientes)
  } catch (error) {
    console.error("veterinaria/pacientes GET:", error)
    return NextResponse.json({ error: "Error al obtener pacientes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = pacienteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    // Validate cliente belongs to empresa
    const cliente = await prisma.cliente.findFirst({
      where: { id: parsed.data.clienteId, empresaId: ctx.auth.empresaId },
    })
    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const paciente = await prisma.paciente.create({
      data: {
        nombre: parsed.data.nombre,
        clienteId: parsed.data.clienteId,
        especie: parsed.data.especie,
        raza: parsed.data.raza,
        sexo: parsed.data.sexo,
        fechaNac: parsed.data.fechaNac ? new Date(parsed.data.fechaNac) : undefined,
        peso: parsed.data.peso,
        chip: parsed.data.chip,
        notas: parsed.data.notas,
      },
      include: { cliente: { select: { id: true, nombre: true } } },
    })

    return NextResponse.json(paciente, { status: 201 })
  } catch (error) {
    console.error("veterinaria/pacientes POST:", error)
    return NextResponse.json({ error: "Error al crear paciente" }, { status: 500 })
  }
}
