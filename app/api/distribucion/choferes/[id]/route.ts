import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { z } from "zod"

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  documento: z.string().optional().nullable(),
  licencia: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
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

    const existente = await prisma.chofer.findFirst({
      where: { id, empresaId: ctx.auth.empresaId },
      select: { id: true },
    })
    if (!existente) return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 })

    const chofer = await prisma.chofer.update({
      where: { id },
      data: {
        ...(parsed.data.nombre !== undefined && { nombre: parsed.data.nombre }),
        ...(parsed.data.documento !== undefined && { documento: parsed.data.documento }),
        ...(parsed.data.licencia !== undefined && { licencia: parsed.data.licencia }),
        ...(parsed.data.telefono !== undefined && { telefono: parsed.data.telefono }),
        ...(parsed.data.email !== undefined && { email: parsed.data.email }),
        ...(parsed.data.activo !== undefined && { activo: parsed.data.activo }),
      },
    })

    return NextResponse.json(chofer)
  } catch (error) {
    console.error("Error al actualizar chofer:", error)
    logError("api/distribucion/choferes/[id]:PATCH", error, request)
    return NextResponse.json({ error: "Error al actualizar chofer" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const id = parseInt((await params).id, 10)
    if (!id) return NextResponse.json({ error: "ID invalido" }, { status: 400 })

    const existente = await prisma.chofer.findFirst({
      where: { id, empresaId: ctx.auth.empresaId },
      select: { id: true },
    })
    if (!existente) return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 })

    await prisma.chofer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar chofer:", error)
    logError("api/distribucion/choferes/[id]:DELETE", error, request)
    return NextResponse.json({ error: "Error al eliminar chofer" }, { status: 500 })
  }
}
