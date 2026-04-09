import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { z } from "zod"

const updateSchema = z.object({
  estado: z.enum(["planificada", "en_ruta", "finalizada", "cancelada"]).optional(),
  vehiculoId: z.number().int().positive().optional().nullable(),
  choferId: z.number().int().positive().optional().nullable(),
  kmEstimado: z.number().positive().optional().nullable(),
  observaciones: z.string().optional().nullable(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const id = parseInt(params.id, 10)
    if (!id) return NextResponse.json({ error: "ID invalido" }, { status: 400 })

    const hoja = await prisma.hojaRuta.findFirst({
      where: { id, empresaId: ctx.auth.empresaId },
      include: {
        vehiculo: true,
        chofer: true,
        paradas: {
          include: {
            envio: true,
            cliente: { select: { id: true, nombre: true } },
            evidencia: true,
          },
          orderBy: { orden: "asc" },
        },
      },
    })

    if (!hoja) return NextResponse.json({ error: "Hoja de ruta no encontrada" }, { status: 404 })
    return NextResponse.json(hoja)
  } catch (error) {
    console.error("Error al obtener hoja de ruta:", error)
    logError("api/distribucion/hojas-ruta/[id]:GET", error, request)
    return NextResponse.json({ error: "Error al obtener hoja de ruta" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const id = parseInt(params.id, 10)
    if (!id) return NextResponse.json({ error: "ID invalido" }, { status: 400 })

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const existente = await prisma.hojaRuta.findFirst({
      where: { id, empresaId: ctx.auth.empresaId },
      select: { id: true },
    })
    if (!existente) return NextResponse.json({ error: "Hoja de ruta no encontrada" }, { status: 404 })

    if (parsed.data.vehiculoId) {
      const vehiculo = await prisma.vehiculo.findFirst({
        where: { id: parsed.data.vehiculoId, empresaId: ctx.auth.empresaId },
        select: { id: true },
      })
      if (!vehiculo) return NextResponse.json({ error: "Vehiculo no encontrado" }, { status: 404 })
    }

    if (parsed.data.choferId) {
      const chofer = await prisma.chofer.findFirst({
        where: { id: parsed.data.choferId, empresaId: ctx.auth.empresaId },
        select: { id: true },
      })
      if (!chofer) return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 })
    }

    const hoja = await prisma.hojaRuta.update({
      where: { id },
      data: {
        ...(parsed.data.estado && { estado: parsed.data.estado }),
        ...(parsed.data.vehiculoId !== undefined && { vehiculoId: parsed.data.vehiculoId }),
        ...(parsed.data.choferId !== undefined && { choferId: parsed.data.choferId }),
        ...(parsed.data.kmEstimado !== undefined && { kmEstimado: parsed.data.kmEstimado }),
        ...(parsed.data.observaciones !== undefined && { observaciones: parsed.data.observaciones }),
      },
      include: {
        vehiculo: true,
        chofer: true,
        paradas: true,
      },
    })

    return NextResponse.json(hoja)
  } catch (error) {
    console.error("Error al actualizar hoja de ruta:", error)
    logError("api/distribucion/hojas-ruta/[id]:PATCH", error, request)
    return NextResponse.json({ error: "Error al actualizar hoja de ruta" }, { status: 500 })
  }
}
