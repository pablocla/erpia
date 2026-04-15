import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

/**
 * GET /api/hospitalidad/mesas — List all tables with current state
 * POST /api/hospitalidad/mesas — Create a new table
 */

const crearMesaSchema = z.object({
  salonId: z.number().int().positive(),
  numero: z.number().int().positive(),
  capacidad: z.number().int().positive().default(4),
  posX: z.number().int().optional(),
  posY: z.number().int().optional(),
})

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const params = request.nextUrl.searchParams
  const salonId = params.get("salonId")

  const { hospitalidadService } = await import("@/lib/hospitalidad/hospitalidad-service")
  const mesas = await hospitalidadService.listarMesas(
    ctx.auth.empresaId,
    salonId ? Number(salonId) : undefined,
  )

  return NextResponse.json({ success: true, mesas })
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()
  const data = crearMesaSchema.parse(body)

  // Verify salon belongs to empresa
  const salon = await prisma.salon.findFirst({
    where: whereEmpresa(ctx.auth.empresaId, { id: data.salonId }),
  })
  if (!salon) return NextResponse.json({ error: "Salón no encontrado" }, { status: 404 })

  const { hospitalidadService } = await import("@/lib/hospitalidad/hospitalidad-service")
  const mesa = await hospitalidadService.crearMesa(data.salonId, data)

  return NextResponse.json({ success: true, mesa }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()
  const { mesaId, estado } = z.object({
    mesaId: z.number().int().positive(),
    estado: z.enum(["libre", "ocupada", "reservada", "cuenta_pedida"]),
  }).parse(body)

  const { hospitalidadService } = await import("@/lib/hospitalidad/hospitalidad-service")
  const mesa = await hospitalidadService.actualizarEstadoMesa(mesaId, estado)

  return NextResponse.json({ success: true, mesa })
}
