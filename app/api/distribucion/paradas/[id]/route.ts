import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { z } from "zod"

const evidenciaSchema = z.object({
  receptorNombre: z.string().optional().nullable(),
  receptorDocumento: z.string().optional().nullable(),
  firmaBase64: z.string().optional().nullable(),
  fotoUrl: z.string().optional().nullable(),
  geoLat: z.number().optional().nullable(),
  geoLng: z.number().optional().nullable(),
})

const updateSchema = z.object({
  estado: z.enum(["pendiente", "en_curso", "entregado", "no_entregado"]).optional(),
  horaArribo: z.string().optional().nullable(),
  horaSalida: z.string().optional().nullable(),
  motivoNoEntrega: z.string().optional().nullable(),
  evidencia: evidenciaSchema.optional(),
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

    const parada = await prisma.paradaRuta.findFirst({
      where: { id, hojaRuta: { empresaId: ctx.auth.empresaId } },
      include: { envio: true },
    })
    if (!parada) return NextResponse.json({ error: "Parada no encontrada" }, { status: 404 })

    const updated = await prisma.paradaRuta.update({
      where: { id },
      data: {
        ...(parsed.data.estado && { estado: parsed.data.estado }),
        ...(parsed.data.horaArribo !== undefined && {
          horaArribo: parsed.data.horaArribo ? new Date(parsed.data.horaArribo) : null,
        }),
        ...(parsed.data.horaSalida !== undefined && {
          horaSalida: parsed.data.horaSalida ? new Date(parsed.data.horaSalida) : null,
        }),
        ...(parsed.data.motivoNoEntrega !== undefined && { motivoNoEntrega: parsed.data.motivoNoEntrega }),
      },
    })

    if (parsed.data.evidencia) {
      await prisma.evidenciaEntrega.upsert({
        where: { paradaId: updated.id },
        update: {
          receptorNombre: parsed.data.evidencia.receptorNombre ?? null,
          receptorDocumento: parsed.data.evidencia.receptorDocumento ?? null,
          firmaBase64: parsed.data.evidencia.firmaBase64 ?? null,
          fotoUrl: parsed.data.evidencia.fotoUrl ?? null,
          geoLat: parsed.data.evidencia.geoLat ?? null,
          geoLng: parsed.data.evidencia.geoLng ?? null,
          fecha: new Date(),
        },
        create: {
          paradaId: updated.id,
          receptorNombre: parsed.data.evidencia.receptorNombre ?? null,
          receptorDocumento: parsed.data.evidencia.receptorDocumento ?? null,
          firmaBase64: parsed.data.evidencia.firmaBase64 ?? null,
          fotoUrl: parsed.data.evidencia.fotoUrl ?? null,
          geoLat: parsed.data.evidencia.geoLat ?? null,
          geoLng: parsed.data.evidencia.geoLng ?? null,
        },
      })
    }

    if (parsed.data.estado === "entregado" && parada.envioId) {
      await prisma.envio.update({
        where: { id: parada.envioId },
        data: { estado: "entregado", fechaEntrega: new Date() },
      })
    }

    if (parsed.data.estado === "no_entregado" && parada.envioId) {
      await prisma.envio.update({
        where: { id: parada.envioId },
        data: { estado: "devuelto" },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error al actualizar parada:", error)
    logError("api/distribucion/paradas/[id]:PATCH", error, request)
    return NextResponse.json({ error: "Error al actualizar parada" }, { status: 500 })
  }
}
