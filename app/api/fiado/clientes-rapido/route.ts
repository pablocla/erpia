import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { canUseSku } from "@/lib/platform/entitlements"

const schema = z.object({
  nombre: z.string().min(2),
  telefono: z.string().optional(),
  limiteCredito: z.number().min(0),
  emailNotificacionFiado: z.string().email().optional().or(z.literal("")),
  fiadoHabilitado: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const isLicensed = await canUseSku(ctx.auth.empresaId, "pos.fiado_barrio")
  if (!isLicensed.ok) return NextResponse.json({ error: "SKU_REQUIRED" }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { nombre, telefono, limiteCredito, emailNotificacionFiado, fiadoHabilitado } = parsed.data

  const cliente = await prisma.cliente.create({
    data: {
      empresaId: ctx.auth.empresaId,
      nombre,
      telefono: telefono ?? null,
      cuit: `FIADO-${Date.now().toString(36).toUpperCase()}`,
      condicionIva: "Consumidor Final",
      limiteCredito,
      fiadoHabilitado,
      emailNotificacionFiado: emailNotificacionFiado || null,
    },
  })

  return NextResponse.json(cliente, { status: 201 })
}