import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { z } from "zod"

const pickingSchema = z.object({
  numero: z.string().min(1),
  prioridad: z.enum(["baja", "normal", "alta", "urgente"]).default("normal"),
  zonaAlmacen: z.string().optional(),
  operario: z.string().optional(),
  notas: z.string().optional(),
  remitoId: z.number().int().positive().optional().nullable(),
  pedidoVentaId: z.number().int().positive().optional().nullable(),
  lineas: z.array(z.object({
    productoId: z.number().int().positive().optional().nullable(),
    descripcion: z.string().min(1),
    cantidadPedida: z.number().positive(),
    ubicacion: z.string().optional(),
  })).min(1),
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
        { operario: { contains: search, mode: "insensitive" } },
      ]
    }

    const listas = await prisma.listaPicking.findMany({
      where,
      include: {
        lineas: { include: { producto: { select: { id: true, nombre: true, codigo: true } } } },
        remito: { select: { id: true, numero: true } },
      },
      orderBy: [{ prioridad: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(listas)
  } catch (error) {
    console.error("Error al obtener listas de picking:", error)
    logError("api/picking:GET", error, request)
    return NextResponse.json({ error: "Error al obtener listas de picking" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = pickingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const existente = await prisma.listaPicking.findUnique({ where: { numero: parsed.data.numero } })
    if (existente) return NextResponse.json({ error: "Ya existe una lista con ese número" }, { status: 409 })

    const lista = await prisma.listaPicking.create({
      data: {
        empresaId: ctx.auth.empresaId,
        numero: parsed.data.numero,
        prioridad: parsed.data.prioridad,
        zonaAlmacen: parsed.data.zonaAlmacen,
        operario: parsed.data.operario,
        notas: parsed.data.notas,
        remitoId: parsed.data.remitoId ?? null,
        pedidoVentaId: parsed.data.pedidoVentaId ?? null,
        lineas: {
          create: parsed.data.lineas.map((l) => ({
            productoId: l.productoId ?? null,
            descripcion: l.descripcion,
            cantidadPedida: l.cantidadPedida,
            ubicacion: l.ubicacion,
          })),
        },
      },
      include: {
        lineas: { include: { producto: { select: { id: true, nombre: true, codigo: true } } } },
        remito: { select: { id: true, numero: true } },
      },
    })

    return NextResponse.json(lista, { status: 201 })
  } catch (error) {
    console.error("Error al crear lista de picking:", error)
    logError("api/picking:POST", error, request)
    return NextResponse.json({ error: "Error al crear lista de picking" }, { status: 500 })
  }
}
