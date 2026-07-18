import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { crearSolicitudIntegracion } from "@/lib/integrations/connection-service"
import { prisma } from "@/lib/prisma"

const Schema = z.object({
  nombreSistema: z.string().min(2).max(120),
  sitioWeb: z.string().url().optional().or(z.literal("")),
  syncItems: z.array(z.string()).min(1),
  descripcion: z.string().max(2000).optional(),
  emailContacto: z.string().email(),
})

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
  }

  const solicitud = await crearSolicitudIntegracion(ctx.auth.empresaId, {
    ...parsed.data,
    sitioWeb: parsed.data.sitioWeb || undefined,
    usuarioId: ctx.auth.userId,
  })

  return NextResponse.json({ success: true, solicitud }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const solicitudes = await prisma.solicitudIntegracion.findMany({
    where: { empresaId: ctx.auth.empresaId },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return NextResponse.json({ success: true, solicitudes })
}