import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"

const transportistaSchema = z.object({
  nombre: z.string().min(1),
  cuit: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const transportistas = await prisma.transportista.findMany({
      where: { activo: true, empresaId: ctx.auth.empresaId },
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json(transportistas)
  } catch (error) {
    console.error("Error al obtener transportistas:", error)
    return NextResponse.json({ error: "Error al obtener transportistas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = transportistaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const transportista = await prisma.transportista.create({
      data: {
        nombre: parsed.data.nombre,
        cuit: parsed.data.cuit || null,
        telefono: parsed.data.telefono || null,
        email: parsed.data.email || null,
        empresaId: ctx.auth.empresaId,
      },
    })

    return NextResponse.json(transportista, { status: 201 })
  } catch (error) {
    console.error("Error al crear transportista:", error)
    return NextResponse.json({ error: "Error al crear transportista" }, { status: 500 })
  }
}
