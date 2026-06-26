import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { obtenerConfigFiado, guardarConfigFiado } from "@/lib/fiado/fiado-service"

const patchSchema = z.object({
  emailDuenoAlmacen: z.string().email().optional().or(z.literal("")).nullable(),
  fiadoRequiereLimite: z.boolean().optional(),
  fiadoNotificarWhatsApp: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const config = await obtenerConfigFiado(ctx.auth.empresaId)
  if (!config) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

  return NextResponse.json(config)
}

export async function PATCH(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  if (!["admin", "propietario", "administrador", "dueno"].includes(ctx.auth.rol)) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const data = {
    ...parsed.data,
    emailDuenoAlmacen: parsed.data.emailDuenoAlmacen === "" ? null : parsed.data.emailDuenoAlmacen,
  }

  const updated = await guardarConfigFiado(ctx.auth.empresaId, data)
  return NextResponse.json(updated)
}