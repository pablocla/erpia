import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { z } from "zod"

const updateSchema = z.object({
  patente: z.string().min(3).optional(),
  tipo: z.string().optional(),
  marca: z.string().optional().nullable(),
  modelo: z.string().optional().nullable(),
  capacidadKg: z.number().positive().optional().nullable(),
  capacidadBultos: z.number().int().positive().optional().nullable(),
  activo: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const id = parseInt((await params).id, 10)
    if (!id) return NextResponse.json({ error: "ID invalido" }, { status: 400 })

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const existente = await prisma.vehiculo.findFirst({
      where: { id, empresaId: ctx.auth.empresaId },
      select: { id: true },
    })
    if (!existente) return NextResponse.json({ error: "Vehiculo no encontrado" }, { status: 404 })

    const vehiculo = await prisma.vehiculo.update({
      where: { id },
      data: {
        ...(parsed.data.patente && { patente: parsed.data.patente.toUpperCase() }),
        ...(parsed.data.tipo !== undefined && { tipo: parsed.data.tipo }),
        ...(parsed.data.marca !== undefined && { marca: parsed.data.marca }),
        ...(parsed.data.modelo !== undefined && { modelo: parsed.data.modelo }),
        ...(parsed.data.capacidadKg !== undefined && { capacidadKg: parsed.data.capacidadKg }),
        ...(parsed.data.capacidadBultos !== undefined && { capacidadBultos: parsed.data.capacidadBultos }),
        ...(parsed.data.activo !== undefined && { activo: parsed.data.activo }),
      },
    })

    return NextResponse.json(vehiculo)
  } catch (error) {
    console.error("Error al actualizar vehiculo:", error)
    logError("api/distribucion/vehiculos/[id]:PATCH", error, request)
    return NextResponse.json({ error: "Error al actualizar vehiculo" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const id = parseInt((await params).id, 10)
    if (!id) return NextResponse.json({ error: "ID invalido" }, { status: 400 })

    const existente = await prisma.vehiculo.findFirst({
      where: { id, empresaId: ctx.auth.empresaId },
      select: { id: true },
    })
    if (!existente) return NextResponse.json({ error: "Vehiculo no encontrado" }, { status: 404 })

    await prisma.vehiculo.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar vehiculo:", error)
    logError("api/distribucion/vehiculos/[id]:DELETE", error, request)
    return NextResponse.json({ error: "Error al eliminar vehiculo" }, { status: 500 })
  }
}
