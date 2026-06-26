import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canUseSku } from "@/lib/platform/entitlements"
import { dispararAlertaPanico } from "@/lib/almacen-rosario/panico-service"

const schema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
})

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const acceso = await canUseSku(ctx.auth.empresaId, "pos.panico_vecinal")
  if (!acceso.ok) {
    return NextResponse.json({ error: "Activá pos.panico_vecinal" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)

  const result = await dispararAlertaPanico({
    empresaId: ctx.auth.empresaId,
    usuarioId: ctx.auth.userId,
    lat: parsed.success ? parsed.data.lat : undefined,
    lng: parsed.success ? parsed.data.lng : undefined,
  })

  return NextResponse.json(result)
}