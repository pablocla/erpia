import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const cobradorSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  apellido: z.string().optional(),
  email: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  comisionPct: z.number().min(0).max(100).default(0),
  activo: z.boolean().default(true),
  zona: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const activo = searchParams.get("activo")

    const where: Record<string, unknown> = { empresaId: ctx.auth.empresaId }
    if (activo !== null) where.activo = activo !== "false"

    const data = await prisma.cobrador.findMany({
      where,
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = cobradorSchema.parse(body)

    const cobrador = await prisma.cobrador.create({
      data: { ...parsed, empresaId: ctx.auth.empresaId },
    })

    return NextResponse.json(cobrador, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 })
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Código duplicado" }, { status: 409 })
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

    const parsed = cobradorSchema.partial().parse(data)

    const cobrador = await prisma.cobrador.update({
      where: { id: parseInt(id, 10), empresaId: ctx.auth.empresaId },
      data: parsed,
    })

    return NextResponse.json(cobrador)
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Cobrador no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
