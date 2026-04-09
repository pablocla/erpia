import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { z } from "zod"

const envioSchema = z.object({
  numero: z.string().min(1),
  direccionDestino: z.string().min(1),
  transportistaId: z.number().int().positive().optional().nullable(),
  remitoId: z.number().int().positive().optional().nullable(),
  fechaEmbarque: z.string().optional().nullable(),
  fechaEntrega: z.string().optional().nullable(),
  pesoKg: z.number().positive().optional().nullable(),
  bultos: z.number().int().min(1).default(1),
  observaciones: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const estado = searchParams.get("estado") || ""

    const where: Record<string, unknown> = { empresaId: ctx.auth.empresaId }
    if (estado) where.estado = estado
    if (search) {
      where.OR = [
        { numero: { contains: search, mode: "insensitive" } },
        { direccionDestino: { contains: search, mode: "insensitive" } },
      ]
    }

    const envios = await prisma.envio.findMany({
      where,
      include: {
        transportista: true,
        remito: { select: { id: true, numero: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(envios)
  } catch (error) {
    console.error("Error al obtener envíos:", error)
    logError("api/logistica:GET", error, request)
    return NextResponse.json({ error: "Error al obtener envíos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = envioSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const existente = await prisma.envio.findUnique({ where: { numero: parsed.data.numero } })
    if (existente) return NextResponse.json({ error: "Ya existe un envío con ese número" }, { status: 409 })

    const envio = await prisma.envio.create({
      data: {
        empresaId: ctx.auth.empresaId,
        numero: parsed.data.numero,
        direccionDestino: parsed.data.direccionDestino,
        transportistaId: parsed.data.transportistaId ?? null,
        remitoId: parsed.data.remitoId ?? null,
        fechaEmbarque: parsed.data.fechaEmbarque ? new Date(parsed.data.fechaEmbarque) : null,
        fechaEntrega: parsed.data.fechaEntrega ? new Date(parsed.data.fechaEntrega) : null,
        pesoKg: parsed.data.pesoKg ?? null,
        bultos: parsed.data.bultos,
        observaciones: parsed.data.observaciones,
      },
      include: { transportista: true, remito: { select: { id: true, numero: true } } },
    })

    return NextResponse.json(envio, { status: 201 })
  } catch (error) {
    console.error("Error al crear envío:", error)
    logError("api/logistica:POST", error, request)
    return NextResponse.json({ error: "Error al crear envío" }, { status: 500 })
  }
}
