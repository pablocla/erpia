import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const sucursalSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  responsable: z.string().optional().nullable(),
  localidadId: z.number().int().positive().optional().nullable(),
  activo: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const data = await prisma.sucursal.findMany({
      where: { empresaId: ctx.auth.empresaId },
      include: {
        depositos: { select: { id: true, codigo: true, nombre: true } },
        cajasTipo: { select: { id: true, codigo: true, nombre: true } },
        _count: { select: { cajas: true } },
      },
      orderBy: { codigo: "asc" },
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
    const parsed = sucursalSchema.parse(body)

    const sucursal = await prisma.sucursal.create({
      data: { ...parsed, empresaId: ctx.auth.empresaId },
    })

    return NextResponse.json(sucursal, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 })
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Código duplicado para esta empresa" }, { status: 409 })
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

    const parsed = sucursalSchema.partial().parse(data)

    const sucursal = await prisma.sucursal.update({
      where: { id: parseInt(id, 10), empresaId: ctx.auth.empresaId },
      data: parsed,
    })

    return NextResponse.json(sucursal)
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Sucursal no encontrada" }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
