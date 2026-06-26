import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canUseSku } from "@/lib/platform/entitlements"
import { buscarValeActivo } from "@/lib/almacen-rosario/vale-dinero-service"

const schema = z.object({
  numero: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const acceso = await canUseSku(ctx.auth.empresaId, "pos.vale_dinero")
    if (!acceso.ok) {
      return NextResponse.json({ error: "Vale de dinero no activo" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Número de vale requerido" }, { status: 400 })
    }

    const vale = await buscarValeActivo(ctx.auth.empresaId, parsed.data.numero)
    if (!vale) {
      return NextResponse.json({ error: "Vale no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      numero: vale.numero,
      saldoRestante: vale.saldoRestante,
      montoOriginal: vale.montoOriginal,
      titularNombre: vale.titularNombre,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al validar vale" },
      { status: 400 },
    )
  }
}