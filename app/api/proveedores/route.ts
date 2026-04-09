import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import prisma from "@/lib/prisma"
import { z } from "zod"

const proveedorSchema = z.object({
  nombre: z.string().min(2),
  cuit: z.string().regex(/^\d{11}$/, "CUIT debe tener 11 dígitos"),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  condicionIva: z.string().default("Responsable Inscripto"),
  condicionPagoId: z.number().int().positive().optional().nullable(),
  provinciaId: z.number().int().positive().optional().nullable(),
  paisId: z.number().int().positive().optional().nullable(),
  localidadId: z.number().int().positive().optional().nullable(),
  rubroId: z.number().int().positive().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    const where: Record<string, unknown> = whereEmpresa(ctx.auth.empresaId, { deletedAt: null })
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { cuit: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    const proveedores = await prisma.proveedor.findMany({
      where,
      orderBy: { nombre: "asc" },
      include: { _count: { select: { compras: true } } },
    })

    return NextResponse.json(proveedores)
  } catch (error) {
    console.error("Error al obtener proveedores:", error)
    return NextResponse.json({ error: "Error al obtener proveedores" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = proveedorSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const existente = await prisma.proveedor.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { cuit: validacion.data.cuit, deletedAt: null }),
    })
    if (existente) {
      return NextResponse.json({ error: "Ya existe un proveedor con ese CUIT" }, { status: 409 })
    }

    const data = { ...validacion.data }
    if (data.email === "") data.email = null

    const proveedor = await prisma.proveedor.create({
      data: { ...data, empresaId: ctx.auth.empresaId, createdBy: ctx.auth.userId },
    })
    return NextResponse.json(proveedor, { status: 201 })
  } catch (error) {
    console.error("Error al crear proveedor:", error)
    return NextResponse.json({ error: "Error al crear proveedor" }, { status: 500 })
  }
}
