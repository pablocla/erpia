import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const vendedorSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().optional(),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  comisionPct: z.number().min(0).max(100).default(0),
  activo: z.boolean().default(true),
  usuarioId: z.number().int().positive().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const activo = searchParams.get("activo")
    const skip = parseInt(searchParams.get("skip") ?? "0", 10)
    const take = Math.min(parseInt(searchParams.get("take") ?? "50", 10), 200)

    const where: Record<string, unknown> = {}
    if (activo !== null) where.activo = activo !== "false"

    const [data, total] = await Promise.all([
      prisma.vendedor.findMany({
        where,
        include: {
          _count: { select: { facturas: true, clientes: true, presupuestos: true } },
        },
        skip,
        take,
        orderBy: { nombre: "asc" },
      }),
      prisma.vendedor.count({ where }),
    ])

    return NextResponse.json({ data, total, skip, take })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = vendedorSchema.parse(body)

    const vendedor = await prisma.vendedor.create({
      data: parsed,
    })

    return NextResponse.json(vendedor, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 })
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email duplicado" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

    const parsed = vendedorSchema.partial().parse(data)

    const vendedor = await prisma.vendedor.update({
      where: { id: parseInt(id, 10) },
      data: parsed,
    })

    return NextResponse.json(vendedor)
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
