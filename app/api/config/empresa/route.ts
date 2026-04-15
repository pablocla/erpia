import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const empresa = await prisma.empresa.findUnique({
    where: { id: ctx.auth.empresaId },
  })

  if (!empresa) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
  }

  return NextResponse.json(empresa)
}

const empresaUpdateSchema = z.object({
  nombre: z.string().min(1).optional(),
  razonSocial: z.string().min(1).optional(),
  cuit: z.string().min(11).max(13).optional(),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  puntoVenta: z.number().int().positive().optional(),
  entorno: z.enum(["homologacion", "produccion"]).optional(),
  rubro: z.string().optional(),
  condicionIva: z.string().optional(),
  paisFiscal: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    // Only admins/owners can update company data
    if (!["admin", "propietario"].includes(ctx.auth.rol)) {
      return NextResponse.json({ error: "Solo administradores pueden modificar datos de empresa" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = empresaUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const empresa = await prisma.empresa.update({
      where: { id: ctx.auth.empresaId },
      data: parsed.data,
    })

    return NextResponse.json(empresa)
  } catch (error) {
    console.error("Error al actualizar empresa:", error)
    return NextResponse.json({ error: "Error al actualizar empresa" }, { status: 500 })
  }
}
