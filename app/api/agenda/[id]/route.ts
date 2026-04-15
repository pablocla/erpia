import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

/**
 * GET /api/agenda/[id] — Get single appointment
 * PATCH /api/agenda/[id] — Update appointment status/details
 * DELETE /api/agenda/[id] — Cancel appointment
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { id } = await params
  const turno = await prisma.turno.findUnique({
    where: { id: Number(id) },
    include: {
      profesional: true,
      cliente: true,
    },
  })

  if (!turno) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })

  return NextResponse.json({ success: true, turno })
}

const actualizarSchema = z.object({
  estado: z.enum(["pendiente", "confirmado", "en_curso", "completado", "cancelado", "no_asistio"]).optional(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  motivo: z.string().optional(),
  notas: z.string().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { id } = await params
  const body = await request.json()
  const data = actualizarSchema.parse(body)

  const turno = await prisma.turno.update({
    where: { id: Number(id) },
    data: {
      ...(data.estado && { estado: data.estado }),
      ...(data.horaInicio && { horaInicio: data.horaInicio }),
      ...(data.horaFin && { horaFin: data.horaFin }),
      ...(data.motivo !== undefined && { motivo: data.motivo }),
      ...(data.notas !== undefined && { notas: data.notas }),
    },
    include: { profesional: true, cliente: true },
  })

  return NextResponse.json({ success: true, turno })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { id } = await params
  const turno = await prisma.turno.update({
    where: { id: Number(id) },
    data: { estado: "cancelado" },
  })

  return NextResponse.json({ success: true, turno })
}
