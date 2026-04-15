import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

/**
 * GET /api/membresias/[id] — Get membership detail
 * PATCH /api/membresias/[id] — Update membership (renew, suspend, cancel)
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { id } = await params
  const membresia = await prisma.membresia.findUnique({
    where: { id: Number(id) },
    include: {
      plan: true,
      cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
    },
  })

  if (!membresia) return NextResponse.json({ error: "Membresía no encontrada" }, { status: 404 })

  return NextResponse.json({ success: true, membresia })
}

const actualizarSchema = z.object({
  accion: z.enum(["renovar", "suspender", "cancelar", "reactivar"]),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { id } = await params
  const body = await request.json()
  const { accion } = actualizarSchema.parse(body)

  const { membresiasService } = await import("@/lib/membresias/membresias-service")

  let result
  switch (accion) {
    case "renovar":
      result = await membresiasService.renovarMembresia(Number(id))
      break
    case "suspender":
      result = await membresiasService.suspenderMembresia(Number(id))
      break
    case "cancelar":
      result = await membresiasService.cancelarMembresia(Number(id))
      break
    case "reactivar":
      result = await prisma.membresia.update({
        where: { id: Number(id) },
        data: { estado: "activa" },
      })
      break
  }

  return NextResponse.json({ success: true, membresia: result })
}
