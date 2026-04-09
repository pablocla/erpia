import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { z } from "zod"

const ordenSchema = z.object({
  numero: z.string().min(1),
  cantidad: z.number().positive(),
  bomId: z.number().int().positive().optional().nullable(),
  productoId: z.number().int().positive().optional().nullable(),
  fechaInicio: z.string().optional().nullable(),
  fechaFinPlan: z.string().optional().nullable(),
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
      ]
    }

    const ordenes = await prisma.ordenProduccion.findMany({
      where,
      include: {
        bom: { select: { id: true, nombre: true, codigo: true } },
        producto: { select: { id: true, nombre: true, codigo: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(ordenes)
  } catch (error) {
    console.error("Error al obtener órdenes de producción:", error)
    logError("api/industria:GET", error, request)
    return NextResponse.json({ error: "Error al obtener órdenes de producción" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = ordenSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const existente = await prisma.ordenProduccion.findUnique({ where: { numero: parsed.data.numero } })
    if (existente) return NextResponse.json({ error: "Ya existe una orden con ese número" }, { status: 409 })

    const orden = await prisma.ordenProduccion.create({
      data: {
        empresaId: ctx.auth.empresaId,
        numero: parsed.data.numero,
        cantidad: parsed.data.cantidad,
        bomId: parsed.data.bomId ?? null,
        productoId: parsed.data.productoId ?? null,
        fechaInicio: parsed.data.fechaInicio ? new Date(parsed.data.fechaInicio) : null,
        fechaFinPlan: parsed.data.fechaFinPlan ? new Date(parsed.data.fechaFinPlan) : null,
        observaciones: parsed.data.observaciones,
      },
      include: {
        bom: { select: { id: true, nombre: true, codigo: true } },
        producto: { select: { id: true, nombre: true, codigo: true } },
      },
    })

    return NextResponse.json(orden, { status: 201 })
  } catch (error) {
    console.error("Error al crear orden de producción:", error)
    logError("api/industria:POST", error, request)
    return NextResponse.json({ error: "Error al crear orden de producción" }, { status: 500 })
  }
}
