import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import prisma from "@/lib/prisma"
import { z } from "zod"

const proveedorUpdateSchema = z.object({
  nombre: z.string().min(2).optional(),
  cuit: z.string().regex(/^\d{11}$/, "CUIT debe tener 11 dígitos").optional(),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  condicionIva: z.string().optional(),
  condicionPagoId: z.number().int().positive().optional().nullable(),
  provinciaId: z.number().int().positive().optional().nullable(),
  paisId: z.number().int().positive().optional().nullable(),
  localidadId: z.number().int().positive().optional().nullable(),
  rubroId: z.number().int().positive().optional().nullable(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const proveedor = await prisma.proveedor.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: Number(id), deletedAt: null }),
      include: {
        condicionPago: true,
        provincia: true,
        pais: true,
        localidad: true,
        rubro: true,
        cuentasPagar: { where: { saldo: { gt: 0 } }, take: 20 },
      },
    })

    if (!proveedor) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    return NextResponse.json(proveedor)
  } catch (error) {
    console.error("Error al obtener proveedor:", error)
    return NextResponse.json({ error: "Error al obtener proveedor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = proveedorUpdateSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { id } = await params
    const existing = await prisma.proveedor.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: Number(id), deletedAt: null }),
    })
    if (!existing) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    const data = { ...validacion.data }
    if (data.email === "") data.email = null

    const proveedor = await prisma.proveedor.update({
      where: { id: existing.id },
      data: { ...data, updatedBy: ctx.auth.userId },
    })

    return NextResponse.json(proveedor)
  } catch (error) {
    console.error("Error al actualizar proveedor:", error)
    return NextResponse.json({ error: "Error al actualizar proveedor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const existing = await prisma.proveedor.findFirst({
      where: whereEmpresa(ctx.auth.empresaId, { id: Number(id), deletedAt: null }),
    })
    if (!existing) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
    }

    await prisma.proveedor.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), updatedBy: ctx.auth.userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar proveedor:", error)
    return NextResponse.json({ error: "Error al eliminar proveedor" }, { status: 500 })
  }
}
