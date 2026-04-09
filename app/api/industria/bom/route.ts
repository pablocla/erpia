import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { z } from "zod"

const bomSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  tipo: z.enum(["produccion", "receta"]).default("produccion"),
  productoId: z.number().int().positive().optional().nullable(),
  componentes: z.array(z.object({
    productoId: z.number().int().positive().optional().nullable(),
    descripcion: z.string().min(1),
    cantidad: z.number().positive(),
    unidad: z.string().default("unidad"),
  })).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") || "produccion"
    const productoId = searchParams.get("productoId")

    const boms = await prisma.listaMateriales.findMany({
      where: {
        activo: true,
        empresaId: ctx.auth.empresaId,
        tipo,
        ...(productoId ? { productoId: Number(productoId) } : {}),
      } as any,
      include: {
        producto: { select: { id: true, nombre: true, codigo: true } },
        componentes: {
          include: { producto: { select: { id: true, nombre: true, codigo: true } } },
        },
      },
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json(boms)
  } catch (error) {
    console.error("Error al obtener listas de materiales:", error)
    logError("api/industria/bom:GET", error, request)
    return NextResponse.json({ error: "Error al obtener listas de materiales" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = bomSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const existente = await prisma.listaMateriales.findUnique({ where: { codigo: parsed.data.codigo } })
    if (existente) return NextResponse.json({ error: "Ya existe una BOM con ese código" }, { status: 409 })

    const bom = await prisma.listaMateriales.create({
      data: {
        empresaId: ctx.auth.empresaId,
        codigo: parsed.data.codigo,
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion,
        tipo: parsed.data.tipo,
        productoId: parsed.data.productoId ?? null,
        componentes: parsed.data.componentes
          ? { create: parsed.data.componentes.map((c) => ({
              productoId: c.productoId ?? null,
              descripcion: c.descripcion,
              cantidad: c.cantidad,
              unidad: c.unidad,
            })) }
          : undefined,
      },
      include: {
        producto: { select: { id: true, nombre: true, codigo: true } },
        componentes: { include: { producto: { select: { id: true, nombre: true, codigo: true } } } },
      },
    })

    return NextResponse.json(bom, { status: 201 })
  } catch (error) {
    console.error("Error al crear lista de materiales:", error)
    logError("api/industria/bom:POST", error, request)
    return NextResponse.json({ error: "Error al crear lista de materiales" }, { status: 500 })
  }
}
